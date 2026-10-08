import { useEffect, useState } from "react";
import { t } from "../../../shared/i18n";
import { Hold, Tap } from "../../../shared/Tap";
import { buildableCells, handTiles, ownedCells } from "../engine/game";
import type { CellId, GameState, Player, Trade } from "../engine/types";
import { Board, type CellMark } from "./Board";
import { attrOf, playerOf, summarize, tileIcon } from "./util";

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
  run: (cmd: Parameters<import("../../../app/session").GameSession["run"]>[0]) => Promise<boolean>;
}

export function Money({ state, player }: { state: GameState; player: Player }) {
  const [held, setHeld] = useState(false);
  if (state.options.moneyVisibility === "open" || state.phase === "ended") {
    return <span className="money">💰 {t("money.open", { coins: state.coins[player.id] })}</span>;
  }
  return (
    <Hold className="btn hold" onChange={setHeld} ariaLabel={t("money.hold")}>
      {held ? `💰 ${t("money.open", { coins: state.coins[player.id] })}` : t("money.hold")}
    </Hold>
  );
}

function ReadyButton({ state, player, run }: { state: GameState; player: Player; run: TrayActions["run"] }) {
  const ready = state.ready[player.id];
  const label = state.phase === "income" ? t("ready.next") : t("ready.button");
  return (
    <Tap className={ready ? "btn ready on" : "btn ready"} onTap={() => run({ type: "setReady", player: player.id, ready: !ready })}>
      {ready ? t("ready.undo") : label}
    </Tap>
  );
}

function TileChips({ state, tiles, armed, onTap }: { state: GameState; tiles: string[]; armed?: string; onTap?: (t: string) => void }) {
  return (
    <div className="chips">
      {tiles.map((tid) => {
        const a = attrOf(state, state.tileTypes[tid]);
        return (
          <Tap key={tid} className={armed === tid ? "chip tile armed" : "chip tile"} onTap={() => onTap?.(tid)} disabled={!onTap} ariaLabel={t(a.nameKey)}>
            <span className="emoji">{a.icon}</span>
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
        <span>
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
      <div className="trade-head">
        {iConfirmed ? t("trade.waiting", { name: `${other.icon} ${other.name}`, rev: trade.revision }) : t("trade.offerFrom", { name: `${other.icon} ${other.name}`, rev: trade.revision })}
      </div>
      <div className="trade-sum">
        <b>{t("trade.youGive")}:</b> {sum.give} · <b>{t("trade.youGet")}:</b> {sum.get}
      </div>
      <div className="row">
        {!iConfirmed && (
          <Tap className="btn primary small" onTap={() => actions.run({ type: "confirmTrade", player: player.id, tradeId: trade.id, revision: trade.revision })}>
            {t("trade.accept")}
          </Tap>
        )}
        <Tap className="btn small" onTap={edit}>{t("trade.edit")}</Tap>
        <Tap className="btn small danger" onTap={() => actions.run({ type: "cancelTrade", player: player.id, tradeId: trade.id })}>
          {iConfirmed ? t("trade.cancel") : t("trade.reject")}
        </Tap>
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
    if (chosen) return <div className="big-hint">{t("prep.done")}</div>;
    if (isPrepTurn) return <PrivateCover state={state} ui={ui} actions={actions} />;
    return <div className="big-hint">{prepWaitingFor ? t("prep.waitTurn", { name: `${prepWaitingFor.icon} ${prepWaitingFor.name}` }) : t("prep.notYet")}</div>;
  }

  if (state.phase === "exchange") {
    return (
      <div className="body two-col">
        <div className="col">
          <div className="label">
            {t("exchange.myTiles")} ({tiles.length}) · {t("exchange.myCells")}: {cells.length}
          </div>
          <TileChips state={state} tiles={tiles} />
        </div>
        <div className="col">
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
          <div className="big-hint">{t("build.confirm", { icon: tileIcon(state, ui.armedTile), cell: ui.pendingCell })}</div>
          <div className="row">
            <Tap
              className="btn primary"
              onTap={async () => {
                const okRun = await actions.run({ type: "placeTile", player: player.id, tile: ui.armedTile!, cell: ui.pendingCell! });
                if (okRun) actions.setUi({ armedTile: undefined, pendingCell: undefined });
              }}
            >
              {t("build.do")}
            </Tap>
            <Tap className="btn" onTap={() => actions.setUi({ pendingCell: undefined })}>{t("build.cancel")}</Tap>
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
        <div className="big-hint">{t("income.you", { n: inc?.total ?? 0 })}</div>
        <div className="chips">
          {inc?.groups.map((g, i) => {
            const a = attrOf(state, g.type);
            return (
              <span key={i} className={g.complete ? "chip group complete" : "chip group"}>
                {t("income.group", { icon: a.icon, size: g.size, max: a.maxSize })} {g.complete ? "★" : ""} +{g.amount}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  const row = state.result?.find((r) => r.player === player.id);
  return <div className="big-hint">{row ? t("result.you", { rank: row.rank }) : ""}</div>;
}

const AUTO_HIDE_MS = 30_000;

function PrivateCover({ state, ui, actions }: { state: GameState; ui: SeatUi; actions: TrayActions }) {
  const [holdStart, setHoldStart] = useState<number | null>(null);
  useEffect(() => {
    if (holdStart === null) return;
    const id = setTimeout(() => actions.setUi({ drawer: "private" }), 1000);
    return () => clearTimeout(id);
  }, [holdStart]); // eslint-disable-line react-hooks/exhaustive-deps
  if (ui.drawer === "private") return <div className="big-hint">🔒 {t("prep.choose", { n: state.ruleset.discardCount })}</div>;
  return (
    <div className="body center-col">
      <div className="hint">{t("prep.myTurnCover")}</div>
      <Hold className={holdStart ? "btn primary holding" : "btn primary"} onChange={(h) => setHoldStart(h ? Date.now() : null)}>
        🔓 {t("prep.holdToOpen")}
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
  const marks = new Map<CellId, CellMark>(dealt.map((c) => [c, { color: sel.includes(c) ? "#9ca3af" : player.color, kind: sel.includes(c) ? "selected" : "dealt" }]));
  const toggle = (c: CellId) => setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : s.length < need ? [...s, c] : s));
  return (
    <div className="drawer private">
      <div className="label">🔒 {t("prep.choose", { n: need })}</div>
      <div className="private-main">
        <div className="chips cards">
          {dealt.map((c) => (
            <Tap key={c} className={sel.includes(c) ? "chip card discard" : "chip card"} onTap={() => toggle(c)}>
              {sel.includes(c) ? "✕ " : ""}
              {c}
            </Tap>
          ))}
        </div>
        <Board state={state} width={460} mini marks={marks} onCellTap={(c) => dealt.includes(c) && toggle(c)} />
      </div>
      <div className="row">
        <Tap
          className="btn primary"
          disabled={sel.length !== need}
          onTap={async () => {
            if (await actions.run({ type: "chooseDiscards", player: player.id, cards: sel })) actions.setUi({ drawer: null });
          }}
        >
          {t("prep.confirm")} ({sel.length}/{need})
        </Tap>
        <Tap className="btn" onTap={() => setSel([])}>{t("prep.cancelSel")}</Tap>
      </div>
    </div>
  );
}

export { ReadyButton };
