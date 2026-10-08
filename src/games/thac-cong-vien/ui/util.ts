import type { Asset, GameState, Player, PlayerId, Transfer } from "../engine/types";
import { t } from "../../../shared/i18n";

export function playerOf(s: GameState, id: PlayerId | null | undefined) {
  return id ? s.players.find((p) => p.id === id) ?? null : null;
}

/** Huy hiệu vuông cho ■ ◆, tròn cho ký hiệu khác — để phân biệt người chơi không chỉ bằng màu. */
export function isSquare(p: Pick<Player, "icon">) {
  return p.icon === "■" || p.icon === "◆";
}

export function attrOf(s: GameState, typeId: string) {
  return s.ruleset.attractionTypes.find((a) => a.id === typeId)!;
}

export function tileName(s: GameState, tileId: string) {
  return t(attrOf(s, s.tileTypes[tileId]).nameKey);
}

export function assetLabel(s: GameState, a: Asset): string {
  if (a.kind === "coins") return `${a.amount} xu`;
  if (a.kind === "tile") {
    const at = attrOf(s, s.tileTypes[a.id]);
    return `${t(at.nameKey)} ${at.maxSize}`;
  }
  const tile = s.cells[a.id].tile;
  return tile ? `ô ${a.id} (${tileName(s, tile)})` : `ô ${a.id}`;
}

/** Tóm tắt từ góc nhìn một người: "Bạn đưa … · Bạn nhận …". */
export function summarize(s: GameState, me: PlayerId, transfers: Transfer[]) {
  const give = transfers.filter((x) => x.from === me).map((x) => assetLabel(s, x.asset));
  const get = transfers.filter((x) => x.to === me).map((x) => assetLabel(s, x.asset));
  return {
    give: give.length ? give.join(", ") : t("trade.nothing"),
    get: get.length ? get.join(", ") : t("trade.nothing"),
  };
}

export function errorText(code: string, detail?: Record<string, string | number>) {
  return t(`err.${code}`, detail);
}
