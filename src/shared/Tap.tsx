import { useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Nút cảm ứng dựa trên Pointer Events: mỗi pointerId là một phiên riêng, nên nhiều người
 * có thể chạm nhiều nút cùng lúc. pointercancel / kéo ra ngoài ⇒ huỷ, không kích hoạt.
 * Bàn phím (Enter/Space) vẫn dùng được qua onClick với detail === 0.
 */
export function Tap(props: {
  onTap: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
}) {
  const active = useRef<Set<number>>(new Set());
  return (
    <button
      type="button"
      className={props.className}
      style={props.style}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
      onPointerDown={(e) => {
        if (props.disabled) return;
        active.current.add(e.pointerId);
      }}
      onPointerUp={(e) => {
        if (!active.current.delete(e.pointerId) || props.disabled) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) props.onTap();
      }}
      onPointerCancel={(e) => active.current.delete(e.pointerId)}
      onClick={(e) => {
        if (e.detail === 0 && !props.disabled) props.onTap();
      }}
    >
      {props.children}
    </button>
  );
}

/** Nhấn giữ để xem: hiện khi đang giữ, thả / huỷ / mất focus là che. */
export function Hold(props: { onChange: (held: boolean) => void; children: ReactNode; className?: string; ariaLabel?: string }) {
  const held = useRef<Set<number>>(new Set());
  const update = () => props.onChange(held.current.size > 0);
  return (
    <button
      type="button"
      className={props.className}
      aria-label={props.ariaLabel}
      onPointerDown={(e) => {
        held.current.add(e.pointerId);
        e.currentTarget.setPointerCapture(e.pointerId);
        update();
      }}
      onPointerUp={(e) => {
        held.current.delete(e.pointerId);
        update();
      }}
      onPointerCancel={(e) => {
        held.current.delete(e.pointerId);
        update();
      }}
      onLostPointerCapture={(e) => {
        held.current.delete(e.pointerId);
        update();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {props.children}
    </button>
  );
}
