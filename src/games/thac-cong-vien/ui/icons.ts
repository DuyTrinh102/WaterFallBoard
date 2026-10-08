// Icon nét vẽ tự tạo cho 9 trò chơi (viewBox 0 0 64 64). Xem assets/ATTRIBUTION.md.
// Thay cho emoji: emoji hiển thị khác nhau giữa các máy và có thể thiếu trên máy quán.
export const ICON_PATHS: Record<string, string> = {
  circus: "<path d=\"M6 50H58\"/><path d=\"M10 50L32 16L54 50Z\" fill=\"#fff\"/><path d=\"M32 16L24 50M32 16L40 50\"/><path d=\"M27 50Q32 40 37 50\" fill=\"#1B2A2F\"/><path d=\"M32 16V7L41 10L32 13\"/>\n",
  ghost: "<path d=\"M18 54V30a14 14 0 0 1 28 0V54l-5-4-4.5 4-4.5-4-4.5 4-4.5-4Z\" fill=\"#fff\"/><circle cx=\"27\" cy=\"30\" r=\"2.5\" fill=\"#1B2A2F\"/><circle cx=\"37\" cy=\"30\" r=\"2.5\" fill=\"#1B2A2F\"/><ellipse cx=\"32\" cy=\"40\" rx=\"3\" ry=\"4\"/>\n",
  rocket: "<path d=\"M32 6C42 16 44 30 40 44H24C20 30 22 16 32 6Z\" fill=\"#fff\"/><circle cx=\"32\" cy=\"24\" r=\"5\"/><path d=\"M24 34L15 46L24 44M40 34L49 46L40 44\"/><path d=\"M28 49Q32 59 36 49\"/>\n",
  carousel: "<path d=\"M10 22L32 8L54 22Z\" fill=\"#fff\"/><path d=\"M10 22q5.5 6 11 0q5.5 6 11 0q5.5 6 11 0q5.5 6 11 0\"/><path d=\"M18 27V50M32 27V50M46 27V50\"/><circle cx=\"18\" cy=\"38\" r=\"3.5\" fill=\"#fff\"/><circle cx=\"32\" cy=\"42\" r=\"3.5\" fill=\"#fff\"/><circle cx=\"46\" cy=\"36\" r=\"3.5\" fill=\"#fff\"/><path d=\"M8 50H56V56H8Z\" fill=\"#fff\"/>\n",
  train: "<path d=\"M6 57H58\"/><rect x=\"34\" y=\"16\" width=\"18\" height=\"26\" rx=\"2\" fill=\"#fff\"/><rect x=\"38\" y=\"21\" width=\"10\" height=\"8\" rx=\"1\"/><rect x=\"12\" y=\"27\" width=\"22\" height=\"15\" rx=\"3\" fill=\"#fff\"/><path d=\"M17 27V17H24V27\"/><circle cx=\"20\" cy=\"48\" r=\"6\" fill=\"#fff\"/><circle cx=\"43\" cy=\"48\" r=\"6\" fill=\"#fff\"/>\n",
  boat: "<circle cx=\"25\" cy=\"27\" r=\"4.5\"/><circle cx=\"39\" cy=\"27\" r=\"4.5\"/><path d=\"M9 34H55L48 46H16Z\" fill=\"#fff\"/><path d=\"M6 54q6-5 12 0t12 0t12 0t12 0\"/>\n",
  coaster: "<path d=\"M6 58H58\"/><path d=\"M12 50V58M52 50V58M30 44V58M44 30V58\"/><path d=\"M6 50C16 50 18 18 30 18C42 18 40 44 30 44C21 44 25 26 40 26C51 26 52 50 58 50\"/><circle cx=\"20\" cy=\"27\" r=\"3\" fill=\"#1B2A2F\"/>\n",
  wheel: "<path d=\"M22 58L32 28L42 58M18 58H46\"/><circle cx=\"32\" cy=\"28\" r=\"20\" fill=\"#fff\"/><path d=\"M32 8V48M12 28H52M18 14L46 42M46 14L18 42\"/><circle cx=\"32\" cy=\"28\" r=\"4\" fill=\"#1B2A2F\"/>\n",
  splash: "<path d=\"M10 12V58M18 20V58M10 26H18M10 40H18\"/><path d=\"M10 12H20C32 12 30 40 46 44H58\"/><path d=\"M18 20C26 20 26 50 44 52H58\"/><path d=\"M50 26q4 6 0 8q-4-2 0-8Z\" fill=\"#5BC0EB\"/><path d=\"M57 32q3 4 0 6q-3-2 0-6Z\" fill=\"#5BC0EB\"/>\n",
};

export const ICON_STROKE = { stroke: "#1B2A2F", strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;

/** Màu nền từng loại trò chơi (giao diện, không phải luật). */
export const TILE_TINT: Record<string, string> = {
  circus: "#FFD6C9", ghost: "#E3DCF7", rocket: "#CFE3FF", carousel: "#FFE7A8", train: "#D7F0C8",
  boat: "#C7EFE6", coaster: "#FFC9DD", wheel: "#F6E1C3", splash: "#BFE8FF",
};
