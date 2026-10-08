import { createGame, dispatch } from "../../src/games/thac-cong-vien/engine/game";
import { DEFAULT_PLAYERS } from "../../src/games/thac-cong-vien/engine/simulate";
import type { Command, DispatchResult, GameState } from "../../src/games/thac-cong-vien/engine/types";
import { fixtureThacV1 } from "../../src/games/thac-cong-vien/rules/fixture-thac-v1";

let counter = 0;

export function newGame(players: 3 | 4 | 5 = 3, seed = "test"): GameState {
  return createGame(
    { ruleset: fixtureThacV1, players: DEFAULT_PLAYERS.slice(0, players), options: { moneyVisibility: "open", presetKey: "preset.open" } },
    seed,
  );
}

export function run(state: GameState, command: Command, commandId = `cmd-${++counter}`): DispatchResult {
  return dispatch(state, { commandId, command });
}

export function ok(state: GameState, command: Command): GameState {
  const r = run(state, command);
  if (!r.ok) throw new Error(`expected ok, got ${r.error} for ${JSON.stringify(command)}`);
  return r.state;
}

/** Đi qua pha chuẩn bị: mỗi người bỏ 2 thẻ đầu. */
export function finishPrep(state: GameState): GameState {
  let s = state;
  for (const p of s.players) {
    s = ok(s, { type: "chooseDiscards", player: p.id, cards: s.prep!.dealt[p.id].slice(0, 2) });
  }
  return s;
}

export function allReady(state: GameState): GameState {
  let s = state;
  for (const p of s.players) s = ok(s, { type: "setReady", player: p.id, ready: true });
  return s;
}

/** State trống (mọi ô không chủ, không tuile) ở pha xây dựng — để dựng kịch bản thu nhập. */
export function blankConstruction(players: 3 | 4 | 5 = 3): GameState {
  let s = finishPrep(newGame(players));
  s = allReady(s);
  for (const c of Object.values(s.cells)) {
    c.owner = null;
    c.tile = null;
  }
  for (const t of Object.keys(s.tileLoc)) s.tileLoc[t] = { kind: "deck" };
  s.tileDeck = Object.keys(s.tileLoc);
  // dồn thẻ ô về chồng để giữ invariant
  s.locationDeck = s.ruleset.topology.cells.map((c) => c.id);
  return s;
}

/** Đặt sẵn tuile (bỏ qua luật) — chỉ dùng để dựng fixture test thu nhập. */
export function put(s: GameState, owner: string, type: string, cells: number[]) {
  for (const cell of cells) {
    const tile = Object.keys(s.tileTypes).find((t) => s.tileTypes[t] === type && s.tileLoc[t].kind === "deck")!;
    s.tileLoc[tile] = { kind: "cell", cell };
    s.tileDeck = s.tileDeck.filter((x) => x !== tile);
    s.cells[cell] = { owner, tile };
    s.locationDeck = s.locationDeck.filter((x) => x !== cell);
  }
}
