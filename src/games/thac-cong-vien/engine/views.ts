import { rankPlayers } from "./game";
import type { GameState, PlayerId } from "./types";

/**
 * View công khai: loại bỏ thẻ đang chia/bị bỏ, và tổng tiền khi preset ẩn tiền.
 * Dùng cho log/lịch sử/export công khai — không chứa dữ liệu bí mật.
 */
export function getPublicView(s: GameState) {
  const hideMoney = s.options.moneyVisibility === "hidden" && s.phase !== "ended";
  return {
    gameId: s.gameId,
    rulesetId: s.ruleset.id,
    isFixture: s.ruleset.isFixture,
    round: s.round,
    phase: s.phase,
    revision: s.revision,
    players: s.players.map((p) => ({
      ...p,
      ready: s.ready[p.id],
      coins: hideMoney ? null : s.coins[p.id],
      discardChosen: s.prep ? s.prep.discarded[p.id] !== null : null,
      dealtCount: s.prep ? s.prep.dealt[p.id].length : null,
    })),
    cells: s.cells,
    tileLoc: s.tileLoc,
    trades: s.trades,
    log: s.log,
    result: s.phase === "ended" ? rankPlayers(s) : null,
  };
}

export function getPlayerView(s: GameState, player: PlayerId, visibility: "public" | "private") {
  const pub = getPublicView(s);
  if (visibility === "public") return { ...pub, me: player, private: null };
  return {
    ...pub,
    me: player,
    private: {
      coins: s.coins[player],
      dealt: s.prep?.dealt[player] ?? null,
      discarded: s.prep?.discarded[player] ?? null,
    },
  };
}
