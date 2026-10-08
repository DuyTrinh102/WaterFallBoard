import type { CellId, GameState, IncomeBreakdown, IncomeGroup, PlayerIncome, Ruleset } from "./types";

export function groupValue(ruleset: Ruleset, size: number, maxSize: number): number {
  if (size <= 0 || size > maxSize) return Number.NEGATIVE_INFINITY;
  if (size === maxSize) return ruleset.incomeComplete[maxSize] ?? 0;
  return ruleset.incomeIncomplete[size] ?? 0;
}

export function neighborMap(ruleset: Ruleset): Map<CellId, CellId[]> {
  return new Map(ruleset.topology.cells.map((c) => [c.id, c.neighbors]));
}

/** Các thành phần liên thông của tập ô (theo topology, không theo pixel). */
export function connectedComponents(cells: CellId[], nb: Map<CellId, CellId[]>): CellId[][] {
  const set = new Set(cells);
  const seen = new Set<CellId>();
  const out: CellId[][] = [];
  for (const start of [...cells].sort((a, b) => a - b)) {
    if (seen.has(start)) continue;
    const comp: CellId[] = [];
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const c = stack.pop()!;
      comp.push(c);
      for (const n of nb.get(c) ?? []) {
        if (set.has(n) && !seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    out.push(comp.sort((a, b) => a - b));
  }
  return out;
}

function popcount(x: number): number {
  let c = 0;
  while (x) {
    x &= x - 1;
    c++;
  }
  return c;
}

/**
 * Phân hoạch một component thành các nhóm liên thông, mỗi nhóm ≤ maxSize,
 * sao cho tổng thu nhập lớn nhất. DP trên bitmask + memo. Component ≤ ~20 ô.
 */
export function bestPartition(
  comp: CellId[],
  maxSize: number,
  value: (size: number) => number,
  nb: Map<CellId, CellId[]>,
): { total: number; groups: CellId[][] } {
  const n = comp.length;
  if (n > 24) throw new Error("component too large for exact partition");
  const idx = new Map(comp.map((c, i) => [c, i]));
  const adj = comp.map((c) => {
    let m = 0;
    for (const x of nb.get(c) ?? []) {
      const j = idx.get(x);
      if (j !== undefined) m |= 1 << j;
    }
    return m;
  });
  const connCache = new Map<number, boolean>();
  const isConnected = (mask: number): boolean => {
    const hit = connCache.get(mask);
    if (hit !== undefined) return hit;
    const low = mask & -mask;
    let seen = low;
    let frontier = low;
    while (frontier) {
      let nf = 0;
      let f = frontier;
      while (f) {
        const bit = f & -f;
        f ^= bit;
        nf |= adj[31 - Math.clz32(bit)];
      }
      nf &= mask & ~seen;
      seen |= nf;
      frontier = nf;
    }
    const ok = seen === mask;
    connCache.set(mask, ok);
    return ok;
  };
  const memo = new Map<number, { total: number; pick: number }>();
  const solve = (mask: number): number => {
    if (mask === 0) return 0;
    const m = memo.get(mask);
    if (m) return m.total;
    const low = mask & -mask;
    const rest = mask ^ low;
    let best = Number.NEGATIVE_INFINITY;
    let bestPick = 0;
    // duyệt mọi submask của rest, cộng bit thấp nhất
    for (let sub = rest; ; sub = (sub - 1) & rest) {
      const s = sub | low;
      const size = popcount(s);
      if (size <= maxSize && isConnected(s)) {
        const v = value(size) + solve(mask ^ s);
        if (v > best) {
          best = v;
          bestPick = s;
        }
      }
      if (sub === 0) break;
    }
    memo.set(mask, { total: best, pick: bestPick });
    return best;
  };
  const full = n === 0 ? 0 : (2 ** n - 1) | 0;
  const total = solve(full);
  const groups: CellId[][] = [];
  let mask = full;
  while (mask) {
    const pick = memo.get(mask)!.pick;
    groups.push(comp.filter((_, i) => pick & (1 << i)));
    mask ^= pick;
  }
  return { total, groups };
}

export function computeIncome(state: GameState): IncomeBreakdown {
  const rs = state.ruleset;
  const nb = neighborMap(rs);
  const players: PlayerIncome[] = state.players.map((p) => {
    const groups: IncomeGroup[] = [];
    for (const type of rs.attractionTypes) {
      const cells = Object.entries(state.cells)
        .filter(([, c]) => c.owner === p.id && c.tile && state.tileTypes[c.tile] === type.id)
        .map(([id]) => Number(id));
      for (const comp of connectedComponents(cells, nb)) {
        const { groups: parts } = bestPartition(comp, type.maxSize, (s) => groupValue(rs, s, type.maxSize), nb);
        for (const g of parts) {
          groups.push({
            type: type.id,
            cells: g,
            size: g.length,
            complete: g.length === type.maxSize,
            amount: groupValue(rs, g.length, type.maxSize),
          });
        }
      }
    }
    return { player: p.id, total: groups.reduce((s, g) => s + g.amount, 0), groups };
  });
  return { round: state.round, players };
}
