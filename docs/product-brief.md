# Product Brief — Coffee Boardgame Digital: game #1 — tên hiển thị “Thác Công viên” (dựa trên luật Waterfall Park)

Phiên bản 0.1 · Milestone 0 · 08/10/2026

## 1. Mục tiêu

Một màn hình cảm ứng **nằm ngang** đặt trên bàn quán cà phê; 3–5 người ngồi quanh bốn cạnh, chơi Waterfall Park theo luật gốc. Người chơi **nhìn nhau và thương lượng bằng lời**; màn hình chỉ:

- giữ và hiển thị tài sản (ô, tuile attraction, xu),
- ghi nhận deal đã chốt và thực thi nguyên tử,
- hỗ trợ xây dựng và tính thu nhập có giải thích.

Không biến trải nghiệm thành điền form, đọc bảng số, hoặc chờ một người thao tác.

Mục tiêu lần đầu: **prototype chơi trọn ván**, rồi **pilot tại một bàn thật**. Prototype không được coi là sẵn sàng kinh doanh.

## 2. Phạm vi

| Hạng mục | Quyết định | Nguồn |
|---|---|---|
| Luật | Waterfall Park gốc, có hồ sơ kiểm chứng (`rules-spec.md`) | PO |
| Người chơi (chính) | 3–5 | PO |
| 2 người | Biến thể thử nghiệm sau MVP, ruleset riêng | PO |
| Thiết bị | 1 màn hình cảm ứng nằm ngang; chuột cho dev/dự phòng | PO |
| Điện thoại | Không trong MVP (roadmap) | PO |
| Ngôn ngữ | Tiếng Việt; key văn bản tách logic | PO |
| Kết nối | Offline trong ván | PO |
| Đồng hồ thương lượng | Tắt (gốc); bật nhắc giờ ở preset quán | PO |
| Dữ liệu luật | Fixture có nhãn cho đến khi có rulebook | PO (D1) |
| Offline | Local static server + Chromium kiosk | PO (D2) |
| Chọn bỏ thẻ | Lượt xem riêng tuần tự | PO (D3) |
| Preset mặc định | “Chơi mở tại quán” (tiền công khai) | PO (D4) |
| Tên hiển thị | “Thác Công viên” | PO (D5) |
| Bot/AI | Không | PO |

## 3. Giả định phần cứng (CHƯA xác nhận — phải đo trên máy đích)

| Giả định | Giá trị dùng để thiết kế | Ảnh hưởng nếu sai |
|---|---|---|
| Độ phân giải tham chiếu | 1920×1080 CSS px, kiểm tra thêm 3840×2160 (DPR 2) | Kích thước chữ/hit area |
| Kích thước vật lý | 43″–55″ (≈ 0,5–0,63 mm/px ở 1080p) | 56 px ≈ 28–35 mm — đủ cho ngón tay; cần hiệu chỉnh |
| Điểm chạm đồng thời | ≥ 10, có palm rejection | Nếu < 5: phải hạn chế thao tác song song |
| Máy chạy | Mini PC x86 hoặc màn hình all-in-one chạy Chromium ≥ 120 | Hiệu năng SVG, IndexedDB, Web Locks |
| Hệ điều hành | Linux/Windows có kiosk mode của Chromium | Kiosk phải cấu hình ở OS/browser |
| Mặt kính | Chống chói, đặt ngang tầm bàn | Màu/độ tương phản |
| Tầm với | Giữa bàn khó với từ ghế với màn ≥ 50″ | Cần chọn ô từ khay (minimap/ID) |

## 4. Trải nghiệm tại bàn (nguyên tắc)

1. **Bàn chung ở giữa không xoay.** Mỗi người có khay ở cạnh gần mình, xoay chữ về phía họ.
2. **Ghế ≠ playerId.** Ghế là cấu hình vị trí; có bước chọn ghế và thử chiều xoay.
3. **Thao tác cốt lõi gần người chơi:** chọn ô qua minimap trong khay hoặc chạm trực tiếp — cả hai trỏ cùng `cellId`.
4. **Đồng thời:** mọi người thao tác cùng lúc trong khay riêng; engine xử lý tuần tự.
5. **Ready theo người**, chuyển pha khi tất cả ready.
6. **Bí mật là cơ chế xã hội**, không phải bảo mật kỹ thuật (xem `tabletop-ux.md §4`).
7. **Không modal toàn màn hình** khi người khác đang thương lượng; panel bám theo khay.
8. **Giải thích, không chặn mù:** hành động không hợp lệ nói lý do ngắn gọn.
9. Hình lớn, chữ ít, tươi sáng; phân biệt người chơi bằng **màu + biểu tượng + tên**; attraction bằng **icon/hình**, không chỉ màu.

## 5. Tiêu chí thành công của pilot

- Nhóm 3/4/5 người lạ với game hoàn thành ván trong 45–60 phút có tutorial ngắn.
- Không cần nhân viên can thiệp để sửa state.
- Người chơi đánh giá thời gian “nhìn màn hình” không lấn át thời gian nói chuyện (quan sát + hỏi sau ván).
- Không mất state qua reload/mất điện ngắn.

## 6. Ngoài phạm vi MVP

2 người, điện thoại cá nhân/QR, online, bot, tài khoản, thanh toán, loyalty, dashboard nhiều quán, 3D, nhiều game.

## 7. Pháp lý / tài sản

Dùng asset tự tạo cho prototype; ghi `assets/ATTRIBUTION.md`. UI dùng tên nội bộ **“Thác Công viên”** (D5). **Trước pilot thương mại phải xác nhận quyền dùng luật, luật và artwork với chủ sở hữu (Repos Production / Asmodee).** Rulebook không được đóng gói vào sản phẩm.
