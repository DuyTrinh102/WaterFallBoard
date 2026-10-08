import type { Ruleset, TopologyCell } from "../engine/types";

/**
 * ⚠️ FIXTURE — DỮ LIỆU GIẢ LẬP, KHÔNG PHẢI LUẬT GỐC.
 * Quyết định D1 (docs/implementation-plan.md §5): chạy với fixture cho đến khi có rulebook.
 * Cấu trúc bám các đầu mối trong docs/rules-spec.md (78 ô, 2 vùng, 72 tuile, maxSize 3/4/5,
 * đủ 2 attraction hoàn chỉnh mỗi loại, 5 xu khởi đầu, bỏ 2 thẻ), nhưng mọi con số
 * phân phối / thu nhập / hình bàn đều là giả định.
 */

function gridRegion(region: string, firstId: number, cols: number, rows: number, colOffset: number): TopologyCell[] {
  const cells: TopologyCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = firstId + r * cols + c;
      const neighbors: number[] = [];
      if (r > 0) neighbors.push(id - cols);
      if (r < rows - 1) neighbors.push(id + cols);
      if (c > 0) neighbors.push(id - 1);
      if (c < cols - 1) neighbors.push(id + 1);
      cells.push({ id, region, col: c + colOffset, row: r, neighbors });
    }
  }
  return cells;
}

// Vùng A: 7×6 = 42 ô (1–42). Thác nước ngăn cách. Vùng B: 6×6 = 36 ô (43–78).
// Ô hai bên thác KHÔNG kề nhau.
const cells = [...gridRegion("A", 1, 7, 6, 0), ...gridRegion("B", 43, 6, 6, 8)];

export const fixtureThacV1: Ruleset = {
  id: "fixture-thac-v1",
  version: "0.1.0",
  isFixture: true,
  labelKey: "ruleset.fixture",
  rounds: 4,
  startingCoins: 5,
  discardCount: 2,
  discardPolicy: "returnAndShuffle",
  partitionPolicy: "maximize",
  attractionTypes: [
    { id: "circus", nameKey: "attr.circus", icon: "🎪", maxSize: 3, count: 6 },
    { id: "ghost", nameKey: "attr.ghost", icon: "👻", maxSize: 3, count: 6 },
    { id: "rocket", nameKey: "attr.rocket", icon: "🚀", maxSize: 3, count: 6 },
    { id: "carousel", nameKey: "attr.carousel", icon: "🎠", maxSize: 4, count: 8 },
    { id: "train", nameKey: "attr.train", icon: "🚂", maxSize: 4, count: 8 },
    { id: "boat", nameKey: "attr.boat", icon: "🛶", maxSize: 4, count: 8 },
    { id: "coaster", nameKey: "attr.coaster", icon: "🎢", maxSize: 5, count: 10 },
    { id: "wheel", nameKey: "attr.wheel", icon: "🎡", maxSize: 5, count: 10 },
    { id: "splash", nameKey: "attr.splash", icon: "🌊", maxSize: 5, count: 10 },
  ],
  distribution: {
    3: [
      { deal: 7, keep: 5, tiles: 5 },
      { deal: 6, keep: 4, tiles: 4 },
      { deal: 5, keep: 3, tiles: 4 },
      { deal: 5, keep: 3, tiles: 4 },
    ],
    4: [
      { deal: 7, keep: 5, tiles: 5 },
      { deal: 5, keep: 3, tiles: 3 },
      { deal: 5, keep: 3, tiles: 3 },
      { deal: 4, keep: 2, tiles: 3 },
    ],
    5: [
      { deal: 6, keep: 4, tiles: 4 },
      { deal: 5, keep: 3, tiles: 3 },
      { deal: 4, keep: 2, tiles: 3 },
      { deal: 4, keep: 2, tiles: 2 },
    ],
  },
  // index = size của nhóm chưa hoàn chỉnh
  incomeIncomplete: [0, 1, 3, 5, 8],
  incomeComplete: { 3: 9, 4: 14, 5: 20 },
  topology: { cells },
};
