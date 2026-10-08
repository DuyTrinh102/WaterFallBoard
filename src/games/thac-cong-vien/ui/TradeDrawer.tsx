import { t } from "../../../shared/i18n";
import { Tap } from "../../../shared/Tap";
import { handTiles, ownedCells } from "../engine/game";
import type { GameState, Player, Transfer } from "../engine/types";
import type { TradeDraft, TrayActions } from "./Tray";
import { Money } from "./Tray";
import { attrOf, tileIcon } from "./util";

function AssetPicker({ state, owner, selected, onToggle }: { state: GameState; owner: Player; selected: string[]; onToggle: (k: string) => void }) {
  const cells = ownedCells(state, owner.id);
  const tiles = handTiles(state, owner.id);
  return (
    <div className="chips picker">
      {cells.map((c) => {
        const k = `cell:${c}`;
        const tile = state.cells[c].tile;
        return (
          <Tap key={k} className={selected.includes(k) ? "chip asset on" : "chip asset"} onTap={() => onToggle(k)}>
            ô {c}
            {tile ? ` ${tileIcon(state, tile)}` : ""}
          </Tap>
        );
      })}
      {tiles.map((tid) => {
        const k = `tile:${tid}`;
        const a = attrOf(state, state.tileTypes[tid]);
        return (
          <Tap key={k} className={selected.includes(k) ? "chip asset on" : "chip asset"} onTap={() => onToggle(k)}>
            {a.icon}
            <small>{a.maxSize}</small>
          </Tap>
        );
      })}
    </div>
  );
}

function CoinStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper">
      <Tap className="btn small" onTap={() => onChange(Math.max(0, value - 1))}>−</Tap>
      <span className="coins">💰 {value}</span>
      <Tap className="btn small" onTap={() => onChange(value + 1)}>＋</Tap>
    </div>
  );
}

function toTransfers(me: string, partner: string, d: TradeDraft): Transfer[] {
  const asset = (k: string) => {
    const [kind, id] = k.split(":");
    return kind === "cell" ? ({ kind: "cell", id: Number(id) } as const) : ({ kind: "tile", id } as const);
  };
  const out: Transfer[] = [
    ...d.give.map((k) => ({ from: me, to: partner, asset: asset(k) })),
    ...d.get.map((k) => ({ from: partner, to: me, asset: asset(k) })),
  ];
  if (d.giveCoins > 0) out.push({ from: me, to: partner, asset: { kind: "coins", amount: d.giveCoins } });
  if (d.getCoins > 0) out.push({ from: partner, to: me, asset: { kind: "coins", amount: d.getCoins } });
  return out;
}

export function TradeDrawer({ state, player, draft, actions }: { state: GameState; player: Player; draft: TradeDraft; actions: TrayActions }) {
  const close = () => actions.setUi({ drawer: null, tradeDraft: null });
  const setDraft = (patch: Partial<TradeDraft>) => actions.setUi({ tradeDraft: { ...draft, ...patch } });
  const toggle = (list: "give" | "get", k: string) =>
    setDraft({ [list]: draft[list].includes(k) ? draft[list].filter((x) => x !== k) : [...draft[list], k] } as Partial<TradeDraft>);

  if (!draft.partner) {
    return (
      <div className="drawer trade">
        <div className="label">{t("trade.choosePartner")}</div>
        <div className="chips">
          {state.players
            .filter((p) => p.id !== player.id)
            .map((p) => (
              <Tap key={p.id} className="chip partner" style={{ borderColor: p.color }} onTap={() => setDraft({ partner: p.id })}>
                <span style={{ color: p.color }}>{p.icon}</span> {p.name}
              </Tap>
            ))}
        </div>
        <div className="row">
          <Tap className="btn" onTap={close}>{t("trade.close")}</Tap>
        </div>
      </div>
    );
  }
  const partner = state.players.find((p) => p.id === draft.partner)!;
  const send = async () => {
    const transfers = toTransfers(player.id, partner.id, draft);
    const ok = draft.tradeId
      ? await actions.run({ type: "reviseTrade", player: player.id, tradeId: draft.tradeId, transfers })
      : await actions.run({ type: "proposeTrade", player: player.id, partner: partner.id, transfers });
    if (ok) close();
  };
  return (
    <div className="drawer trade">
      <div className="row between">
        <div className="label">
          🤝 {player.icon} {player.name} ⇄ <span style={{ color: partner.color }}>{partner.icon}</span> {partner.name}
          {draft.tradeId ? ` · ${draft.tradeId}` : ""}
        </div>
        <Money state={state} player={player} />
      </div>
      <div className="two-col grow">
        <div className="col side">
          <div className="label">{t("trade.youGive")}</div>
          <AssetPicker state={state} owner={player} selected={draft.give} onToggle={(k) => toggle("give", k)} />
          <CoinStepper value={draft.giveCoins} onChange={(v) => setDraft({ giveCoins: v })} />
        </div>
        <div className="col side">
          <div className="label">
            {t("trade.youGet")} ({partner.icon} {partner.name})
          </div>
          <AssetPicker state={state} owner={partner} selected={draft.get} onToggle={(k) => toggle("get", k)} />
          <CoinStepper value={draft.getCoins} onChange={(v) => setDraft({ getCoins: v })} />
        </div>
      </div>
      <div className="row between">
        <span className="fine">{t("trade.promiseNote")}</span>
        <div className="row">
          <Tap className="btn" onTap={close}>{t("trade.close")}</Tap>
          <Tap className="btn primary" onTap={send}>{draft.tradeId ? t("trade.sendRevision") : t("trade.send")}</Tap>
        </div>
      </div>
    </div>
  );
}
