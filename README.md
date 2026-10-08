# Coffee Boardgame Digital — Thác Công viên (MVP thử nghiệm)

Game đầu tiên, dựa trên luật Waterfall Park; tên hiển thị nội bộ “Thác Công viên”.
3–5 người ngồi quanh **một màn hình cảm ứng nằm ngang**, thương lượng bằng lời; máy giữ tài sản, ghi giao dịch, xây dựng và tính thu nhập.

> ⚠️ **Dữ liệu thử nghiệm (quyết định D1).** Bảng chia bài, bảng thu nhập và bản đồ 78 ô là *fixture* `fixture-thac-v1`,
> chưa phải luật gốc. Mọi màn hình đều gắn nhãn này. Xem `docs/rules-spec.md`.

## Chạy thử nhanh

| Cách | Lệnh |
|---|---|
| Cài đặt | `npm install` (Node ≥ 20; đã thử với Node 22) |
| Chạy dev | `npm run dev` → mở http://localhost:5173 |
| Build | `npm run build` → `dist/` |
| **Chạy offline trên máy quán** | `npm run build && npm run serve` → http://127.0.0.1:4173 (port cố định — bản lưu IndexedDB gắn với địa chỉ này) |
| Một file HTML tự chứa | `npm run build:single` → `dist-single/index.html` (mở trực tiếp, không cần mạng) |
| Test engine + bố cục | `npm test` |
| Test giao diện (Playwright) | `npm run e2e` (dùng Chromium tại `/opt/pw-browsers/...`; đổi bằng biến `PW_CHROMIUM`) |
| Ván mô phỏng không UI | `npm run simulate -- --players 4 --seed demo` |
| Demo 2.5D (thử nghiệm, chưa thuộc game) | `npm run dev:demo3d` hoặc `npm run build:demo3d` → `dist-demo3d/index.html` |

Chế độ kiosk/toàn màn hình do hệ điều hành và trình duyệt cấu hình (ví dụ `chromium --kiosk http://127.0.0.1:4173`); ứng dụng không tự khoá máy.

## Cách chơi trên màn hình

1. **Ván mới** → chọn 3/4/5 người, sửa tên, chạm hai ghế để đổi chỗ, chọn chế độ (mặc định **Chơi mở tại quán**: tiền công khai).
2. **Kiểm tra chỗ ngồi**: mỗi người chạm “Đây là khay của tôi” trong khay trước mặt.
3. **Chọn địa điểm**: lần lượt từng người *giữ 1 giây* để mở phần xem riêng, chọn 2 ô để bỏ; người khác quay đi.
4. **Trao đổi**: “🤝 Giao dịch” → chọn đối tác → chọn ô/tuile/xu hai chiều → Gửi. Người kia bấm **Đồng ý** tại khay mình. Sửa đề nghị sẽ xoá xác nhận cũ.
5. **Xây dựng**: chạm tuile trong khay → chạm ô sáng (trên bàn hoặc bản đồ nhỏ) → **Xây ✓**.
6. **Thu nhập**: máy tính theo bảng và hiển thị từng nhóm; bấm **Tiếp tục**. Sau vòng 4 hiện kết quả.

Nút ⏸ ở bốn góc: tạm dừng (che màn hình), cách chơi, khu vực nhân viên (xuất/nhập save, kết thúc ván).

## Lưu & khôi phục

- Mỗi thao tác được ghi vào IndexedDB **trước** khi hiển thị. Tải lại trang → **Tiếp tục ván đang chơi**.
- Lưu kèm bản tốt trước đó; bản lỗi không bị ghi đè (khôi phục bản trước và báo).
- Không ghi được (hết dung lượng…) → dừng thao tác, cho **Thử lưu lại** hoặc **Xuất save**.
- Mở tab thứ hai → tab đó chỉ xem.
- Nhân viên: ⏸ → Xuất save (JSON) / Nhập save (kiểm tra hợp lệ, phải bấm xác nhận mới thay ván).

## Cấu trúc

```
src/games/thac-cong-vien/engine/   luật thuần TS (không phụ thuộc UI) + test
src/games/thac-cong-vien/rules/    fixture-thac-v1 (dữ liệu thử nghiệm có nhãn)
src/games/thac-cong-vien/ui/       bàn, khay, giao dịch, xây, thu nhập
src/table/                         bố cục ghế 3/4/5, xoay khay
src/persistence/                   IndexedDB, khoá một tab, export
src/app/                           launcher, tạo ván, pause, session
docs/                              brief, rules-spec, kiến trúc, UX, kế hoạch
```

## Demo 2.5D

`demo3d/` + `src/demo3d/`: bàn chơi dựng bằng Three.js, camera nhìn thẳng từ trên xuống, mô hình low-poly
dựng từ khối hình học, hiệu ứng xây và xu bay về khay, nút thử camera nghiêng và đo fps. Dùng engine và bản đồ
thật (ván mô phỏng). Mục đích: đo trên màn hình quán trước khi quyết định đưa 3D vào game.

## Giới hạn hiện tại

Xem `docs/implementation-plan.md` §6 (trạng thái & gap list). Chính:
- Luật là dữ liệu thử nghiệm; chưa đối chiếu rulebook.
- Giao dịch trên UI chỉ 2 bên; chưa có kéo-thả (chỉ chạm-chọn → chạm-đặt); tutorial là trang hướng dẫn chữ, chưa có ván mẫu tương tác; chưa có âm thanh.
- Chưa thử trên màn hình cảm ứng thật (đa điểm chạm, palm rejection, độ trễ).
- Trong bản link artifact: nút Xuất save không tải được file (giới hạn của trình xem); chạy bản local để dùng.
