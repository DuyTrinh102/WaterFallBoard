import { useEffect, useRef, useState, type ReactNode } from "react";
import { createGame } from "../games/thac-cong-vien/engine/game";
import type { GameState, Player } from "../games/thac-cong-vien/engine/types";
import { fixtureThacV1 } from "../games/thac-cong-vien/rules/fixture-thac-v1";
import { TileGlyph } from "../games/thac-cong-vien/ui/Board";
import { GameScreen } from "../games/thac-cong-vien/ui/GameScreen";
import { TILE_TINT } from "../games/thac-cong-vien/ui/icons";
import { Badge } from "../games/thac-cong-vien/ui/Tray";
import { acquireWriterLock, downloadJson, isValid, SaveStore } from "../persistence/saveStore";
import { t } from "../shared/i18n";
import { Tap } from "../shared/Tap";
import { LAYOUTS, SLOTS, STAGE_H, STAGE_W } from "../table/layouts";
import { GameSession, useSession } from "./session";

const PALETTE: Omit<Player, "id" | "name">[] = [
  { color: "#E4572E", icon: "★" },
  { color: "#2E6FDB", icon: "●" },
  { color: "#1F9D55", icon: "▲" },
  { color: "#C27C00", icon: "■" },
  { color: "#7B4FD6", icon: "◆" },
];
const DEFAULT_NAMES = ["An", "Bình", "Chi", "Dũng", "Én"];

/** Khung 1920×1080 co giãn vừa cửa sổ (giữ tỉ lệ). */
function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const fit = () => setScale(Math.min(el.clientWidth / STAGE_W, el.clientHeight / STAGE_H) || 1);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="viewport" ref={ref}>
      <div className="stage" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

function HowTo({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal">
      <div className="modal-card">
        <h2>{t("howto.title")}</h2>
        <ol>
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i}>{t(`howto.${i}`)}</li>
          ))}
        </ol>
        <p className="fine">{t("howto.6")}</p>
        <Tap className="btn primary" onTap={onClose}>{t("howto.close")}</Tap>
      </div>
    </div>
  );
}

interface SetupResult {
  players: Player[];
  moneyVisibility: "open" | "hidden";
}

function Setup({ onStart, onBack }: { onStart: (r: SetupResult) => void; onBack: () => void }) {
  const [count, setCount] = useState<3 | 4 | 5>(4);
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES);
  // order[i] = chỉ số người chơi ngồi ở ghế thứ i
  const [order, setOrder] = useState<number[]>([0, 1, 2, 3, 4]);
  const [swapFrom, setSwapFrom] = useState<number | null>(null);
  const [money, setMoney] = useState<"open" | "hidden">("open");
  const seats = LAYOUTS[count];
  const seatOrder = order.filter((i) => i < count);
  const tapSeat = (si: number) => {
    if (swapFrom === null) return setSwapFrom(si);
    const o = [...seatOrder];
    [o[swapFrom], o[si]] = [o[si], o[swapFrom]];
    setOrder([...o, ...order.filter((i) => i >= count)]);
    setSwapFrom(null);
  };
  const start = () => {
    const players = seatOrder.map((pi) => ({ id: `p${pi + 1}`, name: names[pi].trim() || DEFAULT_NAMES[pi], ...PALETTE[pi] }));
    onStart({ players, moneyVisibility: money });
  };
  // Sơ đồ ghế thu nhỏ
  const k = 0.42;
  return (
    <div className="screen setup">
      <h1>{t("setup.title")}</h1>
      <div className="setup-grid">
        <div>
          <h3>{t("setup.playerCount")}</h3>
          <div className="row">
            {([3, 4, 5] as const).map((c) => (
              <Tap key={c} className={c === count ? "btn big count on" : "btn big count"} onTap={() => { setCount(c); setSwapFrom(null); }}>
                {c} người
              </Tap>
            ))}
          </div>
          <h3>{t("setup.names")}</h3>
          {Array.from({ length: count }, (_, pi) => (
            <div key={pi} className="name-row">
              <Badge player={{ id: "", name: "", ...PALETTE[pi] }} size={48} />
              <input value={names[pi]} maxLength={14} onChange={(e) => setNames((ns) => ns.map((x, j) => (j === pi ? e.target.value : x)))} />
            </div>
          ))}
          <h3>{t("setup.preset")}</h3>
          <div className="row">
            <Tap className={money === "open" ? "btn preset on" : "btn preset"} onTap={() => setMoney("open")}>
              <b>{t("preset.open")}</b>
              <small>{t("preset.open.desc")}</small>
            </Tap>
            <Tap className={money === "hidden" ? "btn preset on" : "btn preset"} onTap={() => setMoney("hidden")}>
              <b>{t("preset.hidden")}</b>
              <small>{t("preset.hidden.desc")}</small>
            </Tap>
          </div>
        </div>
        <div>
          <h3>{t("setup.seats")}</h3>
          <div className="seat-map" style={{ width: STAGE_W * k, height: STAGE_H * k }}>
            <div className="seat-map-board" />
            <div className="seat-map-falls" />
            {seats.map((sid, si) => {
              const slot = SLOTS[sid];
              const pi = seatOrder[si];
              return (
                <Tap
                  key={sid}
                  className={swapFrom === si ? "seat-map-seat on" : "seat-map-seat"}
                  style={{ left: slot.x * k + 3, top: slot.y * k + 3, width: slot.w * k - 6, height: slot.h * k - 6, background: PALETTE[pi].color }}
                  onTap={() => tapSeat(si)}
                >
                  {PALETTE[pi].icon} {names[pi] || DEFAULT_NAMES[pi]}
                </Tap>
              );
            })}
          </div>
          <p className="hint" style={{ color: "var(--mist)" }}>Ghế đang chọn có viền vàng. Người ngồi được xếp theo chiều kim đồng hồ.</p>
          <span className="fixture">{t("app.fixtureBadge")}</span>
        </div>
      </div>
      <div className="row">
        <Tap className="btn" onTap={onBack}>{t("setup.back")}</Tap>
        <Tap className="btn big accent" onTap={start}>{t("setup.start")}</Tap>
      </div>
    </div>
  );
}

function PauseMenu({ session, onResume, onQuit, onHowTo }: { session: GameSession; onResume: () => void; onQuit: () => void; onHowTo: () => void }) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<GameState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { state } = useSession(session);
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) return onResume();
    const id = setTimeout(() => setCountdown(countdown - 1), 700);
    return () => clearTimeout(id);
  }, [countdown, onResume]);
  return (
    <div className="modal pause">
      <div className="modal-card">
        <h2>{t("pause.title")}</h2>
        {countdown !== null ? (
          <div className="countdown">{countdown}</div>
        ) : (
          <>
            <Tap className="btn big primary" onTap={() => setCountdown(3)}>{t("pause.resume")}</Tap>
            <Tap className="btn" onTap={onHowTo}>{t("pause.howTo")}</Tap>
            <h3>{t("pause.staff")}</h3>
            <div className="row">
              <Tap className="btn" onTap={() => downloadJson(`thac-cong-vien-${state.gameId}-r${state.revision}.json`, { schemaVersion: state.schemaVersion, savedAt: new Date().toISOString(), state, ...session.rescueData() })}>
                {t("pause.export")}
              </Tap>
              <Tap className="btn" onTap={() => fileRef.current?.click()}>{t("pause.import")}</Tap>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  e.target.value = "";
                  try {
                    const rec = JSON.parse(await f.text());
                    if (!isValid(rec)) throw new Error("invalid");
                    setPendingImport(rec.state);
                    setImportMsg(null);
                  } catch {
                    setPendingImport(null);
                    setImportMsg("File save không hợp lệ — ván hiện tại giữ nguyên.");
                  }
                }}
              />
            </div>
            {importMsg && <p className="warn">{importMsg}</p>}
            {pendingImport && (
              <Tap className="btn danger on" onTap={() => window.dispatchEvent(new CustomEvent("tcv-import", { detail: pendingImport }))}>
                Thay ván hiện tại bằng file đã chọn (vòng {pendingImport.round})
              </Tap>
            )}
            <Tap className={confirmQuit ? "btn danger on" : "btn danger"} onTap={() => (confirmQuit ? onQuit() : setConfirmQuit(true))}>
              {confirmQuit ? t("pause.quitConfirm") : t("pause.quit")}
            </Tap>
          </>
        )}
      </div>
    </div>
  );
}

type Screen = "loading" | "home" | "setup" | "game";

export function App() {
  const storeRef = useRef(new SaveStore());
  const [screen, setScreen] = useState<Screen>("loading");
  const [session, setSession] = useState<GameSession | null>(null);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [readonly, setReadonly] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const [lastSetup, setLastSetup] = useState<SetupResult | null>(null);

  useEffect(() => {
    (async () => {
      const [stored, writer] = await Promise.all([storeRef.current.init(), acquireWriterLock()]);
      setReadonly(!writer);
      if (stored) {
        const r = await storeRef.current.load();
        if (r.recovered) setNotice(t("save.corrupt"));
        if (!r.state && r.corrupt) setNotice(t("save.corruptNone"));
        if (r.state && r.state.phase !== "ended") setSaved(r.state);
      }
      setScreen("home");
    })();
  }, []);

  // Mất focus / ẩn tab ⇒ tạm dừng (che thông tin riêng).
  useEffect(() => {
    const onVis = () => document.hidden && screen === "game" && setPaused(true);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [screen]);

  const openSession = (state: GameState, fresh: boolean) => {
    const s = new GameSession(state, storeRef.current.available ? storeRef.current : null, readonly);
    if (fresh) void s.persistInitial();
    setSession(s);
    setPaused(false);
    setScreen("game");
  };

  useEffect(() => {
    const onImport = (e: Event) => openSession((e as CustomEvent<GameState>).detail, true);
    window.addEventListener("tcv-import", onImport);
    return () => window.removeEventListener("tcv-import", onImport);
  });

  const startNew = (r: SetupResult) => {
    setLastSetup(r);
    const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const state = createGame({ ruleset: fixtureThacV1, players: r.players, options: { moneyVisibility: r.moneyVisibility, presetKey: r.moneyVisibility === "open" ? "preset.open" : "preset.hidden" }, gameId: `g-${seed}` }, seed);
    openSession(state, true);
  };

  const goHome = async () => {
    if (session) {
      const st = session.getSnapshot().state;
      if (st.phase === "ended" && !readonly) await storeRef.current.clear().catch(() => undefined);
      setSaved(st.phase === "ended" ? null : st);
    }
    setSession(null);
    setPaused(false);
    setScreen("home");
  };

  const quitGame = async () => {
    if (!readonly) await storeRef.current.clear().catch(() => undefined);
    setSaved(null);
    setSession(null);
    setPaused(false);
    setScreen("home");
  };

  return (
    <Stage>
      {screen === "loading" && <div className="screen center">…</div>}
      {screen === "home" && (
        <div className="screen home">
          <div className="falls" />
          <div className="falls-foam" />
          <div className="lede">
            <span className="eyebrow">{t("home.eyebrow")}</span>
            <h1>{t("app.title")}</h1>
            <p className="pitch">{t("home.pitch")}</p>
            <div className="row" style={{ gap: 18, marginTop: 10 }}>
              {!readonly && (
                <Tap className="btn big accent" onTap={() => setScreen("setup")}>
                  {t("home.newGame")}
                </Tap>
              )}
              {saved && !readonly && (
                <Tap className="btn big outline" onTap={() => openSession(saved, false)}>
                  {t("home.continue")} (vòng {saved.round})
                </Tap>
              )}
              <Tap className="btn big soft" onTap={() => setHowTo(true)}>{t("home.howTo")}</Tap>
            </div>
            <div className="facts">
              <span>3–5 người</span><span>·</span><span>45–60 phút</span><span>·</span><span>Từ 10 tuổi</span>
            </div>
          </div>
          <div className="park-card">
            <div className="head">
              <b>{t("home.tiles")}</b>
              <span className="label" style={{ color: "#2E4A3F" }}>{t("home.tilesNote")}</span>
            </div>
            <div className="grid">
              {fixtureThacV1.attractionTypes.map((a) => (
                <div key={a.id} className="token" style={{ background: TILE_TINT[a.id] }}>
                  <TileGlyph type={a.id} size={96} />
                  <span className="name">{t(a.nameKey)}</span>
                  <span className="max-badge">{a.maxSize}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="notice">
            {readonly && <p className="warn">{t("save.readonly")}</p>}
            {!storeRef.current.available && <p className="warn">{t("save.memoryOnly")}</p>}
            {notice && <p className="warn">{notice}</p>}
            <span className="fixture">{t("app.fixtureBadge")}</span>
          </div>
        </div>
      )}
      {screen === "setup" && <Setup onStart={startNew} onBack={() => setScreen("home")} />}
      {screen === "game" && session && (
        <>
          <GameScreen
            session={session}
            onPause={() => setPaused(true)}
            onReplay={async () => {
              if (!readonly) await storeRef.current.clear().catch(() => undefined);
              if (lastSetup) startNew(lastSetup);
              else setScreen("setup");
            }}
            onHome={goHome}
          />
          <SaveErrorBanner session={session} />
          {paused && <PauseMenu session={session} onResume={() => setPaused(false)} onQuit={quitGame} onHowTo={() => setHowTo(true)} />}
        </>
      )}
      {howTo && <HowTo onClose={() => setHowTo(false)} />}
    </Stage>
  );
}

function SaveErrorBanner({ session }: { session: GameSession }) {
  const { saveStatus, state } = useSession(session);
  if (saveStatus !== "error") return null;
  return (
    <div className="modal">
      <div className="modal-card">
        <h2>{t("save.error")}</h2>
        <div className="row">
          <Tap className="btn primary" onTap={() => session.retrySave()}>{t("save.retry")}</Tap>
          <Tap className="btn" onTap={() => downloadJson(`thac-cong-vien-rescue-${state.gameId}.json`, { schemaVersion: state.schemaVersion, state, ...session.rescueData() })}>
            {t("pause.export")}
          </Tap>
        </div>
      </div>
    </div>
  );
}
