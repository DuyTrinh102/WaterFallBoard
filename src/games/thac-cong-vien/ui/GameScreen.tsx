import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession, type GameSession } from "../../../app/session";
import { t } from "../../../shared/i18n";
import { Tap } from "../../../shared/Tap";
import { buildableCells } from "../engine/game";
import type { CellId, Command, GameState, Player } from "../engine/types";
import { Board, type CellMark } from "./Board";
import { PrivateDrawer, ReadyButton, TrayBody, Money, type SeatUi, type TrayActions } from "./Tray";
import { TradeDrawer } from "./TradeDrawer";
import { errorText, tileIcon } from "./util";
import { innerSize, LAYOUTS, SLOTS, STAGE_H, STAGE_W, TRAY, type SeatSlot } from "../../../table/layouts";

const BOARD_X = TRAY;
const BOARD_Y = TRAY;
const BOARD_W = STAGE_W - 2 * TRAY;
const BOARD_H = STAGE_H - 2 * TRAY;
const BOARD_PX = 1260;

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

function StatusLine({ state }: { state: GameState }) {
  const readyCount = state.players.filter((p) => state.ready[p.id]).length;
  return (
    <div className="status-line">
      <b>{t("status.round", { round: state.round, rounds: state.ruleset.rounds })}</b>
      <span className="phase-pill">{t(`phase.${state.phase}`)}</span>
      {state.phase !== "preparation" && state.phase !== "ended" && <span>{t("status.ready", { n: readyCount, total: state.players.length })}</span>}
      {state.ruleset.isFixture && <span className="fixture">{t("app.fixtureBadge")}</span>}
    </div>
  );
}

function IncomeTable({ state }: { state: GameState }) {
  const rs = state.ruleset;
  const sizes = [3, 4, 5];
  return (
    <div className="income-table">
      <div className="label">Bảng thu nhập (thử nghiệm)</div>
      <table>
        <thead>
          <tr>
            <th>Tối đa</th>
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>★ đủ</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((m) => (
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

  // Toast lỗi tự tắt.
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
    const previews: { cell: CellId; icon: string }[] = [];
    if (state.phase === "construction") {
      for (const p of state.players) {
        const u = ui[p.id];
        if (!u?.armedTile) continue;
        for (const c of buildableCells(state, p.id)) marks.set(c, { color: p.color, kind: u.pendingCell === c ? "selected" : "buildable" });
        if (u.pendingCell) previews.push({ cell: u.pendingCell, icon: tileIcon(state, u.armedTile) });
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
          <StatusLine state={state} />
        </div>
        <div className="board-wrap">
          <Board state={state} width={BOARD_PX} marks={marks} previews={previews} badges={badges} onCellTap={onBoardTap} />
        </div>
        <div className="status bottom">
          <StatusLine state={state} />
        </div>
        {!seatCheckDone && (
          <div className="center-overlay">
            <h2>{t("seatcheck.title")}</h2>
            <p>{t("seatcheck.hint")}</p>
          </div>
        )}
        {seatCheckDone && prepTurn && (
          <div className="center-overlay soft">
            <h2>
              🔒 Lượt xem riêng: {prepTurn.icon} {prepTurn.name}
            </h2>
            <p>Mọi người khác vui lòng quay đi 🙈</p>
          </div>
        )}
        {state.phase === "income" && (
          <div className="center-banner">
            💰 {t("income.title", { round: state.round })} —{" "}
            {state.paidIncome[state.round]?.players.map((p) => {
              const pl = state.players.find((x) => x.id === p.player)!;
              return (
                <span key={p.player} style={{ color: pl.color, marginRight: 16 }}>
                  {pl.icon} {pl.name} +{p.total}
                </span>
              );
            })}
          </div>
        )}
        {state.phase === "ended" && state.result && (
          <div className="center-overlay result">
            <h2>🏆 {t("result.title")}</h2>
            {state.result.map((r) => {
              const pl = state.players.find((p) => p.id === r.player)!;
              const tie = state.result!.filter((x) => x.rank === r.rank).length > 1;
              return (
                <div key={r.player} className="rank-row" style={{ color: pl.color }}>
                  {t("result.rank", { rank: r.rank, name: `${pl.icon} ${pl.name}`, coins: r.coins, tiles: r.tilesOnBoard })}
                  {tie ? ` · ${t("result.tie")}` : ""}
                </div>
              );
            })}
            <div className="row">
              <Tap className="btn primary" onTap={onReplay}>{t("result.replay")}</Tap>
              <Tap className="btn" onTap={onHome}>{t("result.home")}</Tap>
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
        const drawerW = Math.min(w, 760);
        return (
          <Rotated key={p.id} slot={slot} className="tray-seat">
            <div className="tray" style={{ borderColor: p.color }}>
              <div className="tray-head" style={{ background: p.color + "22" }}>
                <span className="who" style={{ color: p.color }}>
                  {p.icon} {p.name}
                </span>
                <Money state={state} player={p} />
                {u.message && <span className={`toast ${u.message.kind}`}>{u.message.text}</span>}
                <span className="spacer" />
                {seatCheckDone && state.phase === "exchange" && !state.ready[p.id] && (
                  <Tap className="btn" onTap={() => setUi(p.id, { drawer: "trade", tradeDraft: { partner: null, give: [], get: [], giveCoins: 0, getCoins: 0 } })}>
                    {t("exchange.newTrade")}
                  </Tap>
                )}
                {seatCheckDone && (state.phase === "exchange" || state.phase === "construction" || state.phase === "income") && (
                  <ReadyButton state={state} player={p} run={actions.run} />
                )}
              </div>
              <div className="tray-body">
                {!seatCheckDone ? (
                  <div className="body center-col">
                    <Tap
                      className={seatChecked.includes(p.id) ? "btn big on" : "btn big primary"}
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

      {[
        { left: 0, top: 0, rot: 135 },
        { left: STAGE_W - TRAY, top: 0, rot: -135 },
        { left: 0, top: STAGE_H - TRAY, rot: 45 },
        { left: STAGE_W - TRAY, top: STAGE_H - TRAY, rot: -45 },
      ].map((c, i) => (
        <div key={i} className="corner" style={{ left: c.left, top: c.top, width: TRAY, height: TRAY }}>
          <Tap className="btn pause" onTap={onPause} ariaLabel={t("pause.title")}>
            ⏸
          </Tap>
          {i === 0 && saveStatus !== "saved" && <div className={`save-flag ${saveStatus}`}>{saveStatus === "memory" ? "⚠ chưa lưu" : saveStatus === "readonly" ? "👁 chỉ xem" : "⛔ lỗi lưu"}</div>}
        </div>
      ))}
    </div>
  );
}
