import { describe, expect, it } from "vitest";
import { buildableCells, handTiles, ownedCells, payIncome, rankPlayers } from "../../src/games/thac-cong-vien/engine/game";
import { bestPartition, computeIncome, connectedComponents, groupValue, neighborMap } from "../../src/games/thac-cong-vien/engine/income";
import { checkInvariants } from "../../src/games/thac-cong-vien/engine/invariants";
import { next, seedToState } from "../../src/games/thac-cong-vien/engine/rng";
import { simulateGame } from "../../src/games/thac-cong-vien/engine/simulate";
import { getPublicView } from "../../src/games/thac-cong-vien/engine/views";
import { fixtureThacV1 as RS } from "../../src/games/thac-cong-vien/rules/fixture-thac-v1";
import { allReady, blankConstruction, finishPrep, newGame, ok, put, run } from "./helpers";

describe("ruleset fixture", () => {
  it("có nhãn fixture và cấu trúc khớp đầu mối", () => {
    expect(RS.isFixture).toBe(true);
    expect(RS.id.startsWith("fixture-")).toBe(true);
    expect(RS.topology.cells).toHaveLength(78);
    expect(RS.attractionTypes.reduce((s, t) => s + t.count, 0)).toBe(72);
    for (const t of RS.attractionTypes) expect(t.count).toBe(2 * t.maxSize);
  });
  it("topology đối xứng, không kề qua thác", () => {
    const nb = neighborMap(RS);
    for (const c of RS.topology.cells) {
      for (const n of c.neighbors) {
        expect(nb.get(n)).toContain(c.id);
        expect(RS.topology.cells.find((x) => x.id === n)!.region).toBe(c.region);
      }
    }
  });
});

describe("setup & PRNG", () => {
  it("cùng seed ⇒ cùng state; khác seed ⇒ khác", () => {
    expect(JSON.stringify(newGame(4, "x"))).toBe(JSON.stringify(newGame(4, "x")));
    expect(newGame(4, "x").locationDeck).not.toEqual(newGame(4, "y").locationDeck);
  });
  it("PRNG tiếp tục giống nhau sau khi serialize", () => {
    let a = seedToState("s");
    for (let i = 0; i < 5; i++) a = next(a)[1];
    const b = JSON.parse(JSON.stringify(a));
    expect(next(a)[0]).toBe(next(b)[0]);
  });
  for (const n of [3, 4, 5] as const) {
    it(`${n} người: chia đúng số thẻ/tuile theo config, invariant giữ`, () => {
      const d = RS.distribution[n][0];
      let s = newGame(n);
      expect(checkInvariants(s)).toEqual([]);
      for (const p of s.players) {
        expect(s.prep!.dealt[p.id]).toHaveLength(d.deal);
        expect(s.coins[p.id]).toBe(RS.startingCoins);
      }
      s = finishPrep(s);
      expect(s.phase).toBe("exchange");
      for (const p of s.players) {
        expect(ownedCells(s, p.id)).toHaveLength(d.keep);
        expect(handTiles(s, p.id)).toHaveLength(d.tiles);
      }
      expect(checkInvariants(s)).toEqual([]);
    });
  }
});

describe("pha chuẩn bị", () => {
  it("từ chối command sai pha", () => {
    const s = newGame();
    const r = run(s, { type: "placeTile", player: "p1", tile: "circus-1", cell: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("wrongPhase");
  });
  it("bỏ sai số lượng / thẻ không được chia / chọn lại đều bị từ chối", () => {
    const s = newGame();
    const dealt = s.prep!.dealt.p1;
    const notDealt = s.locationDeck[0];
    expect(run(s, { type: "chooseDiscards", player: "p1", cards: [dealt[0]] }).ok).toBe(false);
    expect(run(s, { type: "chooseDiscards", player: "p1", cards: [dealt[0], dealt[0]] }).ok).toBe(false);
    expect(run(s, { type: "chooseDiscards", player: "p1", cards: [dealt[0], notDealt] }).ok).toBe(false);
    const s2 = ok(s, { type: "chooseDiscards", player: "p1", cards: [dealt[0], dealt[1]] });
    const r = run(s2, { type: "chooseDiscards", player: "p1", cards: [dealt[2], dealt[3]] });
    expect(!r.ok && r.error).toBe("alreadyChosen");
  });
  it("thẻ bỏ trở về chồng (fixture policy)", () => {
    let s = newGame();
    const discards = s.prep!.dealt.p1.slice(0, 2);
    s = finishPrep(s);
    for (const c of discards) expect(s.locationDeck).toContain(c);
  });
  it("view công khai không chứa thẻ đang chia", () => {
    const s = newGame();
    const json = JSON.stringify(getPublicView(s));
    expect(json).not.toContain("dealt\"");
    expect(json).not.toContain("locationDeck");
  });
  it("preset tiền ẩn: view công khai không có số dư", () => {
    const s = newGame();
    s.options.moneyVisibility = "hidden";
    expect(getPublicView(s).players.every((p) => p.coins === null)).toBe(true);
  });
});

function exchangeState() {
  return finishPrep(newGame(3, "trade"));
}

describe("giao dịch", () => {
  it("tiền + tài sản hai chiều, commit nguyên tử khi đủ xác nhận", () => {
    let s = exchangeState();
    const cell = ownedCells(s, "p1")[0];
    const tile = handTiles(s, "p2")[0];
    s = ok(s, {
      type: "proposeTrade", player: "p1", partner: "p2",
      transfers: [
        { from: "p1", to: "p2", asset: { kind: "cell", id: cell } },
        { from: "p1", to: "p2", asset: { kind: "coins", amount: 2 } },
        { from: "p2", to: "p1", asset: { kind: "tile", id: tile } },
        { from: "p2", to: "p1", asset: { kind: "coins", amount: 1 } },
      ],
    });
    expect(s.trades.T1.status).toBe("open");
    expect(s.cells[cell].owner).toBe("p1");
    s = ok(s, { type: "confirmTrade", player: "p2", tradeId: "T1", revision: 1 });
    expect(s.trades.T1.status).toBe("committed");
    expect(s.cells[cell].owner).toBe("p2");
    expect(s.tileLoc[tile]).toEqual({ kind: "hand", player: "p1" });
    expect(s.coins.p1).toBe(5 - 2 + 1);
    expect(s.coins.p2).toBe(5 + 2 - 1);
    expect(checkInvariants(s)).toEqual([]);
  });
  it("tặng (một chiều) được phép", () => {
    let s = exchangeState();
    s = ok(s, { type: "proposeTrade", player: "p1", partner: "p3", transfers: [{ from: "p1", to: "p3", asset: { kind: "coins", amount: 5 } }] });
    s = ok(s, { type: "confirmTrade", player: "p3", tradeId: "T1", revision: 1 });
    expect(s.coins.p1).toBe(0);
  });
  it("thiếu tiền bị từ chối, state không đổi", () => {
    const s = exchangeState();
    const r = run(s, { type: "proposeTrade", player: "p1", partner: "p2", transfers: [{ from: "p1", to: "p2", asset: { kind: "coins", amount: 6 } }] });
    expect(!r.ok && r.error).toBe("insufficientCoins");
    expect(r.state).toBe(s);
  });
  it("không giao được tài sản không thuộc mình / trùng tài sản", () => {
    const s = exchangeState();
    const cellP2 = ownedCells(s, "p2")[0];
    expect(run(s, { type: "proposeTrade", player: "p1", partner: "p2", transfers: [{ from: "p1", to: "p2", asset: { kind: "cell", id: cellP2 } }] }).ok).toBe(false);
    const c = ownedCells(s, "p1")[0];
    const r = run(s, { type: "proposeTrade", player: "p1", partner: "p2", transfers: [
      { from: "p1", to: "p2", asset: { kind: "cell", id: c } },
      { from: "p1", to: "p2", asset: { kind: "cell", id: c } },
    ] });
    expect(!r.ok && r.error).toBe("duplicateAsset");
  });
  it("sửa đề nghị xoá xác nhận cũ; xác nhận revision cũ bị từ chối", () => {
    let s = exchangeState();
    const c1 = ownedCells(s, "p1")[0];
    s = ok(s, { type: "proposeTrade", player: "p1", partner: "p2", transfers: [{ from: "p1", to: "p2", asset: { kind: "cell", id: c1 } }] });
    s = ok(s, { type: "reviseTrade", player: "p2", tradeId: "T1", transfers: [{ from: "p1", to: "p2", asset: { kind: "coins", amount: 3 } }] });
    expect(s.trades.T1.revision).toBe(2);
    expect(s.trades.T1.confirmations).toEqual({ p2: 2 });
    const stale = run(s, { type: "confirmTrade", player: "p1", tradeId: "T1", revision: 1 });
    expect(!stale.ok && stale.error).toBe("staleRevision");
    s = ok(s, { type: "confirmTrade", player: "p1", tradeId: "T1", revision: 2 });
    expect(s.coins.p2).toBe(8);
  });
  it("double tap cùng commandId không tạo giao dịch thứ hai", () => {
    const s = exchangeState();
    const cmd = { type: "proposeTrade" as const, player: "p1", partner: "p2", transfers: [{ from: "p1", to: "p2", asset: { kind: "coins" as const, amount: 1 } }] };
    const r1 = run(s, cmd, "same-id");
    const r2 = run(r1.state, cmd, "same-id");
    expect(r2.ok && r2.duplicate).toBe(true);
    expect(Object.keys(r2.state.trades)).toHaveLength(1);
  });
  it("hai deal dùng chung tài sản: deal commit trước thắng, deal kia mất hiệu lực", () => {
    let s = exchangeState();
    const c = ownedCells(s, "p1")[0];
    s = ok(s, { type: "proposeTrade", player: "p1", partner: "p2", transfers: [{ from: "p1", to: "p2", asset: { kind: "cell", id: c } }] });
    s = ok(s, { type: "proposeTrade", player: "p1", partner: "p3", transfers: [{ from: "p1", to: "p3", asset: { kind: "cell", id: c } }] });
    s = ok(s, { type: "confirmTrade", player: "p3", tradeId: "T2", revision: 1 });
    expect(s.cells[c].owner).toBe("p3");
    expect(s.trades.T1.status).toBe("void");
    expect(s.trades.T1.voidReason).toBe("trade.void.assetMoved");
    expect(run(s, { type: "confirmTrade", player: "p2", tradeId: "T1", revision: 1 }).ok).toBe(false);
  });
  it("tiền bị tiêu ở deal khác ⇒ xác nhận deal còn lại bị từ chối, không thay đổi gì", () => {
    let s = exchangeState();
    const c = ownedCells(s, "p2")[0];
    s = ok(s, { type: "proposeTrade", player: "p1", partner: "p2", transfers: [{ from: "p1", to: "p2", asset: { kind: "coins", amount: 5 } }, { from: "p2", to: "p1", asset: { kind: "cell", id: c } }] });
    s = ok(s, { type: "proposeTrade", player: "p1", partner: "p3", transfers: [{ from: "p1", to: "p3", asset: { kind: "coins", amount: 5 } }] });
    s = ok(s, { type: "confirmTrade", player: "p3", tradeId: "T2", revision: 1 });
    const before = s;
    const r = run(s, { type: "confirmTrade", player: "p2", tradeId: "T1", revision: 1 });
    expect(!r.ok && r.error).toBe("insufficientCoins");
    expect(r.state).toBe(before);
    expect(before.cells[c].owner).toBe("p2");
  });
  it("người đang ready phải bỏ ready trước khi xác nhận", () => {
    let s = exchangeState();
    s = ok(s, { type: "proposeTrade", player: "p1", partner: "p2", transfers: [{ from: "p1", to: "p2", asset: { kind: "coins", amount: 1 } }] });
    s = ok(s, { type: "setReady", player: "p2", ready: true });
    const r = run(s, { type: "confirmTrade", player: "p2", tradeId: "T1", revision: 1 });
    expect(!r.ok && r.error).toBe("playerReady");
    s = ok(s, { type: "setReady", player: "p2", ready: false });
    s = ok(s, { type: "confirmTrade", player: "p2", tradeId: "T1", revision: 1 });
    expect(s.trades.T1.status).toBe("committed");
  });
  it("kết thúc pha trao đổi huỷ deal đang mở", () => {
    let s = exchangeState();
    s = ok(s, { type: "proposeTrade", player: "p1", partner: "p2", transfers: [{ from: "p1", to: "p2", asset: { kind: "coins", amount: 1 } }] });
    s = allReady(s);
    expect(s.phase).toBe("construction");
    expect(s.trades.T1.status).toBe("void");
    expect(s.coins.p1).toBe(5);
  });
  it("giao dịch ô đã xây: đổi chủ, công trình đứng yên", () => {
    let s = blankConstruction();
    put(s, "p1", "coaster", [1, 2]);
    s.phase = "exchange";
    s = ok(s, { type: "proposeTrade", player: "p1", partner: "p2", transfers: [{ from: "p1", to: "p2", asset: { kind: "cell", id: 2 } }] });
    s = ok(s, { type: "confirmTrade", player: "p2", tradeId: "T1", revision: 1 });
    expect(s.cells[2].owner).toBe("p2");
    expect(s.tileLoc[s.cells[2].tile!]).toEqual({ kind: "cell", cell: 2 });
  });
});

describe("xây dựng", () => {
  it("chỉ xây trên ô trống của mình bằng tuile trong tay", () => {
    let s = allReady(exchangeState());
    expect(s.phase).toBe("construction");
    const mine = buildableCells(s, "p1");
    const other = ownedCells(s, "p2")[0];
    const tile = handTiles(s, "p1")[0];
    const tileP2 = handTiles(s, "p2")[0];
    expect(run(s, { type: "placeTile", player: "p1", tile, cell: other }).ok).toBe(false);
    expect(run(s, { type: "placeTile", player: "p1", tile: tileP2, cell: mine[0] }).ok).toBe(false);
    s = ok(s, { type: "placeTile", player: "p1", tile, cell: mine[0] });
    const r = run(s, { type: "placeTile", player: "p1", tile: handTiles(s, "p1")[0], cell: mine[0] });
    expect(!r.ok && r.error).toBe("cellOccupied");
    expect(checkInvariants(s)).toEqual([]);
  });
  it("tuile chưa xây được giữ sang vòng sau", () => {
    let s = allReady(exchangeState());
    const kept = handTiles(s, "p1");
    s = allReady(s); // construction → income
    s = allReady(s); // income → vòng 2 chuẩn bị
    expect(s.round).toBe(2);
    expect(handTiles(s, "p1")).toEqual(kept);
  });
});

// Oracle: liệt kê mọi phân hoạch tập hợp, lọc nhóm liên thông & ≤ max.
function oracle(comp: number[], max: number, value: (n: number) => number, nb: Map<number, number[]>): number {
  const connected = (g: number[]) => connectedComponents(g, nb).length === 1;
  let best = Number.NEGATIVE_INFINITY;
  const blocks: number[][] = [];
  const rec = (i: number) => {
    if (i === comp.length) {
      if (blocks.every((b) => b.length <= max && connected(b))) {
        best = Math.max(best, blocks.reduce((s, b) => s + value(b.length), 0));
      }
      return;
    }
    for (const b of blocks) {
      b.push(comp[i]);
      rec(i + 1);
      b.pop();
    }
    blocks.push([comp[i]]);
    rec(i + 1);
    blocks.pop();
  };
  rec(0);
  return best;
}

describe("thu nhập", () => {
  const nb = neighborMap(RS);
  const inc = (s: ReturnType<typeof blankConstruction>, p: string) => computeIncome(s).players.find((x) => x.player === p)!;

  it("hai nhóm tách rời cùng loại được tính riêng", () => {
    const s = blankConstruction();
    put(s, "p1", "circus", [1, 2, 3]); // hoàn chỉnh 3
    put(s, "p1", "circus", [5]); // tách rời (4 trống)
    const r = inc(s, "p1");
    expect(r.groups).toHaveLength(2);
    expect(r.total).toBe(RS.incomeComplete[3] + RS.incomeIncomplete[1]);
  });
  it("kề nhau nhưng khác chủ ⇒ không gộp", () => {
    const s = blankConstruction();
    put(s, "p1", "circus", [1, 2]);
    put(s, "p2", "circus", [3]);
    expect(inc(s, "p1").total).toBe(RS.incomeIncomplete[2]);
    expect(inc(s, "p2").total).toBe(RS.incomeIncomplete[1]);
  });
  it("khác loại kề nhau ⇒ không gộp", () => {
    const s = blankConstruction();
    put(s, "p1", "circus", [1, 2]);
    put(s, "p1", "ghost", [3]);
    expect(inc(s, "p1").groups).toHaveLength(2);
  });
  it("không kề qua thác nước", () => {
    const s = blankConstruction();
    put(s, "p1", "circus", [7, 43]); // 7 = mép phải vùng A, 43 = mép trái vùng B
    expect(inc(s, "p1").groups).toHaveLength(2);
  });
  it("nhóm vượt maxSize được chia tối ưu (hình chữ T / phân nhánh)", () => {
    const s = blankConstruction();
    // chữ T: 1-2-3 hàng trên, 9 dưới 2, 16 dưới 9 → 5 ô circus (max 3)
    put(s, "p1", "circus", [1, 2, 3, 9, 16]);
    const r = inc(s, "p1");
    const best = oracle([1, 2, 3, 9, 16], 3, (n) => groupValue(RS, n, 3), nb);
    expect(r.total).toBe(best);
    for (const g of r.groups) {
      expect(g.size).toBeLessThanOrEqual(3);
      expect(connectedComponents(g.cells, nb)).toHaveLength(1);
    }
  });
  it("đổi chủ ô làm thay đổi thu nhập theo chủ mới", () => {
    const s = blankConstruction();
    put(s, "p1", "train", [1, 2, 3, 4]);
    expect(inc(s, "p1").total).toBe(RS.incomeComplete[4]);
    s.cells[4].owner = "p2";
    expect(inc(s, "p1").total).toBe(RS.incomeIncomplete[3]);
    expect(inc(s, "p2").total).toBe(RS.incomeIncomplete[1]);
  });
  it("DP khớp oracle trên 300 hình ngẫu nhiên nhỏ", () => {
    let rng = seedToState("oracle");
    const rand = () => {
      const [v, n] = next(rng);
      rng = n;
      return v;
    };
    // lấy các ô trong khung 4×3 góc trên trái vùng A
    const pool = [1, 2, 3, 4, 8, 9, 10, 11, 15, 16, 17, 18];
    for (let i = 0; i < 300; i++) {
      const chosen = pool.filter(() => rand() < 0.6).slice(0, 9);
      const max = 3 + Math.floor(rand() * 3);
      const value = (n: number) => groupValue(RS, n, max);
      for (const comp of connectedComponents(chosen, nb)) {
        expect(bestPartition(comp, max, value, nb).total).toBe(oracle(comp, max, value, nb));
      }
    }
  });
  it("component lớn nhất có thể (10 ô) tính nhanh", () => {
    const comp = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12];
    const t0 = performance.now();
    bestPartition(comp, 5, (n) => groupValue(RS, n, 5), nb);
    expect(performance.now() - t0).toBeLessThan(100);
  });
  it("trả thu nhập cùng vòng hai lần chỉ trả một lần", () => {
    const s = blankConstruction();
    put(s, "p1", "circus", [1, 2, 3]);
    payIncome(s);
    const coins = s.coins.p1;
    payIncome(s);
    expect(s.coins.p1).toBe(coins);
    expect(s.ledger.filter((e) => e.kind === "income" && e.to === "p1")).toHaveLength(1);
  });
});

describe("chuyển pha & kết thúc", () => {
  it("không chuyển pha khi còn người chưa ready; bỏ ready được", () => {
    let s = exchangeState();
    s = ok(s, { type: "setReady", player: "p1", ready: true });
    s = ok(s, { type: "setReady", player: "p2", ready: true });
    s = ok(s, { type: "setReady", player: "p2", ready: false });
    s = ok(s, { type: "setReady", player: "p3", ready: true });
    expect(s.phase).toBe("exchange");
    s = ok(s, { type: "setReady", player: "p2", ready: true });
    expect(s.phase).toBe("construction");
    expect(Object.values(s.ready).every((r) => !r)).toBe(true);
  });
  it("lặp lại command ready cuối (retry) không chuyển pha hai lần", () => {
    let s = exchangeState();
    s = ok(s, { type: "setReady", player: "p1", ready: true });
    s = ok(s, { type: "setReady", player: "p2", ready: true });
    const r1 = run(s, { type: "setReady", player: "p3", ready: true }, "last-ready");
    const r2 = run(r1.state, { type: "setReady", player: "p3", ready: true }, "last-ready");
    expect(r2.state.phase).toBe("construction");
  });
  for (const n of [3, 4, 5] as const) {
    it(`ván đầy đủ ${n} người kết thúc, invariant giữ sau mọi command`, () => {
      const r = simulateGame(RS, n, `full-${n}`, { checkEvery: true });
      expect(r.invariantErrors).toEqual([]);
      expect(r.state.phase).toBe("ended");
      expect(Object.keys(r.state.paidIncome)).toHaveLength(4);
      expect(r.state.result).toHaveLength(n);
    });
  }
  it("hoà tiền ⇒ nhiều tuile trên bàn hơn thắng; vẫn hoà ⇒ đồng hạng", () => {
    const s = blankConstruction();
    s.coins = { p1: 10, p2: 10, p3: 10 };
    put(s, "p2", "circus", [1]);
    const rank = rankPlayers(s);
    expect(rank[0]).toMatchObject({ player: "p2", rank: 1 });
    expect(rank[1].rank).toBe(2);
    expect(rank[2].rank).toBe(2);
  });
  it("command sau khi kết thúc bị từ chối", () => {
    const r = simulateGame(RS, 3, "end");
    expect(run(r.state, { type: "setReady", player: "p1", ready: true }).ok).toBe(false);
  });
});
