# Digital Adaptations — khác biệt của bản số hóa

Mọi thay đổi so với board game vật lý do màn hình chung, thời gian, xác nhận, hoàn tác hoặc chế độ quán. Mỗi mục: lý do · tác động chiến thuật · cách hiển thị. Mục đánh dấu **[Preset]** chỉ bật khi chọn preset tương ứng, không bao giờ bật âm thầm.

| ID | Thay đổi | Lý do | Tác động chiến thuật | Hiển thị cho người chơi |
|---|---|---|---|---|
| DA-01 | **Chọn bài bí mật bằng lượt xem riêng tuần tự** (màn che → người kế tiếp chạm “Tôi đã sẵn sàng xem” → chọn bỏ 2 → che lại) | Màn hình chung không giữ bí mật được | Chọn không còn đồng thời; người chọn sau không thấy gì hơn người trước (thẻ đã chia sẵn, không lộ lựa chọn người khác) → trung lập. Chậm thêm ~15–30 s/người | Banner “Lượt xem riêng: [Tên]” ở khay đó; khay khác hiện “Vui lòng quay đi”. Phần lý do ghi trong tutorial |
| DA-02 | **Tổng tiền ẩn, nhấn giữ để xem** | Luật: xu để úp; trên màn hình không có “úp” | Người khác nhìn thấy được nếu cố tình nhìn — tương đương nhìn lén chồng xu | Nút “Giữ để xem tiền” trong khay; thả ra là che; pause/reload/mất focus tự che |
| DA-03 | **Thu nhập vừa nhận được công bố rồi cộng vào ẩn** | Tái hiện “công bố rồi úp xu” | Người chơi có thể ghi nhớ như bản vật lý; app **không** cung cấp lịch sử tiền của người khác | Animation công bố ngắn; lịch sử công khai chỉ ghi “Nhận thu nhập vòng N” không ghi tổng |
| DA-04 | **Giao dịch phải được ghi vào màn hình và cả hai bên xác nhận tại ghế** | Engine cần biết để chuyển tài sản | Deal bằng lời vẫn tự do; chỉ phần thực thi qua UI. Lời hứa tương lai không được ghi thành ràng buộc | Panel deal giữa hai khay; chữ “Xác nhận tại ghế không phải xác thực danh tính” trong tutorial |
| DA-05 | **Kiểm tra số dư khi commit deal có thể để lộ “không đủ tiền”** | Engine phải từ chối giao dịch thiếu tiền | Lộ một bit thông tin. Giảm thiểu: người trả tiền thấy số dư của mình khi soạn deal (giữ để xem) nên hiếm khi xảy ra | Lỗi trung tính “Không thể thực hiện — kiểm tra lại tài sản của bên trả” chỉ hiện ở khay người trả |
| DA-06 | **Ready theo người thay cho đồng thuận miệng “xong rồi”** | Cần điều kiện chuyển pha xác định | Ai chưa ready giữ pha mở — như ngoài đời. Không tự chuyển pha | Thanh ready trên mỗi khay + chỉ báo trung tâm “3/5 sẵn sàng” |
| DA-07 | **Không giới hạn đế/xu vật lý** | Số không bị giới hạn linh kiện | Nếu rulebook có luật thiếu đế/xu, sẽ áp lại đúng luật (rules-spec G5) | Không hiển thị |
| DA-08 | **Undo chỉ trong bước chưa commit** | Tránh tranh chấp/lộ thông tin | Không có “xin đi lại” sau khi deal/xây đã commit — chặt hơn bàn thật nơi nhóm có thể thỏa thuận lại | Nút “Hủy” trên preview; sau commit chỉ có checkpoint của nhân viên (có cảnh báo) |
| DA-09 | **Xây dựng đồng thời trong khay, commit từng tuile** | Tái hiện xây đồng thời | Có thể nhìn người khác xây trước rồi phản ứng — giống bàn thật | Preview mờ trên bàn chỉ hiện khi xác nhận; tuile commit có animation ngắn |
| DA-10 | **Tính thu nhập tự động theo phân hoạch tối ưu** (nếu luật cho phép) | Tránh tranh cãi/tính sai | Không còn lỗi tính tay | Highlight nhóm + công thức tra bảng |
| DA-11 | **[Preset “Chơi mở tại quán”]** tiền và lựa chọn bài công khai | Nhóm muốn nhanh | Thay đổi động lực bluff | Nhãn preset hiện suốt ván ở thanh trạng thái |
| DA-12 | **[Preset “Nhắc giờ”]** đồng hồ nhắc ở pha trao đổi | Vận hành quán | Áp lực thời gian; **không** tự chuyển pha | Đồng hồ ở trung tâm; nhãn preset |
| DA-13 | **Giao dịch nhiều bên**: engine hỗ trợ, UI MVP chỉ 2 bên | Giới hạn UI | Deal 3 bên phải làm thành nhiều deal 2 bên — **không** nguyên tử. Ghi là giới hạn của bản số | Tutorial + gap list |
| DA-14 | **Chọn ô bằng minimap/ID trong khay** | Tầm với | Không | Minimap trong khay + highlight đồng bộ trên bàn chung |
| DA-15 | **Hòa sau tie-break → đồng hạng** (chỉ nếu rulebook im lặng) | Cần kết quả xác định | Không | Màn hình kết quả hiện “Đồng hạng” |
