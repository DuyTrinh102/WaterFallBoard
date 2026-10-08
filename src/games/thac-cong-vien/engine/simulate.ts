/**
 * Chạy một ván deterministic không UI bằng các lựa chọn ngẫu nhiên có seed.
 * CHỈ dùng cho test/dev (không phải bot trong game).
 */
import { buildableCells, createGame, dispatch, handTiles, ownedCells } from "./game";
import { checkInvariants } from "./invariants";
import { next, seedToState, type RngState } from "./rng";
import type { Command, GameState, Player, Ruleset } from "./types";

export const DEFAULT_PLAYERS: Player[] = [
  { id: "p1", name: "An", color: "#e5484d", icon: "★" },
  { id: "p2", name: "Bình", color: "#3e63dd", icon: "●" },
  { id: "p3", name: "Chi", color: "#30a46c", icon: "▲" },
  { id: "p4", name: "Dũng", color: "#f5a524", icon: "■" },
  { id: "p5", name: "Én", color: "#8e4ec6", icon: "◆" },
];

export interface SimResult {
  state: GameState;
  commands: number;
  rejected: number;
  invariantErrors: string[];
}

export function simulateGame(ruleset: Ruleset, playerCount: 3 | 4 | 5, seed: string, opts: { checkEvery?: boolean } = {}): SimResult {
  let state = createGame(
    { ruleset, players: DEFAULT_PLAYERS.slice(0, playerCount), options: { moneyVisibility: "open", presetKey: "preset.open" } },
    seed,
  );
  let rng: RngState = seedToState(`sim:${seed}`);
  const rand = () => {
    const [v, n] = next(rng);
    rng = n;
    return v;
  };
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  let commands = 0;
  let rejected = 0;
  const invariantErrors: string[] = [];
  const run = (command: Command) => {
    const r = dispatch(state, { commandId: `c${commands}`, command });
    commands++;
    if (!r.ok) rejected++;
    state = r.state;
    if (opts.checkEvery) invariantErrors.push(...checkInvariants(state).map((e) => `#${commands}: ${e}`));
  };

  let guard = 0;
  while (state.phase !== "ended" && guard++ < 10_000) {
    const players = state.players.map((p) => p.id);
    if (state.phase === "preparation") {
      const p = state.prep!.order.find((id) => state.prep!.discarded[id] === null)!;
      const dealt = [...state.prep!.dealt[p]];
      const a = dealt.splice(Math.floor(rand() * dealt.length), 1)[0];
      const b = pick(dealt);
      run({ type: "chooseDiscards", player: p, cards: [a, b] });
    } else if (state.phase === "exchange") {
      // vài giao dịch ngẫu nhiên, rồi tất cả ready
      for (let i = 0; i < 3; i++) {
        const a = pick(players);
        const b = pick(players.filter((x) => x !== a));
        const aCells = ownedCells(state, a);
        const bTiles = handTiles(state, b);
        if (!aCells.length || !bTiles.length) continue;
        run({
          type: "proposeTrade",
          player: a,
          partner: b,
          transfers: [
            { from: a, to: b, asset: { kind: "cell", id: pick(aCells) } },
            { from: b, to: a, asset: { kind: "tile", id: pick(bTiles) } },
            ...(state.coins[a] > 0 ? [{ from: a, to: b, asset: { kind: "coins" as const, amount: 1 } }] : []),
          ],
        });
        const t = state.trades[`T${state.tradeSeq}`];
        if (t && t.status === "open" && rand() < 0.7) run({ type: "confirmTrade", player: b, tradeId: t.id, revision: t.revision });
      }
      for (const p of players) run({ type: "setReady", player: p, ready: true });
    } else if (state.phase === "construction") {
      for (const p of players) {
        let tiles = handTiles(state, p);
        let cells = buildableCells(state, p);
        while (tiles.length && cells.length && rand() < 0.9) {
          run({ type: "placeTile", player: p, tile: pick(tiles), cell: pick(cells) });
          tiles = handTiles(state, p);
          cells = buildableCells(state, p);
        }
      }
      for (const p of players) run({ type: "setReady", player: p, ready: true });
    } else if (state.phase === "income") {
      for (const p of players) run({ type: "setReady", player: p, ready: true });
    }
  }
  invariantErrors.push(...checkInvariants(state));
  return { state, commands, rejected, invariantErrors };
}
