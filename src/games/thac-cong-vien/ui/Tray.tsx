import { useEffect, useState } from "react";
import type { GameSession } from "../../../app/session";
import { t } from "../../../shared/i18n";
import { Hold, Tap } from "../../../shared/Tap";
import { buildableCells, handTiles, ownedCells } from "../engine/game";
import type { CellId, GameState, Player, Trade } from "../engine/types";
import { Board, TileGlyph, type CellMark } from "./Board";
import { TILE_TINT } from "./icons";
import { attrOf, isSquare, playerOf, summarize, tileName } from "./util";

export interface SeatUi {
  armedTile?: string;
  pendingCell?: CellId;
  drawer?: "trade" | "private" | null;
  tradeDraft?: TradeDraft | null;
  message?: { text: string; kind: "error" | "ok" } | null;
  dismissed?: string[];
}

export interface TradeDraft {
  partner: string | null;
  tradeId?: string;
  give: string[]; // asset keys: "cell:12" | "tile:coaster-3"
  get: string[];
  giveCoins: number;
  getCoins: number;
}

export interface TrayActions {
  setUi: (patch: Partial<SeatUi>) => void;
  run: (cmd: Parameters<GameSession["run"]>[0]) => Promise<boolean>;
}

export function Badge({ player, size = 38 }: { player: Player; size?: number }) {
  return (
    <span className={isSquare(player) ? "badge square" : "badge"} style={{ color: player.color, width: size, height: size }}>
      {player.icon}
    </span>
  );
}

export function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

export function Money({ state, player }: { state: GameState; player: Player }) {
  const [held, setHeld] = useState(false);
  if (state.options.moneyVisibility === "open" || state.phase === "ended") {
    return <span className="money">{t("money.open", { coins: state.coins[player.id] })}</span>;
  }
  return (
    <Hold className="money-hold" onChange={setHeld} ariaLabel={t("money.hold")}>
      {held ? t("money.open", { coins: state.coins[player.id] }) : t("money.hold")}
    </Hold>
  );
}

export function ReadyButton({ state, player, run }: { state: GameState; player: Player; run: TrayActions["run"] }) {
  const ready = state.ready[player.id];
  const label = state.phase === "income" ? t("ready.next") : t("ready.button");
  return (
    <Tap className={ready ? "btn solid-light" : "btn ghost-light"} style={ready ? { color: player.color } : undefined} onTap={() => run({ type: "setReady", player: player.id, ready: !ready })}>
      {ready && <CheckIcon color={player.color} />}
      {ready ? t("ready.undo") : label}
    </Tap>
  );
}

function TileChips({ state, tiles, armed, onTap }: { state: GameState; tiles: string[]; armed?: string; onTap?: (t: string) => void }) {
  return (
    <div className="chips">
      {tiles.map((tid) => {
        const type = state.tileTypes[tid];
        const a = attrOf(state, type);
        return (
          <Tap key={tid} className={armed === tid ? "chip tile armed" : "chip tile"} style={{ background: TILE_TINT[type] }} onTap={() => onTap?.(tid)} disabled={!onTap} ariaLabel={t(a.nameKey)}>
            <TileGlyph type={type} size={50} />
            <span className="max">{a.maxSize}</span>
          </Tap>
        );
      })}
    </div>
  );
}

function TradeList({ state, player, ui, actions }: { state: GameState; player: Player; ui: SeatUi; actions: TrayActions }) {
  const mine = Object.values(state.trades).filter((tr) => tr.participants.includes(player.id) && !(ui.dismissed ?? []).includes(`${tr.id}:${tr.status}`));
  const visible = mine.filter((tr) => tr.status === "open" || tr.status === "void" || tr.status === "committed").slice(-3);
  if (!visible.length) return <div className="hint">{t("exchange.hint")}</div>;
  return (
    <div className="trades">
      {visible.map((tr) => (
        <TradeCard key={tr.id} state={state} player={player} trade={tr} ui={ui} actions={actions} />
      ))}
    </div>
  );
}

function TradeCard({ state, player, trade, ui, actions }: { state: GameState; player: Player; trade: Trade; ui: SeatUi; actions: TrayActions }) {
  const other = playerOf(state, trade.participants.find((p) => p !== player.id))!;
  const sum = summarize(state, player.id, trade.transfers);
  const dismiss = () => actions.setUi({ dismissed: [...(ui.dismissed ?? []), `${trade.id}:${trade.status}`] });
  if (trade.status !== "open") {
    return (
      <div className={`trade-card ${trade.status}`}>
        <span className="row" style={{ gap: 8 }}>
          {trade.status === "committed" && <CheckIcon color="#13703C" />}
          {other.icon} {other.name}: {trade.status === "committed" ? t("trade.committed") : t(trade.voidReason ?? "trade.void.phaseEnded")}
        </span>
        <Tap className="btn small" onTap={dismiss}>OK</Tap>
      </div>
    );
  }
  const iConfirmed = trade.confirmations[player.id] === trade.revision;
  const edit = () => {
    const key = (x: (typeof trade.transfers)[number]) => (x.asset.kind === "cell" ? `cell:${x.asset.id}` : x.asset.kind === "tile" ? `tile:${x.asset.id}` : "");
    const coins = (from: string) => trade.transfers.filter((x) => x.from === from && x.asset.kind === "coins").reduce((s, x) => s + (x.asset.kind === "coins" ? x.asset.amount : 0), 0);
    actions.setUi({
      drawer: "trade",
      tradeDraft: {
        partner: other.id,
        tradeId: trade.id,
        give: trade.transfers.filter((x) => x.from === player.id && x.asset.kind !== "coins").map(key),
        get: trade.transfers.filter((x) => x.to === player.id && x.asset.kind !== "coins").map(key),
        giveCoins: coins(player.id),
        getCoins: coins(other.id),
      },
    });
  };
  return (
    <div className={iConfirmed ? "trade-card waiting" : "trade-card offer"}>
      <div className="row between">
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span className="trade-head">
            {iConfirmed ? t("trade.waiting", { name: `${other.icon} ${other.name}`, rev: trade.revision }) : t("trade.offerFrom", { name: `${other.icon} ${other.name}`, rev: trade.revision })}
          </span>
          <span>
            <b>{t("trade.youGive")}:</b> {sum.give}
          </span>
          <span>
            <b>{t("trade.youGet")}:</b> {sum.get}
          </span>
        </div>
        <div className="row actions">
          <Tap className="btn small danger" onTap={() => actions.run({ type: "cancelTrade", player: player.id, tradeId: trade.id })}>
            {iConfirmed ? t("trade.cancel") : t("trade.reject")}
          </Tap>
          <Tap className="btn small" onTap={edit}>{t("trade.edit")}</Tap>
          {!iConfirmed && (
            <Tap className="btn small primary" onTap={() => actions.run({ type: "confirmTrade", player: player.id, tradeId: trade.id, revision: trade.revision })}>
              {t("trade.accept")}
            </Tap>
          )}
        </div>
      </div>
    </div>
  );
}

export function TrayBody({ state, player, ui, actions, isPrepTurn, prepWaitingFor }: {
  state: GameState;
  player: Player;
  ui: SeatUi;
  actions: TrayActions;
  isPrepTurn: boolean;
  prepWaitingFor: Player | null;
}) {
  const tiles = handTiles(state, player.id);
  const cells = ownedCells(state, player.id);

  if (state.phase === "preparation") {
    const chosen = state.prep?.discarded[player.id];
    if (chosen) return <div className="body center-col"><div className="big-hint">{t("prep.done")}</div></div>;
    if (isPrepTurn) return <PrivateCover state={state} ui={ui} actions={actions} />;
    return (
      <div className="body center-col">
        <div className="big-hint">{prepWaitingFor ? t("prep.waitTurn", { name: `${prepWaitingFor.icon} ${prepWaitingFor.name}` }) : t("prep.notYet")}</div>
      </div>
    );
  }

  if (state.phase === "exchange") {
    // Lời mời đang chờ mình trả lời được ưu tiên: chiếm trọn thân khay để không bị đẩy ra ngoài
    // (khay ngắn ở cạnh trái/phải trước đây cắt mất thẻ lời mời).
    const needsMe = Object.values(state.trades).filter(
      (tr) => tr.status === "open" && tr.participants.includes(player.id) && tr.confirmations[player.id] !== tr.revision,
    );
    if (needsMe.length) {
      return (
        <div className="offers">
          {needsMe.length > 1 && <div className="label">{needsMe.length} lời mời đang chờ bạn</div>}
          {needsMe.map((tr) => (
            <TradeCard key={tr.id} state={state} player={player} trade={tr} ui={ui} actions={actions} />
          ))}
        </div>
      );
    }
    return (
      <div className="body two-col">
        <div className="col">
          <div className="label">
            {t("exchange.myTiles")} {tiles.length} · {t("exchange.myCells")} {cells.length}
          </div>
          <TileChips state={state} tiles={tiles} />
        </div>
        <div className="col" style={{ flex: "1 1 320px", minWidth: 280 }}>
          <TradeList state={state} player={player} ui={ui} actions={actions} />
        </div>
      </div>
    );
  }

  if (state.phase === "construction") {
    const buildable = buildableCells(state, player.id);
    if (ui.pendingCell && ui.armedTile) {
      return (
        <div className="body center-col">
          <div className="row" style={{ flexWrap: "nowrap", gap: 16, padding: "10px 18px", borderRadius: 18, background: "var(--offer)", border: "2px solid var(--accent)" }}>
            <span className="big-hint" style={{ padding: 0 }}>{t("build.confirm", { name: tileName(state, ui.armedTile), cell: ui.pendingCell })}</span>
            <Tap className="btn" onTap={() => actions.setUi({ pendingCell: undefined })}>{t("build.cancel")}</Tap>
            <Tap
              className="btn primary"
              onTap={async () => {
                const okRun = await actions.run({ type: "placeTile", player: player.id, tile: ui.armedTile!, cell: ui.pendingCell! });
                if (okRun) actions.setUi({ armedTile: undefined, pendingCell: undefined });
              }}
            >
              {t("build.do")}
            </Tap>
          </div>
        </div>
      );
    }
    const marks = new Map<CellId, CellMark>(buildable.map((c) => [c, { color: player.color, kind: "buildable" }]));
    return (
      <div className="body two-col">
        <div className="col">
          <div className="label">{tiles.length ? (ui.armedTile ? t("build.pickCell") : t("build.hint")) : t("build.noTiles")}</div>
          {!buildable.length && tiles.length > 0 && <div className="hint">{t("build.noCells")}</div>}
          <TileChips state={state} tiles={tiles} armed={ui.armedTile} onTap={(tid) => actions.setUi({ armedTile: ui.armedTile === tid ? undefined : tid, pendingCell: undefined })} />
        </div>
        {ui.armedTile && (
          <div className="col minimap">
            <Board state={state} width={330} mini marks={marks} onCellTap={(c) => buildable.includes(c) && actions.setUi({ pendingCell: c })} />
          </div>
        )}
      </div>
    );
  }

  if (state.phase === "income") {
    const inc = state.paidIncome[state.round]?.players.find((p) => p.player === player.id);
    return (
      <div className="body">
        <div className="big-hint" style={{ textAlign: "left" }}>{t("income.you", { n: inc?.total ?? 0 })}</div>
        <div className="chips">
          {inc?.groups.map((g, i) => {
            const a = attrOf(state, g.type);
            return (
              <span key={i} className={g.complete ? "chip group complete" : "chip group"}>
                <TileGlyph type={g.type} size={28} /> {g.size}/{a.maxSize} {g.complete ? "ĐỦ" : ""} +{g.amount}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  const row = state.result?.find((r) => r.player === player.id);
  return <div className="body center-col"><div className="big-hint">{row ? t("result.you", { rank: row.rank }) : ""}</div></div>;
}

const AUTO_HIDE_MS = 30_000;

function PrivateCover({ state, ui, actions }: { state: GameState; ui: SeatUi; actions: TrayActions }) {
  const [holdStart, setHoldStart] = useState<number | null>(null);
  useEffect(() => {
    if (holdStart === null) return;
    const id = setTimeout(() => actions.setUi({ drawer: "private" }), 1000);
    return () => clearTimeout(id);
  }, [holdStart]); // eslint-disable-line react-hooks/exhaustive-deps
  if (ui.drawer === "private") return <div className="body center-col"><div className="big-hint">{t("prep.choose", { n: state.ruleset.discardCount })}</div></div>;
  return (
    <div className="body center-col">
      <div className="hint">{t("prep.myTurnCover")}</div>
      <Hold className={holdStart ? "btn primary holding" : "btn primary"} onChange={(h) => setHoldStart(h ? Date.now() : null)}>
        {t("prep.holdToOpen")}
      </Hold>
    </div>
  );
}

export function PrivateDrawer({ state, player, actions }: { state: GameState; player: Player; actions: TrayActions }) {
  const [sel, setSel] = useState<CellId[]>([]);
  const dealt = state.prep?.dealt[player.id] ?? [];
  const need = state.ruleset.discardCount;
  // Tự che khi không thao tác / mất focus / ẩn tab.
  useEffect(() => {
    const hide = () => actions.setUi({ drawer: null });
    const id = setTimeout(hide, AUTO_HIDE_MS);
    const onVis = () => document.hidden && hide();
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearTimeout(id);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  const marks = new Map<CellId, CellMark>(dealt.map((c) => [c, { color: sel.includes(c) ? "#9AA5A1" : player.color, kind: sel.includes(c) ? "selected" : "dealt" }]));
  const toggle = (c: CellId) => setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : s.length < need ? [...s, c] : s));
  return (
    <div className="drawer private">
      <div className="row between">
        <span className="title">{t("prep.choose", { n: need })}</span>
        <span className="fine">{t("prep.privacyNote")}</span>
      </div>
      <div className="private-main">
        <div className="chips cards">
          {dealt.map((c) => (
            <Tap key={c} className={sel.includes(c) ? "chip card discard" : "chip card"} onTap={() => toggle(c)}>
              {c}
            </Tap>
          ))}
        </div>
        <Board state={state} width={460} mini marks={marks} onCellTap={(c) => dealt.includes(c) && toggle(c)} />
      </div>
      <div className="row">
        <Tap className="btn" onTap={() => setSel([])}>{t("prep.cancelSel")}</Tap>
        <Tap
          className="btn primary"
          disabled={sel.length !== need}
          onTap={async () => {
            if (await actions.run({ type: "chooseDiscards", player: player.id, cards: sel })) actions.setUi({ drawer: null });
          }}
        >
          {t("prep.confirm")} ({sel.length}/{need})
        </Tap>
      </div>
    </div>
  );
}
