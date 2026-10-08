import { describe, expect, it } from "vitest";
import { innerSize, LAYOUTS, SLOTS, STAGE_H, STAGE_W, trayToStage } from "../../src/table/layouts";

describe("toạ độ khay xoay → stage", () => {
  // Điểm "mép gần người ngồi" (giữa cạnh dưới của nội dung khay) phải nằm ở mép màn hình của ghế đó.
  const nearEdge = (id: keyof typeof SLOTS) => {
    const s = SLOTS[id];
    const { w, h } = innerSize(s);
    return trayToStage(s, w / 2, h);
  };
  it("0° (S): mép gần người = đáy màn hình", () => expect(nearEdge("S").y).toBe(STAGE_H));
  it("180° (N): mép gần người = đỉnh màn hình", () => expect(nearEdge("N").y).toBe(0));
  it("-90°/270° (E): mép gần người = cạnh phải", () => expect(nearEdge("E").x).toBe(STAGE_W));
  it("90° (W): mép gần người = cạnh trái", () => expect(nearEdge("W").x).toBe(0));
  it("góc trên-trái nội dung khay E nằm ở phía trên-trái từ góc nhìn người ngồi bên phải", () => {
    const s = SLOTS.E;
    const p = trayToStage(s, 0, 0);
    // người bên phải nhìn sang trái: "trái" của họ là phía dưới màn hình, "trên" của họ là phía board (x nhỏ)
    expect(p).toEqual({ x: s.x, y: s.y + s.h });
  });
  it("khay không chồng lên nhau trong mọi layout", () => {
    for (const ids of Object.values(LAYOUTS)) {
      const boxes = ids.map((id) => SLOTS[id]);
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
          expect(overlap, `${a.id}/${b.id}`).toBe(false);
        }
    }
  });
});
