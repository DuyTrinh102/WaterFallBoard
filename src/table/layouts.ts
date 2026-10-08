/** Khung tham chiếu 1920×1080 (giả định — docs/product-brief.md §3). */
export const STAGE_W = 1920;
export const STAGE_H = 1080;
/** Độ dày khay. */
export const TRAY = 216;

export type SeatId = "S" | "S1" | "S2" | "N" | "E" | "W";

export interface SeatSlot {
  id: SeatId;
  /** Hộp trên màn hình (toạ độ stage). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Góc xoay nội dung để chữ hướng về người ngồi ở cạnh đó. */
  rotation: 0 | 90 | 180 | -90;
  labelKey: string;
}

const LONG = STAGE_W - 2 * TRAY;
// Khay cạnh ngắn chạy hết chiều cao màn hình (chiếm luôn 4 góc), để đủ chỗ cho thẻ giao dịch.
const SHORT = STAGE_H;

export const SLOTS: Record<SeatId, SeatSlot> = {
  S: { id: "S", x: TRAY, y: STAGE_H - TRAY, w: LONG, h: TRAY, rotation: 0, labelKey: "Cạnh dưới" },
  S1: { id: "S1", x: TRAY, y: STAGE_H - TRAY, w: LONG / 2, h: TRAY, rotation: 0, labelKey: "Dưới-trái" },
  S2: { id: "S2", x: TRAY + LONG / 2, y: STAGE_H - TRAY, w: LONG / 2, h: TRAY, rotation: 0, labelKey: "Dưới-phải" },
  N: { id: "N", x: TRAY, y: 0, w: LONG, h: TRAY, rotation: 180, labelKey: "Cạnh trên" },
  E: { id: "E", x: STAGE_W - TRAY, y: 0, w: TRAY, h: SHORT, rotation: -90, labelKey: "Cạnh phải" },
  W: { id: "W", x: 0, y: 0, w: TRAY, h: SHORT, rotation: 90, labelKey: "Cạnh trái" },
};

/** Ghế theo chiều kim đồng hồ nhìn từ trên xuống (S → W → N → E). */
export const LAYOUTS: Record<3 | 4 | 5, SeatId[]> = {
  3: ["S", "N", "E"],
  4: ["S", "W", "N", "E"],
  5: ["S1", "W", "N", "E", "S2"],
};

/** Kích thước nội dung khay sau khi xoay (luôn: rộng = dọc theo cạnh, cao = độ dày). */
export function innerSize(slot: SeatSlot) {
  const sideways = slot.rotation === 90 || slot.rotation === -90;
  return sideways ? { w: slot.h, h: slot.w } : { w: slot.w, h: slot.h };
}

/** Chuyển một điểm trong hệ toạ độ nội dung khay về toạ độ stage (dùng cho test & định vị). */
export function trayToStage(slot: SeatSlot, px: number, py: number): { x: number; y: number } {
  const { w, h } = innerSize(slot);
  // gốc ở tâm khay
  const dx = px - w / 2;
  const dy = py - h / 2;
  const rad = (slot.rotation * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));
  return {
    x: slot.x + slot.w / 2 + dx * cos - dy * sin,
    y: slot.y + slot.h / 2 + dx * sin + dy * cos,
  };
}
