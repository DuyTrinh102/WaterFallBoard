import { useRef } from "react";
import type { CellId, GameState } from "../engine/types";
import { attrOf, playerOf } from "./util";

export const CELL = 90;
export const COLS = 14;
export const ROWS = 6;
const GAP_COL = 7; // cột thác nước giữa hai vùng

export interface CellMark {
  color: string;
  kind: "buildable" | "selected" | "dealt";
}

export interface BoardProps {
  state: GameState;
  width: number;
  /** Ô được nhấn mạnh (ô xây được, ô đang chọn...). */
  marks?: Map<CellId, CellMark>;
  /** Tuile xem trước (mờ). */
  previews?: { cell: CellId; icon: string }[];
  /** Nhãn thu nhập trên ô đầu nhóm. */
  badges?: Map<CellId, string>;
  /** Bản đồ nhỏ: không hiện chủ/tuile chi tiết để gọn. */
  mini?: boolean;
  /** Ẩn thông tin chủ sở hữu (dùng khi xem riêng). */
  onCellTap?: (cell: CellId) => void;
}

export function Board({ state, width, marks, previews, badges, mini, onCellTap }: BoardProps) {
  const down = useRef(new Map<number, CellId>());
  const vbW = COLS * CELL;
  const vbH = ROWS * CELL;
  const height = (width * vbH) / vbW;
  const cellFrom = (target: EventTarget | null): CellId | null => {
    const el = (target as Element | null)?.closest?.("[data-cell]");
    return el ? Number(el.getAttribute("data-cell")) : null;
  };
  return (
    <svg
      className={mini ? "board mini" : "board"}
      width={width}
      height={height}
      viewBox={`0 0 ${vbW} ${vbH}`}
      onPointerDown={(e) => {
        const c = cellFrom(e.target);
        if (c !== null) down.current.set(e.pointerId, c);
      }}
      onPointerUp={(e) => {
        const start = down.current.get(e.pointerId);
        down.current.delete(e.pointerId);
        const c = cellFrom(document.elementFromPoint(e.clientX, e.clientY));
        if (start !== undefined && c === start && onCellTap) onCellTap(c);
      }}
      onPointerCancel={(e) => down.current.delete(e.pointerId)}
    >
      <defs>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={vbW} height={vbH} rx={24} fill="#d9f99d" />
      <rect x={GAP_COL * CELL + 12} y={0} width={CELL - 24} height={vbH} fill="url(#water)" rx={12} />
      {!mini &&
        [0.15, 0.4, 0.65, 0.9].map((f) => (
          <text key={f} x={GAP_COL * CELL + CELL / 2} y={vbH * f} textAnchor="middle" fontSize={34} opacity={0.6}>
            〰
          </text>
        ))}
      {state.ruleset.topology.cells.map((tc) => {
        const cell = state.cells[tc.id];
        const owner = playerOf(state, cell.owner);
        const tile = cell.tile ? attrOf(state, state.tileTypes[cell.tile]) : null;
        const mark = marks?.get(tc.id);
        const x = tc.col * CELL;
        const y = tc.row * CELL;
        const pad = 4;
        return (
          <g key={tc.id} data-cell={tc.id} className={mark ? `cell mark-${mark.kind}` : "cell"} style={{ cursor: onCellTap ? "pointer" : undefined }}>
            <rect
              x={x + pad}
              y={y + pad}
              width={CELL - 2 * pad}
              height={CELL - 2 * pad}
              rx={12}
              fill={owner ? owner.color + (tile ? "55" : "33") : "#f7fee7"}
              stroke={mark ? mark.color : owner ? owner.color : "#a3c76d"}
              strokeWidth={mark ? 8 : owner ? 4 : 2}
            />
            {tile && (
              <text x={x + CELL / 2} y={y + CELL / 2 + (mini ? 14 : 16)} textAnchor="middle" fontSize={mini ? 46 : 44}>
                {tile.icon}
              </text>
            )}
            {!mini && tile && (
              <text x={x + CELL - 14} y={y + CELL - 12} textAnchor="end" fontSize={18} fontWeight={800} fill="#1f2937">
                {tile.maxSize}
              </text>
            )}
            {!mini && (
              <>
                <text x={x + 12} y={y + 26} fontSize={20} fontWeight={700} fill="#374151">
                  {tc.id}
                </text>
                {/* lặp số ô xoay 180° để đọc được từ phía đối diện */}
                <text x={x + CELL - 12} y={y + CELL - 26} fontSize={16} fontWeight={600} fill="#6b7280" transform={`rotate(180 ${x + CELL - 22} ${y + CELL - 32})`}>
                  {tc.id}
                </text>
              </>
            )}
            {mini && !tile && (
              <text x={x + CELL / 2} y={y + CELL / 2 + 12} textAnchor="middle" fontSize={34} fontWeight={700} fill="#4b5563">
                {tc.id}
              </text>
            )}
            {owner && !mini && (
              <text x={x + CELL - 12} y={y + 28} textAnchor="end" fontSize={22} fill={owner.color}>
                {owner.icon}
              </text>
            )}
            {badges?.get(tc.id) && (
              <g>
                <rect x={x + 8} y={y + CELL - 40} width={CELL - 16} height={32} rx={16} fill="#fbbf24" stroke="#92400e" strokeWidth={2} />
                <text x={x + CELL / 2} y={y + CELL - 17} textAnchor="middle" fontSize={22} fontWeight={800} fill="#78350f">
                  {badges.get(tc.id)}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {previews?.map((p) => {
        const tc = state.ruleset.topology.cells.find((c) => c.id === p.cell)!;
        return (
          <text key={`pv-${p.cell}`} className="preview" x={tc.col * CELL + CELL / 2} y={tc.row * CELL + CELL / 2 + 16} textAnchor="middle" fontSize={48} opacity={0.55} pointerEvents="none">
            {p.icon}
          </text>
        );
      })}
    </svg>
  );
}
