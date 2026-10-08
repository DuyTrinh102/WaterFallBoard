export type PlayerId = string;
export type CellId = number;
export type TileId = string;

export type Phase = "preparation" | "exchange" | "construction" | "income" | "ended";
export type PlayerCount = 3 | 4 | 5;

export interface AttractionType {
  id: string;
  nameKey: string;
  icon: string;
  maxSize: number;
  /** Số tuile loại này trong hộp. */
  count: number;
}

export interface RoundDistribution {
  /** Số thẻ địa điểm chia cho mỗi người. */
  deal: number;
  /** Số thẻ giữ lại (deal - số bỏ). */
  keep: number;
  /** Số tuile attraction chia cho mỗi người. */
  tiles: number;
}

export interface TopologyCell {
  id: CellId;
  region: string;
  /** Toạ độ lưới chỉ để vẽ; KHÔNG dùng để suy ra kề nhau. */
  col: number;
  row: number;
  neighbors: CellId[];
}

export interface Ruleset {
  id: string;
  version: string;
  isFixture: boolean;
  labelKey: string;
  rounds: number;
  startingCoins: number;
  discardCount: number;
  discardPolicy: "returnAndShuffle";
  partitionPolicy: "maximize";
  attractionTypes: AttractionType[];
  distribution: Record<PlayerCount, RoundDistribution[]>;
  /** incomeIncomplete[size] cho nhóm chưa hoàn chỉnh (size < maxSize). */
  incomeIncomplete: number[];
  /** incomeComplete[maxSize] cho nhóm hoàn chỉnh. */
  incomeComplete: Record<number, number>;
  topology: { cells: TopologyCell[] };
}

export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  icon: string;
}

export type TileLocation =
  | { kind: "deck" }
  | { kind: "hand"; player: PlayerId }
  | { kind: "cell"; cell: CellId };

export type Asset =
  | { kind: "coins"; amount: number }
  | { kind: "cell"; id: CellId }
  | { kind: "tile"; id: TileId };

export interface Transfer {
  from: PlayerId;
  to: PlayerId;
  asset: Asset;
}

export interface Trade {
  id: string;
  proposer: PlayerId;
  participants: PlayerId[];
  transfers: Transfer[];
  revision: number;
  /** playerId -> revision đã xác nhận */
  confirmations: Record<PlayerId, number>;
  status: "open" | "committed" | "void" | "cancelled";
  voidReason?: string;
}

export interface LedgerEntry {
  id: string;
  round: number;
  kind: "start" | "income" | "trade";
  from: PlayerId | "bank";
  to: PlayerId;
  amount: number;
}

export interface IncomeGroup {
  type: string;
  cells: CellId[];
  size: number;
  complete: boolean;
  amount: number;
}

export interface PlayerIncome {
  player: PlayerId;
  total: number;
  groups: IncomeGroup[];
}

export interface IncomeBreakdown {
  round: number;
  players: PlayerIncome[];
}

export interface PrepState {
  dealt: Record<PlayerId, CellId[]>;
  discarded: Record<PlayerId, CellId[] | null>;
  /** Thứ tự lượt xem riêng (gợi ý cho UI). */
  order: PlayerId[];
}

export interface RankEntry {
  player: PlayerId;
  coins: number;
  tilesOnBoard: number;
  rank: number;
}

export interface PublicEvent {
  seq: number;
  round: number;
  key: string;
  params?: Record<string, string | number>;
}

export interface GameOptions {
  moneyVisibility: "open" | "hidden";
  presetKey: string;
}

export interface GameState {
  schemaVersion: 1;
  gameId: string;
  ruleset: Ruleset;
  options: GameOptions;
  seed: string;
  rng: [number, number, number, number];
  revision: number;
  round: number;
  phase: Phase;
  players: Player[];
  locationDeck: CellId[];
  tileDeck: TileId[];
  tileTypes: Record<TileId, string>;
  tileLoc: Record<TileId, TileLocation>;
  cells: Record<CellId, { owner: PlayerId | null; tile: TileId | null }>;
  prep: PrepState | null;
  ready: Record<PlayerId, boolean>;
  coins: Record<PlayerId, number>;
  ledger: LedgerEntry[];
  trades: Record<string, Trade>;
  tradeSeq: number;
  paidIncome: Record<number, IncomeBreakdown>;
  processed: string[];
  log: PublicEvent[];
  result: RankEntry[] | null;
}

export type Command =
  | { type: "chooseDiscards"; player: PlayerId; cards: CellId[] }
  | { type: "proposeTrade"; player: PlayerId; partner: PlayerId; transfers: Transfer[] }
  | { type: "reviseTrade"; player: PlayerId; tradeId: string; transfers: Transfer[] }
  | { type: "confirmTrade"; player: PlayerId; tradeId: string; revision: number }
  | { type: "cancelTrade"; player: PlayerId; tradeId: string }
  | { type: "placeTile"; player: PlayerId; tile: TileId; cell: CellId }
  | { type: "setReady"; player: PlayerId; ready: boolean };

export interface CommandEnvelope {
  commandId: string;
  command: Command;
}

export type ErrorCode =
  | "wrongPhase"
  | "unknownPlayer"
  | "alreadyChosen"
  | "badDiscardSelection"
  | "playerReady"
  | "notParticipant"
  | "tradeNotOpen"
  | "staleRevision"
  | "badTransfer"
  | "emptyTrade"
  | "notOwner"
  | "tileNotInHand"
  | "cellOccupied"
  | "insufficientCoins"
  | "duplicateAsset"
  | "unknownTrade"
  | "unknownCell"
  | "unknownTile";

export type DispatchResult =
  | { ok: true; state: GameState; duplicate: boolean }
  | { ok: false; state: GameState; error: ErrorCode; detail?: Record<string, string | number> };
