import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession, type GameSession } from "../../../app/session";
import { t } from "../../../shared/i18n";
import { Tap } from "../../../shared/Tap";
import { innerSize, LAYOUTS, SLOTS, STAGE_H, STAGE_W, TRAY, type SeatSlot } from "../../../table/layouts";
import { buildableCells } from "../engine/game";
import type { CellId, Command, GameState, Phase, Player } from "../engine/types";
import { Board, type CellMark } from "./Board";
import { TradeDrawer } from "./TradeDrawer";
import { Badge, Money, PrivateDrawer, ReadyButton, TrayBody, type SeatUi, type TrayActions } from "./Tray";
import { errorText } from "./util";

const BOARD_X = TRAY;
const BOARD_Y = TRAY;
const BOARD_W = STAGE_W - 2 * TRAY;
const BOARD_H = STAGE_H - 2 * TRAY;
// Bàn chiếm tối đa vùng giữa: chiều cao trừ hai thanh trạng thái, giữ tỉ lệ khung SVG (1272×552).
const BOARD_PX = Math.min(BOARD_W - 24, Math.floor(((BOARD_H - 64) * 1272) / 552));
const PHASES: Phase[] = ["preparation", "exchange", "construction", "income"];

function Rotated({ slot, children, className }: { slot: SeatSlot; children: ReactNode; className?: string }) {
  const { w, h } = innerSize(slot);
  return (
    <div className={`seat ${className ?? ""}`} style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h }}>
      <div className="seat-inner" style={{ width: w, height: h, left: (slot.w - w) / 2, top: (slot.h - h) / 2, transform: `rotate(${slot.rotation}deg)` }}>
        {children}
      </div>
    </div>
  );
}

export function PauseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#0D3B44" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.5" />
      <rect x="14" y="5" width="4" height="14" rx="1.5" />
    </svg>
  );
}

function StatusLine({ state, compact, saveStatus }: { state: GameState; compact?: boolean; saveStatus?: string }) {
  const readyCount = state.players.filter((p) => state.ready[p.id]).length;
  return (
    <div className="status-line">
      <b>{t("status.round", { round: state.round, rounds: state.ruleset.rounds })}</b>
      {state.phase === "ended" ? (
        <span className="phase-pill">{t("phase.ended")}</span>
      ) : (
        PHASES.map((ph, i) =>
          ph === state.phase ? (
            <span key={ph} className="phase-pill">{t(`phase.${ph}`)}</span>
          ) : compact ? null : (
            <span key={ph} className="step">
              {i > PHASES.indexOf(state.phase) ? "› " : ""}
              {t(`phase.${ph}`)}
              {i < PHASES.indexOf(state.phase) ? " ›" : ""}
            </span>
          ),
        )
      )}
      {state.phase !== "preparation" && state.phase !== "ended" && (
        <>
          <span className="gap" />
          <span>{t("status.ready", { n: readyCount, total: state.players.length })}</span>
        </>
      )}
      {saveStatus && saveStatus !== "saved" && (
        <span className="save-flag">{saveStatus === "memory" ? "Chưa lưu" : saveStatus === "readonly" ? "Chỉ xem" : "Lỗi lưu"}</span>
      )}
      {state.ruleset.isFixture && !compact && (
        <>
          <span className="gap" />
          <span className="fixture">DỮ LIỆU THỬ NGHIỆM</span>
        </>
      )}
    </div>
  );
}

function IncomeTable({ state }: { state: GameState }) {
  const rs = state.ruleset;
  return (
    <div className="income-table">
      <div className="label">Bảng thu nhập · thử nghiệm</div>
      <table>
        <thead>
          <tr>
            <th>Cỡ đủ</th>
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>Đủ bộ</th>
          </tr>
        </thead>
        <tbody>
          {[3, 4, 5].map((m) => (
            <tr key={m}>
              <td>{m}</td>
              {[1, 2, 3, 4].map((s) => (
                <td key={s}>{s < m ? rs.incomeIncomplete[s] : "–"}</td>
              ))}
              <td className="complete">{rs.incomeComplete[m]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GameScreen({ session, onPause, onReplay, onHome }: { session: GameSession; onPause: () => void; onReplay: () => void; onHome: () => void }) {
  const { state, saveStatus } = useSession(session);
  const n = state.players.length as 3 | 4 | 5;
  const seats = LAYOUTS[n];
  const [ui, setUiMap] = useState<Record<string, SeatUi>>({});
  const [seatChecked, setSeatChecked] = useState<string[]>(() => (state.revision === 0 ? [] : state.players.map((p) => p.id)));
  const seatCheckDone = seatChecked.length === state.players.length;

  const setUi = useCallback((pid: string, patch: Partial<SeatUi>) => setUiMap((m) => ({ ...m, [pid]: { ...m[pid], ...patch } })), []);

  // Đổi pha ⇒ huỷ mọi preview / drawer đang mở (không tự commit).
  useEffect(() => {
    setUiMap((m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { dismissed: v.dismissed, message: null }])));
  }, [state.phase, state.round]);

  // Tuile đang chọn không còn trong tay (đã đổi chủ) ⇒ bỏ chọn.
  useEffect(() => {
    setUiMap((m) => {
      let changed = false;
      const next = { ...m };
      for (const [pid, u] of Object.entries(m)) {
        if (u.armedTile) {
          const loc = state.tileLoc[u.armedTile];
          if (loc.kind !== "hand" || loc.player !== pid) {
            next[pid] = { ...u, armedTile: undefined, pendingCell: undefined };
            changed = true;
          }
        }
      }
      return changed ? next : m;
    });
  }, [state.tileLoc]);

  const actionsFor = useCallback(
    (pid: string): TrayActions => ({
      setUi: (patch) => setUi(pid, patch),
      run: async (cmd: Command) => {
        const r = await session.run(cmd);
        if (!r.ok) {
          setUi(pid, { message: { text: errorText(r.error, r.detail), kind: "error" } });
          return false;
        }
        setUi(pid, { message: null });
        return true;
      },
    }),
    [session, setUi],
  );

  // Thông báo lỗi tự tắt.
  useEffect(() => {
    const has = Object.values(ui).some((u) => u.message);
    if (!has) return;
    const id = setTimeout(() => setUiMap((m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { ...v, message: null }]))), 4000);
    return () => clearTimeout(id);
  }, [ui]);

  const prepTurn: Player | null = useMemo(() => {
    if (state.phase !== "preparation" || !state.prep) return null;
    const id = state.prep.order.find((p) => state.prep!.discarded[p] === null);
    return state.players.find((p) => p.id === id) ?? null;
  }, [state]);

  // Bàn chung: đánh dấu ô xây được của mọi người đang chọn tuile.
  const { marks, previews } = useMemo(() => {
    const marks = new Map<CellId, CellMark>();
    const previews: { cell: CellId; type: string }[] = [];
    if (state.phase === "construction") {
      for (const p of state.players) {
        const u = ui[p.id];
        if (!u?.armedTile) continue;
        for (const c of buildableCells(state, p.id)) if (u.pendingCell !== c) marks.set(c, { color: p.color, kind: "buildable" });
        if (u.pendingCell) previews.push({ cell: u.pendingCell, type: state.tileTypes[u.armedTile] });
      }
    }
    return { marks, previews };
  }, [state, ui]);

  const badges = useMemo(() => {
    const b = new Map<CellId, string>();
    if (state.phase === "income") {
      for (const p of state.paidIncome[state.round]?.players ?? []) for (const g of p.groups) b.set(g.cells[0], `+${g.amount}`);
    }
    return b;
  }, [state]);

  const onBoardTap = (cell: CellId) => {
    if (state.phase !== "construction") return;
    // Ngữ cảnh người chơi đã được xác định ở khay (tuile đang chọn); ô thuộc đúng một chủ.
    const owner = state.cells[cell].owner;
    if (!owner || !ui[owner]?.armedTile) return;
    if (!buildableCells(state, owner).includes(cell)) return;
    setUi(owner, { pendingCell: cell });
  };

  const freeSlot = n === 3 ? SLOTS.W : null;

  return (
    <div className="game" style={{ width: STAGE_W, height: STAGE_H }}>
      <div className="board-area" style={{ left: BOARD_X, top: BOARD_Y, width: BOARD_W, height: BOARD_H }}>
        <div className="status top">
          <StatusLine state={state} compact />
        </div>
        <div className="board-wrap">
          <Board state={state} width={BOARD_PX} marks={marks} previews={previews} badges={badges} onCellTap={onBoardTap} />
        </div>
        <div className="status bottom">
          <StatusLine state={state} saveStatus={saveStatus} />
        </div>
        {!seatCheckDone && (
          <div className="center-overlay">
            <h2>{t("seatcheck.title")}</h2>
            <p>{t("seatcheck.hint")}</p>
          </div>
        )}
        {seatCheckDone && prepTurn && (
          <div className="center-overlay soft">
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <Badge player={prepTurn} size={44} />
              <h2>Lượt xem riêng: {prepTurn.name}</h2>
            </div>
            <p>Mọi người khác vui lòng quay đi.</p>
          </div>
        )}
        {state.phase === "income" && (
          <div className="center-banner">
            <b>{t("income.title", { round: state.round })}</b>
            {state.paidIncome[state.round]?.players.map((p) => {
              const pl = state.players.find((x) => x.id === p.player)!;
              return (
                <span key={p.player} style={{ color: pl.color }}>
                  {pl.icon} {pl.name} +{p.total}
                </span>
              );
            })}
          </div>
        )}
        {state.phase === "ended" && state.result && (
          <div className="center-overlay result">
            <h2>{t("result.title")}</h2>
            {state.result.map((r) => {
              const pl = state.players.find((p) => p.id === r.player)!;
              const tie = state.result!.filter((x) => x.rank === r.rank).length > 1;
              return (
                <div key={r.player} className="rank-row" style={{ background: r.rank === 1 ? "var(--offer)" : "transparent" }}>
                  <span className="place">#{r.rank}</span>
                  <Badge player={pl} />
                  <span className="nm" style={{ color: pl.color }}>{pl.name}</span>
                  <span className="sp" />
                  <span className="fine">{r.tilesOnBoard} tuile trên bàn{tie ? ` · ${t("result.tie")}` : ""}</span>
                  <span className="coins">{r.coins} xu</span>
                </div>
              );
            })}
            <div className="row" style={{ marginTop: 8 }}>
              <Tap className="btn" onTap={onHome}>{t("result.home")}</Tap>
              <Tap className="btn accent big" onTap={onReplay}>{t("result.replay")}</Tap>
            </div>
          </div>
        )}
      </div>

      {freeSlot && (
        <Rotated slot={freeSlot} className="free">
          <IncomeTable state={state} />
        </Rotated>
      )}

      {state.players.map((p, i) => {
        const slot = SLOTS[seats[i]];
        const u = ui[p.id] ?? {};
        const actions = actionsFor(p.id);
        const { w } = innerSize(slot);
        // Ngăn kéo của khay cạnh ngắn không được rộng hơn chiều cao bàn, kẻo đè lên khay cạnh dài.
        const sideways = slot.rotation === 90 || slot.rotation === -90;
        const drawerW = Math.min(sideways ? BOARD_H - 16 : w - 12, 760);
        return (
          <Rotated key={p.id} slot={slot} className="tray-seat">
            <div className="tray">
              <div className="tray-head" style={{ background: p.color }}>
                <Badge player={p} />
                <span className="who">{p.name}</span>
                <Money state={state} player={p} />
                <span className="spacer" />
                {seatCheckDone && state.phase === "exchange" && !state.ready[p.id] && (
                  <Tap className="btn ghost-light" onTap={() => setUi(p.id, { drawer: "trade", tradeDraft: { partner: null, give: [], get: [], giveCoins: 0, getCoins: 0 } })}>
                    {t("exchange.newTrade")}
                  </Tap>
                )}
                {seatCheckDone && (state.phase === "exchange" || state.phase === "construction" || state.phase === "income") && (
                  <ReadyButton state={state} player={p} run={actions.run} />
                )}
                <Tap className="btn pause" onTap={onPause} ariaLabel={t("pause.title")}>
                  <PauseIcon />
                </Tap>
              </div>
              <div className="tray-body">
                {u.message && <span className={`toast ${u.message.kind}`}>{u.message.text}</span>}
                {!seatCheckDone ? (
                  <div className="body center-col">
                    <Tap
                      className={seatChecked.includes(p.id) ? "btn big" : "btn big accent"}
                      onTap={() => setSeatChecked((s) => (s.includes(p.id) ? s : [...s, p.id]))}
                    >
                      {seatChecked.includes(p.id) ? t("seatcheck.done") : t("seatcheck.tap")}
                    </Tap>
                  </div>
                ) : (
                  <TrayBody state={state} player={p} ui={u} actions={actions} isPrepTurn={prepTurn?.id === p.id} prepWaitingFor={prepTurn} />
                )}
              </div>
            </div>
            {seatCheckDone && u.drawer === "trade" && u.tradeDraft && state.phase === "exchange" && (
              <div className="drawer-anchor" style={{ width: drawerW, left: (w - drawerW) / 2 }}>
                <TradeDrawer state={state} player={p} draft={u.tradeDraft} actions={actions} />
              </div>
            )}
            {seatCheckDone && u.drawer === "private" && prepTurn?.id === p.id && (
              <div className="drawer-anchor" style={{ width: drawerW, left: (w - drawerW) / 2 }}>
                <PrivateDrawer state={state} player={p} actions={actions} />
              </div>
            )}
          </Rotated>
        );
      })}

    </div>
  );
}
