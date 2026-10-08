# Rules Spec — Waterfall Park (ruleset `wp-original`)

Phiên bản tài liệu: 0.1 (Milestone 0) · Ngày: 08/10/2026
Trạng thái tổng: **CHƯA ĐỦ ĐỂ CÔNG BỐ CHẾ ĐỘ BÁM LUẬT GỐC.** Không mục nào đạt VERIFIED trong lượt này.

## 0. Nguồn và tình trạng truy cập

| ID | Nguồn | Vai trò | Truy cập trong Milestone 0 |
|---|---|---|---|
| SRC-PUB | https://www.rprod.com/en/games/waterfall-park | Trang nhà phát hành | ❌ Bị chặn (proxy 403; WebFetch: ENOTFOUND) |
| SRC-EN | https://cdn.svc.asmodee.net/production-rprod/storage/games/waterfall-park/wat-en01-rules-1695414535F2a1N.pdf | Rulebook EN — **nguồn quyết định** | ❌ Bị chặn |
| SRC-FR | https://media.play-in.com/pdf/rules_games/waterfall_park_regles_fr.pdf | Rulebook FR đối chiếu hình | ❌ Bị chặn |
| SRC-FR2 | https://cdn.svc.asmodee.net/production-rprod/storage/games/waterfall-park/wat-fr01-rules-1695414537M4MX3.pdf | Rulebook FR trên CDN nhà phát hành (phát hiện qua tìm kiếm) | ❌ Bị chặn |
| PO | Chủ sản phẩm (file prompt) | Baseline đã xác nhận | ✅ |
| LEAD | Trích đoạn review/shop qua công cụ tìm kiếm (opinionatedgamers, meeplemountain, geeksundergrace, gamenerdz, ludovox, gusandco, carnetdesgeekeries…) | **Chỉ là đầu mối**, không dùng để quyết định | ⚠️ Chỉ đọc được snippet |

Lệnh đã thử (để tái lập):
```
curl -sSL -o en.pdf "<SRC-EN>"      -> curl: (56) CONNECT tunnel failed, response 403
WebFetch <SRC-EN|SRC-FR|SRC-PUB>    -> getaddrinfo ENOTFOUND
```
Cần chủ sản phẩm: (a) mở quyền mạng tới `cdn.svc.asmodee.net`, `www.rprod.com` cho môi trường, **hoặc** (b) commit PDF rulebook + ảnh rõ bàn chơi, overlay 4/5 người, aid tile vào `docs/sources/` (không public lại ngoài repo nội bộ).

## 1. Quy ước trạng thái

- **VERIFIED** — đọc trực tiếp từ SRC-EN (đối chiếu SRC-FR khi cần), ghi trang/hình.
- **PO-BASELINE** — chủ sản phẩm đã xác nhận; vẫn phải đối chiếu rulebook trước khi VERIFIED.
- **LEAD** — nhiều review khớp nhau; dùng để thiết kế cấu trúc dữ liệu, **không** được dùng làm số liệu trong ruleset tiêu chuẩn.
- **CONFLICT** — các đầu mối mâu thuẫn nhau hoặc với PO.
- **UNRESOLVED** — chưa có dữ liệu.

Quy tắc engine: ruleset `wp-original` chỉ được bật `standardSelectable = true` khi mọi mục đánh dấu ⚑ (ảnh hưởng kết quả) là VERIFIED. Dữ liệu giả lập nằm ở `tests/fixtures/` với `rulesetId` bắt đầu bằng `fixture-` và cờ `isFixture: true`; UI tạo ván ở chế độ tiêu chuẩn không liệt kê được chúng.

## 2. Bảng kiểm chứng theo nhóm

### G1. Thành phần, số lượng, thiết lập đầu ván ⚑

| Mục | Giá trị đầu mối | Trạng thái | Ghi chú |
|---|---|---|---|
| Số người | 3–5 | PO-BASELINE + LEAD | Nhãn hộp 3–5 người |
| Bàn chơi | 1 bàn, 78 ô (location) | LEAD | Cần trang/hình |
| Thẻ địa điểm | 78 thẻ, 1 thẻ ↔ 1 ô | LEAD | Đánh số ô cần xác minh |
| Tuile attraction | 72 tuile, mỗi tuile in số tối đa 3/4/5; đủ cho “2 attraction hoàn chỉnh cỡ tối đa” mỗi loại | LEAD | ⇒ tổng maxSize các loại = 36. **Số loại, tên, maxSize từng loại: UNRESOLVED.** Đầu mối FR: “Carrousel” hoàn chỉnh ở 4 tuile |
| Đế nhựa đánh dấu | 120 (24 / màu, 5 màu) | LEAD | |
| Xu | 100 xu (mệnh giá: UNRESOLVED) | LEAD | Có giới hạn ngân hàng không? UNRESOLVED |
| Tiền khởi đầu | 5 xu / người | LEAD | ⚑ |
| Round token, aid tile, overlay 4/5 người | 1 / 1 / ≥1 | LEAD | Bảng phân phối in trên bàn (3p) và overlay (4–5p) |
| Thứ tự thiết lập | Xáo 78 thẻ úp; xáo tuile úp | LEAD | |

### G2. Phân phối tài nguyên theo số người và vòng ⚑ (BLOCKER)

| Mục | Đầu mối | Trạng thái |
|---|---|---|
| Số thẻ địa điểm chia mỗi người mỗi vòng | Phụ thuộc (vòng, số người); ví dụ review 4p vòng 1: 7 thẻ, giữ 5 | UNRESOLVED |
| Số thẻ bỏ | Bỏ 2, úp, im lặng | LEAD |
| Số tuile attraction mỗi người mỗi vòng | Phụ thuộc (vòng, số người); ví dụ 4p vòng 1: 5 tuile | UNRESOLVED |
| Tuile rút công khai hay úp | Tuile trong tay **ngửa** (công khai) theo luật chính thức | LEAD |

Định dạng dữ liệu cần điền (ví dụ cấu trúc, **không phải số liệu**):
```ts
distribution: { [playerCount: 3|4|5]: { [round: 1|2|3|4]: { dealCards: int; keepCards: int; tiles: int } } } // source: "SRC-EN p.?"
```

### G3. Chọn, loại, trả lại và loại khỏi bộ thẻ; thời điểm xáo ⚑

| Mục | Trạng thái | Ghi chú |
|---|---|---|
| Chọn giữ/bỏ đồng thời, không nói chuyện | LEAD | |
| Thẻ bị bỏ đi đâu (trở lại chồng và xáo vs. loại khỏi ván) | **CONFLICT** | Hai review nói ngược nhau. Ảnh hưởng xác suất các vòng sau ⚑ |
| Thẻ đã giữ (sau khi đặt đế) bị loại khỏi ván? | UNRESOLVED | Hợp lý vì ô đã có chủ, cần xác minh |
| Thời điểm xáo | UNRESOLVED | |
| Hết thẻ/hết tuile trong chồng | UNRESOLVED | |

### G4. Hình học bàn, kề nhau, vùng ngăn cách, đánh số ⚑ (BLOCKER)

| Mục | Trạng thái |
|---|---|
| 78 ô chia 2 vùng lớn (Chinatown gốc: 6 khối) | LEAD |
| Ô hình gì (vuông?), kề nhau 4 hướng hay khác | UNRESOLVED |
| Đường/thác/lối đi ngăn cách: ô hai bên có kề nhau không | UNRESOLVED |
| Đánh số ô 1–78 trùng số thẻ | UNRESOLVED |

Engine dùng `BoardTopology { cells: { id, label, region, neighbors[] } }` nhập tay từ ảnh bàn, kèm test đối xứng (A kề B ⇔ B kề A) và test số ô = số thẻ. Không suy kề từ pixel.

### G5. Quyền sở hữu, giới hạn đế, thiếu đế

| Mục | Trạng thái |
|---|---|
| Ô thuộc người đặt đế sau pha chuẩn bị | LEAD |
| 24 đế/màu có đủ cho mọi kịch bản? Thiếu đế xử lý ra sao | UNRESOLVED (bản số không bị giới hạn vật lý — xem digital-adaptations DA-07) |

### G6. Tài sản được trao đổi; giao dịch ngay; lời hứa ⚑

| Mục | Trạng thái | Ghi chú |
|---|---|---|
| Trao đổi tự do: ô (location), tuile chưa xây, xu, mọi tổ hợp | LEAD | |
| Giao dịch chốt là ràng buộc ngay; lời hứa tương lai không ràng buộc | LEAD | Engine không thực thi lời hứa |
| Ô **đã có attraction** có trao đổi được không | **CONFLICT** | PO: “công trình giữ nguyên vị trí nhưng có thể đổi chủ”. Review A: không trao đổi tuile đã đặt, nhưng *quyền sở hữu ô* vẫn trao đổi được (⇒ tuile đi theo ô — khớp PO). Review B: tuile đã đặt “vẫn có thể trao đổi”. Giả định làm việc: **giao dịch chuyển quyền sở hữu ô; tuile trên ô đi theo**. ⚑ |
| Có được yêu cầu gỡ tuile khỏi bàn | LEAD: Không | |
| Tặng / trả tiền không kèm tài sản | UNRESOLVED (có vẻ cho phép vì “mọi tổ hợp”) | |
| Giao dịch nhiều hơn 2 bên | UNRESOLVED | |
| Trao đổi chỉ trong pha trao đổi? | LEAD | |

### G7. Điều kiện xây, giữ tài nguyên, chuyển quyền công trình ⚑

| Mục | Trạng thái |
|---|---|
| Đặt tuile lên ô trống mình sở hữu | LEAD |
| Đặt bao nhiêu tùy ý; tuile chưa đặt giữ sang vòng sau | LEAD |
| Không xây chồng tầng; công trình không di chuyển/không gỡ | PO-BASELINE + LEAD |
| Xây đồng thời hay theo lượt | LEAD: đồng thời |
| Giữ tuile sau vòng 4 có tác dụng gì (tie-break?) | UNRESOLVED |

### G8. Chia nhóm, giới hạn kích thước, bảng thu nhập ⚑ (BLOCKER)

| Mục | Trạng thái |
|---|---|
| Attraction = các tuile **cùng loại**, trên ô **kề nhau**, **cùng chủ** | LEAD (cùng chủ: suy luận từ “ô mình sở hữu”) — UNRESOLVED |
| Hoàn chỉnh khi đạt đúng maxSize in trên tuile | LEAD |
| Bảng thu nhập theo (kích thước, hoàn chỉnh/chưa) in góc trên trái bàn | LEAD; **giá trị: UNRESOLVED** |
| Thu nhập phụ thuộc loại hay chỉ (size, complete)? | UNRESOLVED |
| Nhóm **vượt** maxSize: tách thế nào, được chọn cách tách không | UNRESOLVED ⚑ |
| Ví dụ tính trong rulebook | UNRESOLVED (cần chép nguyên văn thành test) |

Đặc tả thuật toán (độc lập với số liệu): xem `architecture.md §6`. Engine tính theo **phân hoạch hợp lệ cho thu nhập lớn nhất** chỉ khi rulebook xác nhận người chơi được hưởng cách tách tốt nhất; nếu rulebook quy định cách tách cố định, thay bằng quy tắc đó. Cờ `ruleset.partitionPolicy: "maximize" | "<rule-from-book>"`.

### G9. Chuyển pha, kết thúc ván, hòa

| Mục | Trạng thái |
|---|---|
| 4 vòng × 4 pha: Chuẩn bị → Trao đổi → Xây dựng → Thu nhập | PO-BASELINE + LEAD |
| Không có tính điểm cuối ván; thắng = nhiều xu nhất sau vòng 4 | LEAD ⚑ |
| Hòa: nhiều tuile attraction trên bàn hơn thắng | LEAD ⚑ |
| Vẫn hòa sau tie-break | UNRESOLVED (đề xuất: đồng hạng) |
| Pha trao đổi kết thúc khi nào (giới hạn thời gian?) | UNRESOLVED; PO: chế độ gốc tắt đồng hồ |

### G10. Công khai / bí mật

| Thông tin | Thời điểm | Trạng thái |
|---|---|---|
| Thẻ đang cầm khi chọn, thẻ bị bỏ | Pha chuẩn bị | Bí mật — LEAD |
| Ô đã nhận (đế trên bàn) | Sau pha chuẩn bị | Công khai — LEAD |
| Tuile attraction trong tay | Luôn | **Công khai** (luật gốc) — LEAD; có biến thể “ẩn” không chính thức |
| Thu nhập vừa nhận | Lúc trả | Công bố, rồi xu để úp — LEAD |
| Tổng tiền | Đến cuối ván | **Bí mật** — LEAD ⚑ (UX) |
| Xu trong giao dịch | Khi giao | Công khai |

## 3. Blocker cho engine (Milestone 1)

| ID | Blocker | Nhóm |
|---|---|---|
| RB-1 | Bảng phân phối thẻ/tuile theo (số người, vòng) | G2 |
| RB-2 | Danh sách loại attraction, maxSize, số tuile mỗi loại | G1 |
| RB-3 | Topology 78 ô + vùng ngăn cách + đánh số | G4 |
| RB-4 | Bảng thu nhập (size × complete) và quy tắc nhóm vượt maxSize | G8 |
| RB-5 | Số phận thẻ bị bỏ (trả chồng/loại) và thời điểm xáo | G3 |
| RB-6 | Có trao đổi ô đã có attraction không | G6 |

Phần **không** bị chặn có thể làm ngay ở M1 với fixture: state machine, ledger, giao dịch nguyên tử, solver phân hoạch + oracle, persistence, PRNG.

## 4. Các điểm có thể mặc định (không ảnh hưởng kết quả)

Mệnh giá xu (bản số dùng integer), giới hạn 24 đế (bản số không cần), thứ tự hiển thị, hòa sau tie-break → đồng hạng (ghi rõ trong digital-adaptations nếu rulebook im lặng).
