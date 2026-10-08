import { computeIncome } from "./income";
import { seedToState, shuffle } from "./rng";
import type {
  Asset,
  CellId,
  Command,
  CommandEnvelope,
  DispatchResult,
  ErrorCode,
  GameOptions,
  GameState,
  Player,
  PlayerCount,
  PlayerId,
  RankEntry,
  Ruleset,
  TileId,
  Trade,
  Transfer,
} from "./types";

export const SCHEMA_VERSION = 1 as const;
const PROCESSED_KEEP = 500;

export interface GameConfig {
  ruleset: Ruleset;
  players: Player[];
  options: GameOptions;
  gameId?: string;
}

class CommandError extends Error {
  constructor(public code: ErrorCode, public detail?: Record<string, string | number>) {
    super(code);
  }
}

function fail(code: ErrorCode, detail?: Record<string, string | number>): never {
  throw new CommandError(code, detail);
}

function logEvent(s: GameState, key: string, params?: Record<string, string | number>) {
  s.log.push({ seq: s.log.length + 1, round: s.round, key, params });
}

export function createGame(config: GameConfig, seed: string): GameState {
  const { ruleset, players } = config;
  const n = players.length;
  if (n < 3 || n > 5) throw new Error("player count must be 3–5");
  if (new Set(players.map((p) => p.id)).size !== n) throw new Error("duplicate player id");

  const tileTypes: Record<TileId, string> = {};
  for (const t of ruleset.attractionTypes) {
    for (let k = 1; k <= t.count; k++) tileTypes[`${t.id}-${k}`] = t.id;
  }
  let rng = seedToState(seed);
  const [locationDeck, r1] = shuffle(ruleset.topology.cells.map((c) => c.id), rng);
  const [tileDeck, r2] = shuffle(Object.keys(tileTypes), r1);
  rng = r2;

  const s: GameState = {
    schemaVersion: SCHEMA_VERSION,
    gameId: config.gameId ?? `game-${seed}`,
    ruleset,
    options: config.options,
    seed,
    rng,
    revision: 0,
    round: 1,
    phase: "preparation",
    players: players.map((p) => ({ ...p })),
    locationDeck,
    tileDeck,
    tileTypes,
    tileLoc: Object.fromEntries(Object.keys(tileTypes).map((t) => [t, { kind: "deck" as const }])),
    cells: Object.fromEntries(ruleset.topology.cells.map((c) => [c.id, { owner: null, tile: null }])),
    prep: null,
    ready: Object.fromEntries(players.map((p) => [p.id, false])),
    coins: Object.fromEntries(players.map((p) => [p.id, 0])),
    ledger: [],
    trades: {},
    tradeSeq: 0,
    paidIncome: {},
    processed: [],
    log: [],
    result: null,
  };
  for (const p of players) {
    s.coins[p.id] = ruleset.startingCoins;
    s.ledger.push({ id: `start:${p.id}`, round: 0, kind: "start", from: "bank", to: p.id, amount: ruleset.startingCoins });
  }
  logEvent(s, "log.gameStarted", { players: n });
  startPreparation(s);
  return s;
}

function distribution(s: GameState) {
  return s.ruleset.distribution[s.players.length as PlayerCount][s.round - 1];
}

function startPreparation(s: GameState) {
  const d = distribution(s);
  const dealt: Record<PlayerId, CellId[]> = {};
  // Thứ tự xem riêng xoay vòng: mỗi vòng bắt đầu từ người kế tiếp.
  const order = s.players.map((_, i) => s.players[(i + s.round - 1) % s.players.length].id);
  for (const p of s.players) {
    if (s.locationDeck.length < d.deal) throw new Error("location deck exhausted");
    dealt[p.id] = s.locationDeck.splice(0, d.deal).sort((a, b) => a - b);
  }
  s.prep = { dealt, discarded: Object.fromEntries(s.players.map((p) => [p.id, null])), order };
  s.phase = "preparation";
  resetReady(s);
  logEvent(s, "log.roundStarted", { round: s.round });
}

function resetReady(s: GameState) {
  for (const p of s.players) s.ready[p.id] = false;
}

function requirePlayer(s: GameState, id: PlayerId) {
  if (!s.players.some((p) => p.id === id)) fail("unknownPlayer");
}

function requirePhase(s: GameState, ...phases: GameState["phase"][]) {
  if (!phases.includes(s.phase)) fail("wrongPhase", { phase: s.phase });
}

function requireNotReady(s: GameState, p: PlayerId) {
  if (s.ready[p]) fail("playerReady");
}

function finishPreparation(s: GameState) {
  const prep = s.prep!;
  const returned: CellId[] = [];
  for (const p of s.players) {
    const discards = prep.discarded[p.id]!;
    for (const c of prep.dealt[p.id]) {
      if (discards.includes(c)) returned.push(c);
      else s.cells[c].owner = p.id;
    }
  }
  // Fixture: thẻ bị bỏ trả về chồng rồi xáo (rules-spec G3 — CONFLICT, chờ rulebook).
  const [deck, rng] = shuffle([...s.locationDeck, ...returned], s.rng);
  s.locationDeck = deck;
  s.rng = rng;
  const d = distribution(s);
  for (const p of s.players) {
    const tiles = s.tileDeck.splice(0, d.tiles);
    for (const t of tiles) s.tileLoc[t] = { kind: "hand", player: p.id };
  }
  logEvent(s, "log.locationsRevealed", { round: s.round });
  s.prep = null;
  s.phase = "exchange";
  resetReady(s);
}

// ---------- Trades ----------

function assetKey(a: Asset): string | null {
  if (a.kind === "cell") return `cell:${a.id}`;
  if (a.kind === "tile") return `tile:${a.id}`;
  return null;
}

/** Kiểm tra toàn bộ transfer với state hiện tại. Ném lỗi nếu không hợp lệ. */
function validateTransfers(s: GameState, participants: PlayerId[], transfers: Transfer[]) {
  if (transfers.length === 0) fail("emptyTrade");
  const seen = new Set<string>();
  const outgoing: Record<PlayerId, number> = {};
  for (const t of transfers) {
    if (!participants.includes(t.from) || !participants.includes(t.to) || t.from === t.to) fail("badTransfer");
    const a = t.asset;
    if (a.kind === "coins") {
      if (!Number.isInteger(a.amount) || a.amount <= 0) fail("badTransfer");
      outgoing[t.from] = (outgoing[t.from] ?? 0) + a.amount;
      continue;
    }
    const key = assetKey(a)!;
    if (seen.has(key)) fail("duplicateAsset");
    seen.add(key);
    if (a.kind === "cell") {
      const cell = s.cells[a.id];
      if (!cell) fail("unknownCell");
      if (cell.owner !== t.from) fail("notOwner", { cell: a.id });
    } else {
      const loc = s.tileLoc[a.id];
      if (!loc) fail("unknownTile");
      if (loc.kind !== "hand" || loc.player !== t.from) fail("tileNotInHand");
    }
  }
  for (const [p, amt] of Object.entries(outgoing)) {
    if (s.coins[p] < amt) fail("insufficientCoins", { player: p });
  }
}

function normalizeCoins(transfers: Transfer[]): Transfer[] {
  return transfers.filter((t) => t.asset.kind !== "coins" || t.asset.amount !== 0);
}

function commitTrade(s: GameState, trade: Trade) {
  // Đã validate ngay trước; áp dụng tất cả transfer trong cùng một bước (state là bản sao).
  for (const t of trade.transfers) {
    const a = t.asset;
    if (a.kind === "coins") {
      s.coins[t.from] -= a.amount;
      s.coins[t.to] += a.amount;
      s.ledger.push({ id: `trade:${trade.id}:${s.ledger.length}`, round: s.round, kind: "trade", from: t.from, to: t.to, amount: a.amount });
    } else if (a.kind === "cell") {
      s.cells[a.id].owner = t.to; // công trình (nếu có) đứng yên, đổi chủ theo ô
    } else {
      s.tileLoc[a.id] = { kind: "hand", player: t.to };
    }
  }
  trade.status = "committed";
  logEvent(s, "log.tradeCommitted", { trade: trade.id, a: trade.participants[0], b: trade.participants[1] });
  // Deal khác dùng chung tài sản đã đổi chủ ⇒ mất hiệu lực.
  for (const other of Object.values(s.trades)) {
    if (other.status !== "open") continue;
    const assetTransfers = other.transfers.filter((x) => x.asset.kind !== "coins");
    if (assetTransfers.length === 0) continue;
    try {
      validateTransfers(s, other.participants, assetTransfers);
    } catch {
      other.status = "void";
      other.voidReason = "trade.void.assetMoved";
      other.confirmations = {};
    }
  }
}

function applyTradeCommand(s: GameState, cmd: Extract<Command, { type: "proposeTrade" | "reviseTrade" | "confirmTrade" | "cancelTrade" }>) {
  requirePhase(s, "exchange");
  requirePlayer(s, cmd.player);
  if (cmd.type === "proposeTrade") {
    requireNotReady(s, cmd.player);
    requirePlayer(s, cmd.partner);
    const participants = [cmd.player, cmd.partner];
    const transfers = normalizeCoins(cmd.transfers);
    if (cmd.player === cmd.partner) fail("badTransfer");
    validateTransfers(s, participants, transfers);
    const id = `T${++s.tradeSeq}`;
    s.trades[id] = {
      id,
      proposer: cmd.player,
      participants,
      transfers,
      revision: 1,
      confirmations: { [cmd.player]: 1 }, // gửi đề nghị = người gửi xác nhận
      status: "open",
    };
    logEvent(s, "log.tradeProposed", { trade: id, a: cmd.player, b: cmd.partner });
    return;
  }
  const trade = s.trades[cmd.tradeId];
  if (!trade) fail("unknownTrade");
  if (!trade.participants.includes(cmd.player)) fail("notParticipant");
  if (cmd.type === "cancelTrade") {
    if (trade.status !== "open") fail("tradeNotOpen");
    trade.status = "cancelled";
    trade.confirmations = {};
    logEvent(s, "log.tradeCancelled", { trade: trade.id, by: cmd.player });
    return;
  }
  if (trade.status !== "open") fail("tradeNotOpen");
  requireNotReady(s, cmd.player);
  if (cmd.type === "reviseTrade") {
    const transfers = normalizeCoins(cmd.transfers);
    validateTransfers(s, trade.participants, transfers);
    trade.transfers = transfers;
    trade.revision += 1;
    trade.confirmations = { [cmd.player]: trade.revision }; // sửa ⇒ xoá mọi xác nhận cũ
    logEvent(s, "log.tradeRevised", { trade: trade.id, by: cmd.player, revision: trade.revision });
    return;
  }
  // confirmTrade
  if (cmd.revision !== trade.revision) fail("staleRevision", { current: trade.revision });
  validateTransfers(s, trade.participants, trade.transfers);
  trade.confirmations[cmd.player] = trade.revision;
  if (trade.participants.every((p) => trade.confirmations[p] === trade.revision)) commitTrade(s, trade);
}

// ---------- Construction ----------

function applyPlaceTile(s: GameState, cmd: Extract<Command, { type: "placeTile" }>) {
  requirePhase(s, "construction");
  requirePlayer(s, cmd.player);
  requireNotReady(s, cmd.player);
  const loc = s.tileLoc[cmd.tile];
  if (!loc) fail("unknownTile");
  if (loc.kind !== "hand" || loc.player !== cmd.player) fail("tileNotInHand");
  const cell = s.cells[cmd.cell];
  if (!cell) fail("unknownCell");
  if (cell.owner !== cmd.player) fail("notOwner", { cell: cmd.cell });
  if (cell.tile) fail("cellOccupied", { cell: cmd.cell });
  cell.tile = cmd.tile;
  s.tileLoc[cmd.tile] = { kind: "cell", cell: cmd.cell };
  logEvent(s, "log.tileBuilt", { player: cmd.player, type: s.tileTypes[cmd.tile], cell: cmd.cell });
}

// ---------- Phases ----------

/** Trả thu nhập vòng hiện tại đúng một lần (idempotent theo round). */
export function payIncome(s: GameState) {
  if (s.paidIncome[s.round]) return;
  const breakdown = computeIncome(s);
  for (const p of breakdown.players) {
    if (p.total > 0) {
      s.coins[p.player] += p.total;
      s.ledger.push({ id: `${s.gameId}:income:${s.round}:${p.player}`, round: s.round, kind: "income", from: "bank", to: p.player, amount: p.total });
    }
  }
  s.paidIncome[s.round] = breakdown;
  logEvent(s, "log.incomePaid", { round: s.round });
}

export function rankPlayers(s: GameState): RankEntry[] {
  const rows = s.players.map((p) => ({
    player: p.id,
    coins: s.coins[p.id],
    tilesOnBoard: Object.values(s.cells).filter((c) => c.owner === p.id && c.tile).length,
    rank: 0,
  }));
  rows.sort((a, b) => b.coins - a.coins || b.tilesOnBoard - a.tilesOnBoard);
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    r.rank = prev && prev.coins === r.coins && prev.tilesOnBoard === r.tilesOnBoard ? prev.rank : i + 1;
  });
  return rows;
}

function advancePhase(s: GameState) {
  switch (s.phase) {
    case "exchange":
      for (const t of Object.values(s.trades)) {
        if (t.status === "open") {
          t.status = "void";
          t.voidReason = "trade.void.phaseEnded";
          t.confirmations = {};
        }
      }
      s.phase = "construction";
      resetReady(s);
      logEvent(s, "log.phase", { phase: "construction" });
      return;
    case "construction":
      s.phase = "income";
      resetReady(s);
      payIncome(s);
      return;
    case "income":
      if (s.round >= s.ruleset.rounds) {
        s.phase = "ended";
        s.result = rankPlayers(s);
        logEvent(s, "log.gameEnded");
      } else {
        s.round += 1;
        startPreparation(s);
      }
      return;
    default:
      return;
  }
}

function applySetReady(s: GameState, cmd: Extract<Command, { type: "setReady" }>) {
  requirePlayer(s, cmd.player);
  requirePhase(s, "exchange", "construction", "income");
  s.ready[cmd.player] = cmd.ready;
  if (cmd.ready) {
    // Người đã ready rút xác nhận ở các deal đang mở.
    for (const t of Object.values(s.trades)) {
      if (t.status === "open" && t.confirmations[cmd.player] !== undefined) delete t.confirmations[cmd.player];
    }
  }
  if (s.players.every((p) => s.ready[p.id])) advancePhase(s);
}

function applyChooseDiscards(s: GameState, cmd: Extract<Command, { type: "chooseDiscards" }>) {
  requirePhase(s, "preparation");
  requirePlayer(s, cmd.player);
  const prep = s.prep!;
  if (prep.discarded[cmd.player]) fail("alreadyChosen");
  const dealt = prep.dealt[cmd.player];
  const uniq = new Set(cmd.cards);
  if (uniq.size !== s.ruleset.discardCount || cmd.cards.length !== s.ruleset.discardCount || cmd.cards.some((c) => !dealt.includes(c))) {
    fail("badDiscardSelection");
  }
  prep.discarded[cmd.player] = [...cmd.cards].sort((a, b) => a - b);
  logEvent(s, "log.discardChosen", { player: cmd.player });
  if (s.players.every((p) => prep.discarded[p.id])) finishPreparation(s);
}

function applyCommand(s: GameState, cmd: Command) {
  if (s.phase === "ended") fail("wrongPhase", { phase: "ended" });
  switch (cmd.type) {
    case "chooseDiscards":
      return applyChooseDiscards(s, cmd);
    case "proposeTrade":
    case "reviseTrade":
    case "confirmTrade":
    case "cancelTrade":
      return applyTradeCommand(s, cmd);
    case "placeTile":
      return applyPlaceTile(s, cmd);
    case "setReady":
      return applySetReady(s, cmd);
  }
}

/**
 * Điểm vào duy nhất để thay đổi state. Hàm thuần: không mutate `state` đầu vào.
 * Lỗi ⇒ trả về state cũ nguyên vẹn (nguyên tử). commandId lặp ⇒ không áp dụng lần hai.
 */
export function dispatch(state: GameState, env: CommandEnvelope): DispatchResult {
  if (state.processed.includes(env.commandId)) return { ok: true, state, duplicate: true };
  const s = structuredClone(state);
  try {
    applyCommand(s, env.command);
  } catch (e) {
    if (e instanceof CommandError) return { ok: false, state, error: e.code, detail: e.detail };
    throw e;
  }
  s.revision += 1;
  s.processed.push(env.commandId);
  if (s.processed.length > PROCESSED_KEEP) s.processed.splice(0, s.processed.length - PROCESSED_KEEP);
  return { ok: true, state: s, duplicate: false };
}

export function validateCommand(state: GameState, command: Command): { ok: true } | { ok: false; error: ErrorCode } {
  const r = dispatch(state, { commandId: `__validate__${state.revision}`, command });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

// ---------- Helpers cho UI / view ----------

export function handTiles(s: GameState, player: PlayerId): TileId[] {
  return Object.entries(s.tileLoc)
    .filter(([, l]) => l.kind === "hand" && l.player === player)
    .map(([t]) => t)
    .sort();
}

export function ownedCells(s: GameState, player: PlayerId): CellId[] {
  return Object.entries(s.cells)
    .filter(([, c]) => c.owner === player)
    .map(([id]) => Number(id))
    .sort((a, b) => a - b);
}

export function buildableCells(s: GameState, player: PlayerId): CellId[] {
  return ownedCells(s, player).filter((c) => !s.cells[c].tile);
}
