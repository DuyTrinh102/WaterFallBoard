# Implementation Plan

Phiên bản 0.1 · Milestone 0 · Không cam kết ngày (chưa biết phần cứng và chưa có dữ liệu luật).

## 1. Tách blocker và phần có thể mặc định

**Blocker của engine (chặn “chế độ bám luật gốc”, không chặn việc code):** RB-1…RB-6 trong `rules-spec.md §3` — bảng phân phối, danh sách attraction, topology 78 ô, bảng thu nhập + quy tắc vượt maxSize, số phận thẻ bỏ, trao đổi ô đã xây. Tất cả cần rulebook/ảnh bàn chơi; môi trường hiện tại **bị chặn mạng** tới nguồn nhà phát hành.

**Có thể mặc định / làm ngay với fixture có nhãn:** state machine, ledger, PRNG, giao dịch nguyên tử, solver phân hoạch + oracle (độc lập số liệu), persistence, tab lock, table layer, layout 3/4/5, pointer sessions, i18n.

## 2. Thứ tự triển khai

```
M1: E-01 → E-02 → E-03 ─┬─ E-04 (prep) ─┐
                        ├─ E-05 (trade) ├─ E-08 (phases/end) → E-09 (sim) → E-10 (rules data VERIFIED)
                        ├─ E-06 (build) │
                        └─ E-07 (income)┘
M2: P-01 → T-01 → T-02 → U-01..U-05 → U-06 (vertical slice 3p)
M3: U-07..U-10, P-02..P-05, O-01, Q-01
M4: H-01..H-04
```

## 3. Backlog

Rủi ro: L / M / H.

### Milestone 1 — Engine

| ID | Kết quả | Module | Phụ thuộc | Acceptance criteria | Kiểm chứng | Rủi ro |
|---|---|---|---|---|---|---|
| E-00 | Scaffold TS + Vite + React + Vitest + Playwright, lint ranh giới import | root | — | `npm test`, `npm run build`, `npm run lint` chạy được; engine không import DOM | CI local | L |
| E-01 | Kiểu `GameState`, ID tài sản, invariants | engine/state, invariants | E-00 | Invariant phát hiện tile ở 2 nơi, số dư âm, tile trên ô không chủ | Unit test có case vi phạm | L |
| E-02 | PRNG sfc32 seed + shuffle; state lưu được | engine/rng | E-00 | Cùng seed ⇒ cùng chuỗi; serialize/deserialize giữa chừng cho cùng tiếp nối | Unit + snapshot test | L |
| E-03 | Command queue, validate/apply, idempotent commandId, revision | engine/commands, apply | E-01 | Command sai pha reject với code; commandId lặp trả kết quả cũ, state không đổi | Unit | M |
| E-04 | Pha Chuẩn bị: chia thẻ/tuile theo config, ChooseDiscards, công bố đồng thời | engine/phases | E-02, E-03, (RB-1, RB-5 cho số liệu thật) | Mỗi người nhận đúng số theo config; bỏ đúng 2; ô được gán chủ khi tất cả đã chọn | Unit với fixture 3/4/5 | M (dữ liệu) |
| E-05 | Giao dịch n bên, revision, xác nhận, commit nguyên tử, void xung đột | engine/trade | E-03 | Bảng test §12 nhóm Giao dịch pass: cash+asset 2 chiều, thiếu tiền, đổi revision, double tap, 2 deal chung tài sản, rollback toàn bộ khi 1 transfer lỗi | Unit + property test (tổng tài sản bảo toàn) | H |
| E-06 | Xây dựng: PlaceTile trên ô trống của mình | engine/build | E-03 | Reject ô sai chủ/đã có tuile; tuile chưa xây giữ sang vòng sau; đổi chủ ô không đổi vị trí tuile | Unit | L |
| E-07 | Thu nhập: components + DP phân hoạch + oracle + breakdown + PayIncome idempotent | engine/income | E-01, (RB-3, RB-4) | DP == oracle trên ≥ 10 000 board ngẫu nhiên nhỏ; case tách rời/khác chủ/phân nhánh/nhiều cách chia/chuyển chủ; `PayIncome` 2 lần trả 1 lần; thời gian đo trên fixture lớn nhất được báo cáo | Unit + property + benchmark | H |
| E-08 | Ready/unready, AdvancePhase đúng một lần, 4 vòng, kết thúc, tie-break | engine/phases | E-04..E-07 | Không chuyển pha khi có người chưa ready; AdvancePhase lặp không chuyển 2 lần; proposal chưa xong bị void khi rời pha trao đổi; xếp hạng + hòa | Unit | M |
| E-09 | `getPublicView`/`getPlayerView` lọc bí mật | engine/views | E-08 | Public view không chứa dealtCards/discards/số dư; history không chứa tổng tiền | Unit: duyệt sâu object tìm khóa cấm | M |
| E-10 | Script ván deterministic không UI 3/4/5 người | scripts/simulate | E-09 | `npm run simulate -- --players 4 --seed X` in kết quả lặp lại; invariant pass mỗi bước | Chạy 2 lần so sánh hash | L |
| E-11 | **[Chờ nguồn — D1]** Nhập dữ liệu luật VERIFIED (config + topology + SOURCES.md có trang) | rules/wp-original | RB-1..RB-6 | Mọi mục ⚑ trong rules-spec là VERIFIED; ví dụ tính trong rulebook thành test pass; topology đối xứng, 78 ô | Review chéo với ảnh bàn | **H — phụ thuộc nguồn** |

Gate M1 (theo D1): E-00…E-10 pass trên fixture `fixture-thac-v1`, invariant + oracle pass. E-11 không chặn M2/M3 nhưng chặn việc gọi là “bám luật gốc”.

### Milestone 2 — Vertical slice 3 người

| ID | Kết quả | Module | Phụ thuộc | Acceptance criteria | Kiểm chứng | Rủi ro |
|---|---|---|---|---|---|---|
| P-01 | Store UI + command queue nối engine (chưa bền vững hóa) | app, table | E-10 | UI chỉ render từ view; không có logic luật trong component | Review + lint | L |
| T-01 | Seat layout 3/4/5, xoay khay, `trayToBoard` | table | — | Test 0/90/180/270 ánh xạ đúng cellId | Unit (DOMMatrix) + Playwright screenshot | M |
| T-02 | PointerSessionManager: nhiều pointer độc lập, capture, cancel | table | T-01 | 2 pointer kéo 2 tuile cùng lúc không lẫn; pointercancel hủy preview; cùng tài sản 2 pointer → chỉ 1 session | Playwright với CDP touch nhiều điểm | M |
| U-01 | Bàn SVG + khay + minimap cùng cellId | games/wp/ui | T-01 | Chọn ô qua minimap và trực tiếp → cùng command | e2e | L |
| U-02 | Chuẩn bị: lượt xem riêng tuần tự + công bố | ui | U-01, E-04 | Khay khác không hiện thẻ; tự che khi blur/30 s | e2e + kiểm DOM không chứa số thẻ khi che | M |
| U-03 | Trao đổi: panel deal 2 bên, xác nhận theo revision | ui | U-01, E-05 | Sửa ⇒ xóa ✓; deal xung đột hiện lý do | e2e | H |
| U-04 | Xây dựng: chọn → highlight hợp lệ → preview → xác nhận; drag & tap | ui | U-01, E-06 | Ô sai hiện lý do; pointercancel không commit | e2e | M |
| U-05 | Thu nhập: highlight nhóm, breakdown, giữ để xem tiền | ui | E-07 | Breakdown khớp engine; tổng tiền không trong DOM khi che | e2e | M |
| U-06 | Vertical slice: 3 người 1 vòng đầy đủ | ui | U-02..U-05 | Từ chia thẻ đến nhận tiền không cần dev console | e2e luồng + chơi thử tay | M |

Gate M2: U-06.

### Milestone 3 — MVP trọn ván

| ID | Kết quả | Module | Phụ thuộc | Acceptance criteria | Kiểm chứng | Rủi ro |
|---|---|---|---|---|---|---|
| U-07 | Layout 4 và 5 (S1/S2 chia cạnh) | table, ui | U-06 | Mọi thao tác hoàn thành từ mỗi ghế ở 1920×1080 và 3840×2160 | Playwright screenshot + chạm mô phỏng | M |
| U-08 | Launcher, tạo ván, chọn ghế, thử xoay, presets (mặc định “Chơi mở tại quán”) | app | U-07 | Preset đang dùng và huy hiệu fixture hiển thị suốt ván; không có preset “Luật gốc” khi ruleset chưa VERIFIED | e2e | L |
| U-09 | Tutorial ván mẫu | app, ui | U-08 | 3 bước hoàn thành song song | Thử tay | M |
| U-10 | Endgame, kết quả, hòa, chơi lại sạch state | ui | E-08 | Chơi lại không mang state cũ | e2e | L |
| P-02 | IndexedDB commit nguyên tử, chỉ publish sau `oncomplete` | persistence | P-01 | Kill tab giữa commit ⇒ load về revision trước hoặc sau, không nửa vời | Integration (fake-indexeddb) + e2e reload | H |
| P-03 | Load/validate/migrate/previousGood; storage lỗi/quota | persistence | P-02 | Save hỏng không bị ghi đè; quota ⇒ chặn mutation + export cứu hộ | Integration với lỗi giả lập | M |
| P-04 | Reload recovery: hủy preview, reset xác nhận, che riêng tư; income không trả 2 lần | persistence, table | P-02, E-07 | Reload đúng lúc animation trả tiền ⇒ số dư đúng | e2e | H |
| P-05 | Tab lock + chế độ chỉ xem; export/import JSON; checkpoint nhân viên + PIN | persistence, app | P-03 | Tab 2 không ghi được | e2e 2 context | M |
| O-01 | Đóng gói offline: `dist/` + local static server port cố định; không CDN | build | U-10 | Rút mạng, khởi động lại máy/app, chơi được; không request ngoài localhost | e2e với network offline + kiểm request log | M |
| Q-01 | Checklist §12 prompt trên browser mục tiêu; README đầy đủ | tests, docs | tất cả | Mọi dòng bảng §12 có test tự động hoặc ghi “cần thiết bị thật” | Báo cáo | M |

### Milestone 4 — Pilot

| ID | Kết quả | Phụ thuộc | Acceptance criteria | Kiểm chứng | Rủi ro |
|---|---|---|---|---|---|
| H-01 | Đo trên phần cứng: touch points, palm rejection, p95 phản hồi < 100 ms, fps | Q-01, máy thật | Số liệu đo được ghi lại (không ước lượng) | Đo tay + trace Chromium | H |
| H-02 | Hiệu chỉnh hit area/tầm với/góc xoay/độ sáng | H-01 | Mọi ghế hoàn thành thao tác không đứng dậy | Quan sát | M |
| H-03 | Buổi chơi thật 3/4/5 người, ghi quan sát | H-02 | ≥ 1 ván trọn mỗi cấu hình; log điểm gây gián đoạn | Biên bản | M |
| H-04 | Kiosk/OS config hướng dẫn (không tự cấu hình máy quán) | O-01 | Tài liệu tách rõ phần app vs OS | Review | L |

### Giới hạn kiểm chứng tự động

Pointer/touch mô phỏng (Playwright, CDP) chỉ chứng minh logic nhiều pointer; **không** chứng minh phần cứng hỗ trợ đủ số điểm chạm, palm rejection, độ trễ hay độ chính xác. Các mục đó chỉ được báo “đạt” sau H-01 trên thiết bị thật. Ngưỡng p95 < 100 ms, 60 fps, ván 45–60 phút là mục tiêu đo, chưa phải kết quả.

## 4. Gap list (luật gốc chưa được UI hỗ trợ trong MVP)

- Giao dịch > 2 bên nguyên tử: engine có, UI MVP chưa (DA-13).
- Mọi mục trong rules-spec còn UNRESOLVED/CONFLICT.

## 5. Quyết định của chủ sản phẩm (08/10/2026)

| # | Câu hỏi | Quyết định | Hệ quả |
|---|---|---|---|
| D1 | Nguồn luật | **Chỉ chạy với fixture** | M1–M3 dùng ruleset `fixture-thac-v1` (số liệu giả lập, có nhãn). Preset “Luật gốc” không xuất hiện ở UI cho đến khi E-11 hoàn tất. Mọi màn hình hiện huy hiệu “Dữ liệu thử nghiệm — chưa phải luật gốc”. Gate M1 đổi thành: engine + test pass trên fixture; E-11 chuyển thành hạng mục chờ nguồn, không chặn M2/M3 |
| D2 | Thiết bị / offline | **Giữ phương án offline đã đề xuất**: local static server port cố định trên mini PC + Chromium kiosk | Thông số màn hình vẫn là giả định (product-brief §3); hit area hiệu chỉnh ở M4. PWA precache vẫn là roadmap |
| D3 | Bí mật khi chọn thẻ | **Mặc định lượt xem riêng tuần tự** | U-02 làm luồng tuần tự; “Chọn tại khay” chỉ là thử nghiệm pilot, không trong MVP |
| D4 | Preset mặc định | **“Chơi mở tại quán”**, hướng tới người mới | Ván mới mặc định tiền công khai (DA-11). Chọn bỏ thẻ vẫn tuần tự riêng (D3). Nhãn preset hiện suốt ván; có thể chuyển sang tiền ẩn khi tạo ván |
| D5 | Tên | **Tên nội bộ “Thác Công viên”** cho toàn bộ UI | Không hiển thị “Waterfall Park” trong bundle/UI; tên gốc chỉ còn trong tài liệu nội bộ để trích nguồn luật. `gameId = "thac-cong-vien"` |

Câu hỏi còn mở (không chặn M1): model/kích thước màn hình và số điểm chạm — cần trước M4.
