# Architecture

Phiên bản 0.1 · Milestone 0

## 1. Khảo sát repository

Tại commit `ee8e947`: repo chỉ có `README.md` (rỗng) và file prompt. Không có stack, AGENTS.md, CI hay dependency. ⇒ Dùng stack mặc định đề xuất, không có gì để thay thế/ghi đè.

## 2. Quyết định kỹ thuật

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Ngôn ngữ | TypeScript `strict` | Engine có kiểu chặt, chia sẻ type với UI |
| UI | React + Vite | Phổ biến, build tĩnh, dev nhanh |
| Bàn chơi | SVG (board) + HTML/CSS (khay, panel) | 78 ô là ít; SVG cho hit-test chính xác, scale 4K sắc nét; không cần canvas/3D |
| State UI | Store nhỏ tự viết + `useSyncExternalStore` | Tránh thư viện state; engine là nguồn sự thật |
| Persistence | IndexedDB (API gốc, bọc mỏng) | Transaction nhiều object store, đủ dung lượng |
| Đơn tab | Web Locks API (`navigator.locks`) + BroadcastChannel | Lock tự giải phóng khi tab chết |
| Test | Vitest (engine, integration), Playwright (e2e, Chromium có sẵn) | |
| Offline | **Local static server trên mini PC** phục vụ `dist/` tại `http://localhost:<port cố định>`; Chromium kiosk trỏ vào đó | Không phụ thuộc Internet cả lần cài đầu; IndexedDB gắn origin nên **port phải cố định**. PWA precache để roadmap nếu thiết bị là tablet/all-in-one không chạy server |
| Font/icon/audio | Đóng gói trong bundle, không CDN | Offline |
| Phiên bản dependency | Pin chính xác (không `^`) ở M1 sau khi đọc doc chính thức của phiên bản chọn | Theo yêu cầu, không nâng cấp hàng loạt |

Không dùng: WebSocket, backend, account, cloud DB, game engine 3D, plugin marketplace.

## 3. Cấu trúc thư mục

```text
src/
  app/                       # launcher, setup flow, route, session, staff menu
    registry.ts              # GameModule interface (metadata/setup/render/lifecycle/saveVersion)
  table/                     # seat layouts 3/4/5, orientation, pointer sessions, overlays, privacy cover
  games/waterfall-park/
    engine/                  # PURE TS — không import React/DOM
      state.ts  commands.ts  validate.ts  apply.ts  phases.ts
      trade.ts  build.ts  income/ (components.ts, partition.ts, oracle.ts)
      views.ts  rng.ts  invariants.ts
    rules/
      wp-original/           # config.json + topology.json + SOURCES.md (VERIFIED only)
    ui/                      # Board, Tray, TradePanel, BuildFlow, IncomePanel, Result
    module.ts                # đăng ký vào registry
  persistence/               # idb.ts, saveStore.ts, migrations/, tabLock.ts, export.ts
  shared/                    # ui primitives, i18n (vi.json), audio, icons
tests/
  engine/  integration/  e2e/  fixtures/   # fixtures: ruleset `fixture-*`, isFixture: true
docs/
assets/ATTRIBUTION.md
scripts/simulate.ts          # chạy ván deterministic không UI
```

Quy tắc phụ thuộc (kiểm bằng lint `no-restricted-imports`): `engine` → không import gì ngoài `rules` type; `ui` → `engine` (chỉ qua view/legal actions), `table`, `shared`; `app` không import `games/*/engine` trực tiếp (chỉ qua `GameModule`).

## 4. Game state

```ts
type Phase = "setup" | "preparation" | "exchange" | "construction" | "income" | "ended";

interface GameState {
  schemaVersion: number;
  gameId: string;
  ruleset: RulesetSnapshot;        // id, version, config, topology — snapshot đầy đủ, bất biến trong ván
  revision: number;                // +1 mỗi command commit
  rng: { seed: string; state: [number, number, number, number] }; // sfc32
  round: 1 | 2 | 3 | 4;
  phase: Phase;
  players: Player[];               // { id, name, color, icon, ready: boolean }
  seats: SeatAssignment[];         // seatId -> playerId (UI config, lưu cùng save)
  decks: { locationDraw: CardId[]; locationDiscard: CardId[]; tileDraw: TileId[] };
  hands: Record<PlayerId, { dealtCards: CardId[]; keptCards: CardId[] | null; tiles: TileId[] }>;
  cells: Record<CellId, { owner: PlayerId | null; tile: TileId | null }>;
  tiles: Record<TileId, { type: AttractionType; location: { kind: "deck" } | { kind: "hand"; player: PlayerId } | { kind: "cell"; cell: CellId } }>;
  ledger: LedgerEntry[];           // bank→player, player→player; số nguyên, mỗi entry có paymentId/tradeId
  balances: Record<PlayerId, number>; // dẫn xuất từ ledger, kiểm bằng invariant
  proposals: Record<ProposalId, TradeProposal>;
  paidIncome: Record<string, true>;   // `${round}` — idempotency trả thu nhập
  processedCommandIds: string[];      // ring buffer N gần nhất — chống double tap
  history: PublicEvent[];             // đã lọc thông tin bí mật
}
```

Tài sản có ID ổn định: `cell:<n>`, `card:<n>`, `tile:<type>-<k>`. **Ô (cell) là tài sản sở hữu**; tuile trên ô thuộc chủ ô (chờ RB-6). Giao dịch đổi `cells[x].owner`, không bao giờ đổi `tiles[t].location` của tuile đã đặt.

Invariant (chạy sau mọi command trong test và dev; khi load save):
- Mỗi tile ở đúng một location; mỗi card ở đúng một nơi (deck/discard/hand/removed).
- Tile trên cell ⇒ cell có owner; ≤ 1 tile/cell.
- `balances` = tổng ledger; không âm.
- Tổng xu trong hệ (bank xuất – không thu) khớp ledger.

## 5. Command flow

```
UI pointer/tap ─► Intent (seatId, playerId đã xác định trong khay) ─► Command { commandId(uuid), playerId, type, payload, baseRevision }
      │
      ▼
CommandQueue (tuần tự, 1 consumer)
      │  1. commandId đã xử lý? → trả kết quả cũ (idempotent)
      │  2. validateCommand(state, cmd)  → ValidationResult { ok } | { ok:false, code, i18nKey, privateTo? }
      │  3. applyCommand(state, cmd)     → { state', events[] }   (hàm thuần)
      │  4. checkInvariants(state')
      │  5. persistence.commit(state', cmd, events)  ── IndexedDB 1 transaction
      │  6. chỉ khi ghi thành công: store.publish(state') → UI
      ▼
UI render từ getPublicView / getPlayerView(seat, visibility)
```

Nếu bước 5 lỗi (quota/IO): không publish, giữ state cũ đã bền vững trong bộ nhớ, chuyển app sang chế độ “Không lưu được” (chặn mutation, cho export cứu hộ).

API engine:
```ts
createGame(config: GameConfig, seed: string): GameState
validateCommand(state, command): ValidationResult
applyCommand(state, command): TransitionResult      // throws nếu chưa validate
getLegalActions(state, playerId): LegalAction[]
computeIncome(state): IncomeBreakdown
getPublicView(state): PublicGameView
getPlayerView(state, playerId, visibility: "public" | "private"): PlayerGameView
```

Command chính:

| Pha | Command |
|---|---|
| setup | `StartGame` |
| preparation | `ChooseDiscards { cards[2] }` (bí mật) · `SetReady` / `UnsetReady` |
| exchange | `ProposeTrade` · `ReviseTrade` · `ConfirmTrade { proposalId, revision }` · `WithdrawConfirm` · `CancelTrade` · `SetReady` / `UnsetReady` |
| construction | `PlaceTile { tileId, cellId }` · `SetReady` / `UnsetReady` |
| income | `PayIncome { round }` (hệ thống, idempotent theo `paidIncome[round]`) |
| mọi pha | `AdvancePhase` (hệ thống, chỉ khi mọi người ready; kiểm `phase` + `revision` để không chuyển 2 lần) |

## 6. Giao dịch

```ts
interface TradeProposal {
  id; revision; status: "draft" | "ready" | "committed" | "void";
  participants: PlayerId[];                // engine: n ≥ 2; UI MVP: 2
  transfers: { from: PlayerId; to: PlayerId; asset: { kind:"coins"; amount:int } | { kind:"cell"; id } | { kind:"tile"; id } }[];
  confirmations: Record<PlayerId, number>; // revision đã xác nhận
  voidReason?: i18nKey;
}
```
- Sửa bất kỳ trường nào ⇒ `revision++`, xóa mọi confirmation.
- `ConfirmTrade` mang `revision`; lệch ⇒ reject “Đề nghị đã thay đổi”.
- Khi đủ xác nhận cùng revision ⇒ engine re-validate (pha, chủ sở hữu, số dư, tài sản chưa dùng) và áp **mọi transfer trong một `applyCommand`** — không có trạng thái nửa vời.
- Draft không khóa tài sản. Sau commit, mọi proposal khác dùng tài sản đã đổi chủ ⇒ `void` với lý do.
- Người đang ready phải `UnsetReady` trước khi xác nhận deal.
- Khi rời pha trao đổi: proposal chưa commit ⇒ `void` (“Pha trao đổi đã kết thúc”); UI cảnh báo trước khi người cuối bấm ready.

## 7. Tính thu nhập

1. Với mỗi (owner, type): lấy các cell có tile type đó thuộc owner, tìm **connected components** trên graph topology.
2. Với mỗi component: tìm **phân hoạch thành các nhóm liên thông, mỗi nhóm ≤ maxSize(type)** sao cho tổng `incomeTable[size][complete]` lớn nhất (nếu `partitionPolicy = "maximize"`; xem rules-spec G8).
3. Kích thước thực tế nhỏ: mỗi type có tối đa `2 × maxSize ≤ 10` tile trong toàn ván ⇒ component ≤ 10 ô. Thuật toán: DP trên bitmask của component (`best(mask) = max over connected submask s chứa bit thấp nhất của mask, |s| ≤ max: value(s) + best(mask \ s)`), memoize theo mask. ≤ 2¹⁰ trạng thái — tức thời, không cần worker. Vẫn đo thời gian ở fixture lớn nhất.
4. **Oracle**: liệt kê mọi set partition (Bell(10) = 115 975), lọc nhóm liên thông & ≤ max, lấy max. Property test: DP == oracle trên board ngẫu nhiên nhỏ (fast-check hoặc PRNG tự viết).
5. Output `IncomeBreakdown { round, perPlayer: { playerId, total, groups: { type, cells[], size, complete, amount, tableRef }[] }[] }`.
6. Trả bằng `PayIncome { round }`: ledger entries có `paymentId = "${gameId}:income:${round}:${playerId}"`; `paidIncome[round]` set trong cùng transaction ⇒ chạy lại không trả thêm.

## 8. PRNG

sfc32 seed từ chuỗi (hash cyrb128). State 4×uint32 lưu trong `GameState.rng` và cập nhật trong cùng command rút bài ⇒ reload không rút lại khác. Xáo Fisher–Yates.

## 9. Persistence

IndexedDB `cbd-v1`, object stores:
- `games` (key gameId): snapshot mới nhất `{ state, savedAt }`
- `commands` (key [gameId, revision]): command + events — log để giải thích/replay
- `checkpoints` (key [gameId, round, phase]): snapshot đầu mỗi pha — để nhân viên khôi phục
- `meta`: active gameId, settings quán, PIN hash

Mỗi commit: 1 transaction `readwrite` trên `games` + `commands` (+`checkpoints` khi đổi pha). Chỉ publish khi `tx.oncomplete`. Giữ 2 snapshot gần nhất (`current`, `previousGood`).

Load: validate schema (zod-like validator tự viết hoặc thư viện nhỏ), migrate theo `schemaVersion`, chạy invariants. Lỗi ⇒ không ghi đè; hiển thị màn hình hỗ trợ: thử `previousGood`, export JSON lỗi.

Reload: hủy mọi pointer session/preview; proposal về trạng thái chưa xác nhận (xóa confirmations, `revision++`); privacy cover bật.

Đơn tab: `navigator.locks.request("cbd-writer", { ifAvailable: true })`; tab không có lock → chế độ chỉ xem + thông báo.

Export/import: JSON có `schemaVersion, rulesetVersion, gameId, revision, rng, …`; import validate chặt + xác nhận thay ván hiện tại (khu vực nhân viên).

## 9b. Vận hành tại quán

| Chủ đề | Ứng dụng làm | Ứng dụng KHÔNG làm được / cần OS-browser |
|---|---|---|
| Fullscreen | Nút vào fullscreen (Fullscreen API, cần cử chỉ người dùng); tự nhắc khi bị thoát | Không ngăn được thoát fullscreen, phím tắt hệ thống, cử chỉ vuốt cạnh. **Fullscreen ≠ kiosk an toàn** |
| Kiosk | Hướng dẫn cấu hình (H-04) | Khóa máy, auto-start Chromium `--kiosk`, tắt cập nhật tự động, tắt cử chỉ OS: làm ở OS/browser, không tự cấu hình máy quán |
| Cập nhật | Bundle có `buildVersion`; save ghi `rulesetVersion` + snapshot topology | **Không áp bản cập nhật giữa ván**: server cục bộ chỉ đổi `dist/` khi không có ván đang chạy; nếu build mới mở ván cũ ⇒ dùng ruleset snapshot trong save |
| Vùng nhân viên | Mở bằng nhấn giữ 3 s ở góc + PIN tùy chọn (lưu hash) | PIN cục bộ **không** phải biện pháp bảo mật mạnh — chỉ chống bấm nhầm |
| Âm thanh | Hiệu ứng ngắn, âm lượng thấp, nút mute ở menu pause và vùng nhân viên; đóng gói tại chỗ | — |
| Dữ liệu cá nhân | Chỉ lưu tên/nghệ danh tùy chọn trong save cục bộ; không analytics, không gửi mạng | Export JSON là dữ liệu quản trị, có thể chứa thông tin riêng của ván |

## 10. Table layer (UI không chứa luật)

- `SeatLayout` cho 3/4/5: mỗi seat `{ id, edge: "S"|"N"|"E"|"W", span: [from,to], rotationDeg: 0|90|180|270 }`.
- `PointerSessionManager`: map `pointerId → session { seatId, playerId, kind, payload }`; `setPointerCapture` khi kéo; `pointercancel`/`lostpointercapture`/`blur`/`visibilitychange` ⇒ hủy session, không commit.
- Chuyển tọa độ: `trayToBoard(point, seat)` dùng `DOMMatrix` nghịch của transform khay; test 0/90/180/270.
- Hành động trên bàn chung luôn bắt đầu từ khay (player context đã biết): chọn tile trong khay → ô hợp lệ highlight → chạm ô trên bàn **hoặc** minimap trong khay → preview → xác nhận ở khay.

## 11. Game registry

```ts
interface GameModule<S> {
  id: string; titleKey: string; minPlayers: number; maxPlayers: number;
  saveSchemaVersion: number;
  createSetupDefaults(): unknown;
  create(config, seed): S;
  Render: React.ComponentType<{ session: GameSession<S> }>;
  migrate(save: unknown): S;
}
```
Launcher chỉ thấy interface này.
