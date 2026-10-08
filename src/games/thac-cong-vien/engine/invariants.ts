import type { GameState } from "./types";

/** Trả về danh sách vi phạm (rỗng = hợp lệ). Dùng trong test, dev và khi load save. */
export function checkInvariants(s: GameState): string[] {
  const errors: string[] = [];
  const cellIds = s.ruleset.topology.cells.map((c) => c.id);

  // Thẻ/ô: mỗi id nằm đúng một nơi — chồng bài, đang chia, hoặc ô đã có chủ.
  const seen = new Map<number, string>();
  const mark = (id: number, where: string) => {
    if (seen.has(id)) errors.push(`card ${id} in both ${seen.get(id)} and ${where}`);
    seen.set(id, where);
  };
  s.locationDeck.forEach((c) => mark(c, "deck"));
  if (s.prep) for (const [p, cards] of Object.entries(s.prep.dealt)) cards.forEach((c) => mark(c, `dealt:${p}`));
  for (const id of cellIds) if (s.cells[id].owner) mark(id, `owned:${s.cells[id].owner}`);
  for (const id of cellIds) if (!seen.has(id)) errors.push(`card ${id} missing`);

  // Tuile: vị trí khớp với ô.
  const deckSet = new Set(s.tileDeck);
  for (const [t, loc] of Object.entries(s.tileLoc)) {
    if (loc.kind === "deck" && !deckSet.has(t)) errors.push(`tile ${t} marked deck but not in deck`);
    if (loc.kind !== "deck" && deckSet.has(t)) errors.push(`tile ${t} in deck and ${loc.kind}`);
    if (loc.kind === "cell" && s.cells[loc.cell]?.tile !== t) errors.push(`tile ${t} cell mismatch`);
    if (loc.kind === "hand" && !s.players.some((p) => p.id === loc.player)) errors.push(`tile ${t} unknown holder`);
  }
  for (const id of cellIds) {
    const c = s.cells[id];
    if (c.tile && !c.owner) errors.push(`cell ${id} has tile without owner`);
    if (c.tile) {
      const loc = s.tileLoc[c.tile];
      if (loc?.kind !== "cell" || loc.cell !== id) errors.push(`cell ${id} tile location mismatch`);
    }
  }

  // Tiền: không âm và khớp ledger.
  for (const p of s.players) {
    const fromLedger = s.ledger.reduce((sum, e) => sum + (e.to === p.id ? e.amount : 0) - (e.from === p.id ? e.amount : 0), 0);
    if (s.coins[p.id] < 0) errors.push(`player ${p.id} negative coins`);
    if (fromLedger !== s.coins[p.id]) errors.push(`player ${p.id} coins ${s.coins[p.id]} != ledger ${fromLedger}`);
    if (!Number.isInteger(s.coins[p.id])) errors.push(`player ${p.id} non-integer coins`);
  }
  return errors;
}
