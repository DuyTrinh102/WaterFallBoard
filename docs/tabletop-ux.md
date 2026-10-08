# Tabletop UX — màn hình nằm ngang

Phiên bản 0.1 · Milestone 0 · Khung tham chiếu 1920×1080 CSS px (giả định — xem product-brief §3)

## 1. Quy ước chung

- Cạnh **S** (dưới) và **N** (trên) là cạnh dài 1920 px; **W** (trái) và **E** (phải) là cạnh ngắn 1080 px.
- Khay cạnh dài: cao 220 px. Khay cạnh ngắn: rộng 220 px, dài tối đa 640 px (tránh góc để không đè khay cạnh dài).
- Xoay khay: S = 0°, E = 270° (chữ hướng ra cạnh phải), N = 180°, W = 90°.
- Vùng bàn chung (trung tâm) ≈ 1480 × 640 px, không bao giờ xoay. Số ô/ID dùng font số đọc được cả khi lộn ngược (không dùng 6/9 trần: thêm gạch dưới `6̲`/`9̲`).
- Nút cảm ứng ≥ 56 px, cách nhau ≥ 12 px. Hiệu chỉnh ở pilot.
- 4 góc màn hình: nút **⏸ Pause/Trợ giúp** nhỏ (56 px) — mỗi người đều với tới một góc.
- Mỗi người chơi: màu + biểu tượng (★ ● ▲ ■ ◆) + tên. Attraction: icon riêng + số maxSize, không chỉ màu.

Ký hiệu wireframe: `[S1]` khay ghế, `▣` minimap, `⏸` pause, `◷` ready.

## 2. Layout 3 người

Mặc định: S, N, E (ghế W trống ⇒ bảng tra thu nhập công khai đặt cạnh W, xoay 90°). Ghế là cấu hình — có thể chọn S/N/W v.v.

```
┌────────────────────────────────────────────────────────────────────────────┐
│⏸                [N1 ▲ Lan]  khay 180°: tiles · ▣ · ◷ · 💰giữ-xem          ⏸│
├──────┬─────────────────────────────────────────────────────────────┬───────┤
│ Bảng │                                                             │ [E1 ● │
│ thu  │                 BÀN CHUNG (78 ô, 2 vùng)                   │  Minh]│
│ nhập │      ┌───── Vùng A ─────┐  ≈thác≈  ┌───── Vùng B ─────┐      │ khay  │
│ (công│      │ ô số + đế màu    │          │                   │      │ 270°  │
│ khai)│      └──────────────────┘          └───────────────────┘      │ tiles │
│ 90°  │       Thanh trạng thái: Vòng 2 · TRAO ĐỔI · ◷ 1/3 sẵn sàng   │ ▣ ◷   │
├──────┴─────────────────────────────────────────────────────────────┴───────┤
│⏸                [S1 ★ An]  khay 0°: tiles · ▣ · deal · ◷ · 💰giữ-xem       ⏸│
└────────────────────────────────────────────────────────────────────────────┘
```
Khay cạnh dài của 3p rộng tối đa 1480 px nhưng nội dung chính gom vào ~900 px giữa (gần người ngồi).

## 3. Layout 4 người — mỗi cạnh một ghế

```
┌────────────────────────────────────────────────────────────────────────────┐
│⏸                       [N1 ▲]  khay 180°                                  ⏸│
├───────┬────────────────────────────────────────────────────────────┬───────┤
│[W1 ■] │                                                            │[E1 ●] │
│khay   │                     BÀN CHUNG                              │khay   │
│90°    │                                                            │270°   │
│tiles  │                                                            │tiles  │
│▣ ◷    │      trạng thái pha (giữa, nhỏ, lặp 2 hướng N/S)           │▣ ◷    │
├───────┴────────────────────────────────────────────────────────────┴───────┤
│⏸                       [S1 ★]  khay 0°                                    ⏸│
└────────────────────────────────────────────────────────────────────────────┘
```
Bảng thu nhập: nút “Bảng thu nhập” trong mỗi khay mở thẻ chi tiết xoay theo khay đó (không che bàn).

## 4. Layout 5 người — hai ghế chia cạnh S

```
┌────────────────────────────────────────────────────────────────────────────┐
│⏸                       [N1 ▲]  khay 180°                                  ⏸│
├───────┬────────────────────────────────────────────────────────────┬───────┤
│[W1 ■] │                                                            │[E1 ●] │
│90°    │                     BÀN CHUNG                              │270°   │
│       │                                                            │       │
├───────┴──────────────────────────────┬─────────────────────────────┴───────┤
│⏸   [S1 ★]  khay 0° (≈ 900 px)        │   [S2 ◆]  khay 0° (≈ 900 px)       ⏸│
└──────────────────────────────────────┴─────────────────────────────────────┘
```
S1 và S2 có vùng thao tác, pointer session và ready độc lập; vạch chia rõ và màu viền theo người chơi. Panel deal giữa S1–S2 mở **phía trên** ranh giới hai khay (nằm trong bàn chung, cao ≤ 200 px).

## 5. Nội dung khay (trạng thái thu gọn, cạnh dài)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ★ An  │ Tuile: [🎠4][🎠4][🎢5][🌊3] │ Ô của tôi: 12 · ▣ minimap │ 💰 Giữ để xem │ ◷ Sẵn sàng │
│       │ (kéo hoặc chạm để chọn)      │ (chạm ô = chọn cellId)   │               │            │
│ [＋ Tạo giao dịch]   [Bảng thu nhập]   gợi ý ngắn theo pha                                   │
└──────────────────────────────────────────────────────────────────────────┘
```
Tuile trong tay là **công khai** theo luật gốc (rules-spec G10) nên hiển thị ngửa. Tổng tiền ẩn.

## 6. Thông tin bí mật (private-view)

Giới hạn bắt buộc nêu trong tutorial: *“Màn hình dùng chung không thể giữ bí mật tuyệt đối. Khi đến lượt xem riêng của bạn, người khác vui lòng quay đi.”*

### 6.1 Chọn thẻ bỏ (pha Chuẩn bị) — mặc định lượt xem riêng tuần tự

```
Khay người đến lượt                                Khay người khác
┌──────────────────────────────────────┐          ┌────────────────────────────┐
│ 🔒 Lượt xem riêng: An                 │          │ 🙈 An đang xem riêng.       │
│ Mọi người khác vui lòng quay đi.     │          │ Vui lòng quay đi.           │
│ [ Giữ 1 giây: Tôi đã sẵn sàng xem ]  │          └────────────────────────────┘
└──────────────────────────────────────┘
        ▼ (giữ 1 s)
┌──────────────────────────────────────┐   Bàn chung: KHÔNG highlight ô của thẻ đang xem
│ Thẻ: [12][27][33][41][58][61][70]    │   (highlight sẽ lộ thông tin)
│ Chạm 2 thẻ để BỎ (úp)                 │
│ [ Hủy chọn ] [ Xác nhận bỏ 2 thẻ ]    │   → xác nhận → che lại → người kế tiếp
└──────────────────────────────────────┘
```
- Thứ tự lượt theo thứ tự ghế theo chiều kim đồng hồ, bắt đầu từ ghế khác mỗi vòng.
- Tự che sau 30 s không chạm / pause / mất focus / reload.
- Sau khi mọi người đã chọn: **công bố đồng thời** — đế xuất hiện trên bàn cùng lúc (animation 1 s).
- Mặc định đã chốt (D3): tuần tự. Preset “Chọn tại khay” chỉ thử ở pilot, không trong MVP: mọi người chọn cùng lúc trong khay mình, thẻ chỉ hiện khi đang giữ ngón tay. Nhanh hơn nhưng lộ hơn.

### 6.2 Tiền
- Preset mặc định “Chơi mở tại quán” (D4): tổng tiền hiện công khai trên khay, không cần giữ-để-xem. Các quy tắc dưới áp dụng khi chọn preset “Tiền ẩn”.
- Nút “💰 Giữ để xem” — thả là che. Không hiện tổng trong lịch sử, toast, `aria-label` (label chỉ “Tiền của bạn, giữ để xem”), hay thông báo lỗi.
- Khi soạn deal có trả tiền: panel deal cho phép giữ để xem số dư bên cạnh ô nhập số.

## 7. Luồng giao dịch (pha Trao đổi)

```
(1) An chạm [＋ Tạo giao dịch] → chọn đối tác (chip tên + biểu tượng)
(2) Panel deal mở giữa 2 khay (gần cạnh của người tạo; 5p S1–S2: trên ranh giới)
┌───────────── Giao dịch #4 · phiên bản 3 ─────────────┐
│  ★ An đưa:                    ● Minh đưa:             │
│  [ô 12] [🎠4]  [+ thêm]        [ô 33] 💰 3  [+ thêm]   │
│  ───────────────────────────────────────────────────  │
│  ★ An  [✓ Xác nhận v3]          ● Minh [  Xác nhận ]  │ ← mỗi nút nằm trong khay của chính người đó
│  [Sửa] [Hủy giao dịch]                                │
└───────────────────────────────────────────────────────┘
(3) Thêm tài sản: chạm trong khay mình / ô trên minimap / ô trên bàn → đều cùng cellId.
(4) Sửa bất kỳ ⇒ phiên bản 4, mọi ✓ bị xóa (hiệu ứng “xác nhận đã bị xóa vì đề nghị thay đổi”).
(5) Cả hai ✓ cùng phiên bản ⇒ engine commit nguyên tử ⇒ animation đổi màu đế (công trình KHÔNG di chuyển).
(6) Deal khác dùng chung tài sản ⇒ chuyển xám “Không còn hiệu lực: ô 12 đã đổi chủ”.
```
- Xác nhận nằm trong khay của từng người (xoay theo họ), mang text tóm tắt: “Bạn đưa ô 12 + 🎠4, nhận ô 33 + 3 xu”.
- Người đang ◷ ready phải bỏ ready trước khi xác nhận.
- Ghi chú lời hứa (tùy chọn): chip “📝 Lời hứa — không ràng buộc”.

## 8. Luồng xây dựng (pha Xây dựng)

```
Khay: chạm tuile [🎠4]  ──►  Bàn: chỉ ô trống của tôi được highlight (viền màu tôi + chấm)
                              minimap trong khay highlight cùng ô
       chạm ô 27 (bàn hoặc minimap)
                    ──►  Preview mờ tuile trên ô 27 + nhãn ở khay:
                         “🎠 Carousel tại ô 27 → nhóm 3/4 (chưa hoàn chỉnh), thu nhập dự kiến: [theo bảng]”
                         [Hủy]  [Xây ✓]
       Xây ✓        ──►  commit → animation 300 ms → khay trở về chọn tuile
```
- Kéo-thả tương đương: kéo từ khay sang bàn; thả ngoài ô hợp lệ = hủy. `pointercancel` = hủy.
- Ô không hợp lệ khi chạm: lắc nhẹ + lý do ngắn trong khay (“Ô 27 không thuộc bạn”).
- Hai người có thể xây cùng lúc; preview của người khác không chặn nhau (ô khác chủ không trùng).

## 9. Thu nhập & kết quả

- Bàn: lần lượt highlight nhóm theo người (đường viền nhóm), 1–2 s mỗi người, có nút “Bỏ qua animation”.
- Mỗi khay: “Bạn nhận +N xu” với danh sách nhóm: `🎠 4/4 hoàn chỉnh → N` (tra bảng, có tham chiếu dòng bảng).
- Sau công bố, số tiền gộp vào tổng ẩn (DA-03).
- Kết quả cuối ván: công bố tổng mọi người, thứ hạng, tie-break (“Hòa 24 xu — An thắng nhờ 9 tuile trên bàn”), [Chơi lại] [Về trang chọn game].

## 10. Màn hình khác

| Màn hình | Ghi chú |
|---|---|
| Chọn game | 1 thẻ game lớn ở giữa, chữ lặp 2 hướng |
| Tạo ván | Số người 3/4/5 → sơ đồ ghế bấm chọn → tên/nghệ danh, màu+icon → preset (**Chơi mở tại quán** — mặc định / Tiền ẩn / Nhắc giờ; “Luật gốc” chỉ xuất hiện khi ruleset VERIFIED) → thử xoay (“Chạm vào khay của bạn”) |
| Tutorial | Ván mẫu 3 bước thao tác được trong từng khay song song: chọn tuile & xây · tạo deal mẫu · giữ để xem tiền |
| Pause/hỗ trợ | Từ bất kỳ góc: che thông tin riêng, dừng timer, menu: Tiếp tục (đếm ngược 3 s) · Luật nhanh · Nhân viên (PIN tùy chọn): khôi phục checkpoint, export, kết thúc ván |
