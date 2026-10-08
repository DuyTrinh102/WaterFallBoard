import { useMemo, useRef } from "react";
import { computeIncome } from "../engine/income";
import type { CellId, GameState } from "../engine/types";
import { ICON_PATHS, TILE_TINT } from "./icons";
import { attrOf, isSquare, playerOf } from "./util";

export const CELL = 90;
export const COLS = 14;
export const ROWS = 6;
const GAP_COL = 7; // cột thác nước giữa hai vùng
const ACCENT = "#FFB400";
const INK = "#1B2A2F";

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
  previews?: { cell: CellId; type: string }[];
  /** Nhãn thu nhập trên ô đầu nhóm. */
  badges?: Map<CellId, string>;
  /** Bản đồ nhỏ trong khay: bỏ chi tiết phụ. */
  mini?: boolean;
  onCellTap?: (cell: CellId) => void;
}

/** Icon trò chơi đặt trong hệ toạ độ SVG của bàn. */
function TileIcon({ type, x, y, size, opacity }: { type: string; x: number; y: number; size: number; opacity?: number }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size / 64})`}
      fill="none"
      stroke={INK}
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[type] ?? "" }}
    />
  );
}

export function Board({ state, width, marks, previews, badges, mini, onCellTap }: BoardProps) {
  const down = useRef(new Map<number, CellId>());
  const vbW = COLS * CELL;
  const vbH = ROWS * CELL;
  const height = (width * vbH) / vbW;
  // Ô thuộc nhóm đủ bộ (để gắn nhãn "ĐỦ").
  const complete = useMemo(() => {
    const set = new Set<CellId>();
    for (const p of computeIncome(state).players) for (const g of p.groups) if (g.complete) g.cells.forEach((c) => set.add(c));
    return set;
  }, [state]);
  const cellFrom = (target: EventTarget | null): CellId | null => {
    const el = (target as Element | null)?.closest?.("[data-cell]");
    return el ? Number(el.getAttribute("data-cell")) : null;
  };
  const stripes = [];
  for (let y = 0; y < vbH; y += 44) stripes.push(y);
  return (
    <svg
      className={mini ? "board mini" : "board"}
      width={width}
      height={height}
      viewBox={`-6 -6 ${vbW + 12} ${vbH + 12}`}
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
      <rect x={-3} y={-3} width={vbW + 6} height={vbH + 6} rx={30} fill="#EEF5E2" stroke="#F7FBEF" strokeWidth={6} />
      {/* Thác nước: dải sọc */}
      <g>
        {stripes.map((y) => (
          <rect key={y} x={GAP_COL * CELL} y={y} width={CELL} height={Math.min(22, vbH - y)} fill="#4FB3E3" />
        ))}
        {stripes.map((y) => (
          <rect key={`b${y}`} x={GAP_COL * CELL} y={y + 22} width={CELL} height={Math.max(0, Math.min(22, vbH - y - 22))} fill="#3A9FD2" />
        ))}
        <rect x={GAP_COL * CELL + 2} y={0} width={CELL - 4} height={vbH} fill="none" stroke="#E0F2FB" strokeWidth={4} />
        {!mini && (
          <text x={GAP_COL * CELL + CELL / 2} y={vbH / 2} textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight={800} fontSize={20} letterSpacing={4} fill="#FFFFFF" transform={`rotate(90 ${GAP_COL * CELL + CELL / 2} ${vbH / 2})`}>
            THÁC
          </text>
        )}
      </g>
      {state.ruleset.topology.cells.map((tc) => {
        const cell = state.cells[tc.id];
        const owner = playerOf(state, cell.owner);
        const type = cell.tile ? state.tileTypes[cell.tile] : null;
        const at = type ? attrOf(state, type) : null;
        const mark = marks?.get(tc.id);
        const x = tc.col * CELL;
        const y = tc.row * CELL;
        const fill = owner ? owner.color + (type ? "30" : "1F") : "#F8FBF2";
        let stroke = owner ? owner.color : "#CFE0BC";
        let sw = owner ? 3 : 2;
        let dash: string | undefined;
        if (mark?.kind === "buildable") {
          stroke = mark.color;
          sw = 4;
          dash = "9 6";
        } else if (mark?.kind === "selected") {
          stroke = INK;
          sw = 4;
        } else if (mark?.kind === "dealt") {
          stroke = mark.color;
          sw = 5;
        }
        return (
          <g key={tc.id} data-cell={tc.id} className={mark ? `cell mark-${mark.kind}` : "cell"} style={{ cursor: onCellTap ? "pointer" : undefined }}>
            {mark?.kind === "selected" && <rect x={x - 1} y={y - 1} width={CELL + 2} height={CELL + 2} rx={20} fill={ACCENT} opacity={0.85} />}
            <rect className="cell-bg" x={x + 4 + sw / 2} y={y + 4 + sw / 2} width={82 - sw} height={82 - sw} rx={15} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
            {!mini && (
              <>
                <text x={x + 12} y={y + 26} fontFamily="'Baloo 2', sans-serif" fontSize={19} fontWeight={700} fill="#2E4A3F">
                  {tc.id}
                </text>
                {/* lặp số ô xoay 180° để đọc được từ phía đối diện */}
                <text x={x + 78} y={y + 72} fontFamily="'Baloo 2', sans-serif" fontSize={14} fontWeight={600} fill="#8BA58F" textAnchor="start" transform={`rotate(180 ${x + 78} ${y + 72})`}>
                  {tc.id}
                </text>
              </>
            )}
            {mini && !type && (
              <text x={x + CELL / 2} y={y + CELL / 2 + 12} textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontSize={34} fontWeight={800} fill="#2E4A3F">
                {tc.id}
              </text>
            )}
            {type && at && (
              <g className="token-g">
                <rect x={x + 17} y={y + 19} width={56} height={52} rx={14} fill="rgba(27,42,47,0.25)" />
                <rect className="token" x={x + 17} y={y + 17} width={56} height={52} rx={14} fill={TILE_TINT[type]} />
                <TileIcon type={type} x={x + 23} y={y + 21} size={44} />
                {!mini &&
                  Array.from({ length: at.maxSize }, (_, i) => (
                    <circle key={i} cx={x + CELL / 2 + (i - (at.maxSize - 1) / 2) * 9} cy={y + 79} r={3} fill={INK} />
                  ))}
              </g>
            )}
            {owner && (
              <g>
                {isSquare(owner) ? (
                  <rect x={x + 70} y={y - 2} width={24} height={24} rx={5} fill={owner.color} stroke="#FFFFFF" strokeWidth={2} />
                ) : (
                  <circle cx={x + 82} cy={y + 10} r={12} fill={owner.color} stroke="#FFFFFF" strokeWidth={2} />
                )}
                <text x={x + 82} y={y + 15} textAnchor="middle" fontSize={13} fill="#FFFFFF">
                  {owner.icon}
                </text>
              </g>
            )}
            {complete.has(tc.id) && !mini && (
              <g>
                <rect x={x} y={y + 66} width={34} height={22} rx={11} fill={ACCENT} />
                <text x={x + 17} y={y + 82} textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight={800} fontSize={13} fill={INK}>
                  ĐỦ
                </text>
              </g>
            )}
            {badges?.get(tc.id) && (
              <g>
                <rect x={x + 10} y={y + CELL - 38} width={CELL - 20} height={32} rx={16} fill={INK} />
                <text x={x + CELL / 2} y={y + CELL - 15} textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontSize={22} fontWeight={800} fill={ACCENT}>
                  {badges.get(tc.id)}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {previews?.map((p) => {
        const tc = state.ruleset.topology.cells.find((c) => c.id === p.cell)!;
        const x = tc.col * CELL;
        const y = tc.row * CELL;
        return (
          <g key={`pv-${p.cell}`} pointerEvents="none">
            <rect x={x + 17} y={y + 17} width={56} height={52} rx={14} fill={TILE_TINT[p.type]} stroke="#E4572E" strokeWidth={3} strokeDasharray="6 4" />
            <TileIcon type={p.type} x={x + 25} y={y + 23} size={40} opacity={0.65} />
          </g>
        );
      })}
    </svg>
  );
}

/** Thẻ tuile dạng HTML (khay, ngăn giao dịch, trang chủ). */
export function TileGlyph({ type, size }: { type: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICON_PATHS[type] ?? "" }} />
  );
}
