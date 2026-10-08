# Prompt cho Claude Code — Coffee Boardgame Digital / Waterfall Park

Ngày chuẩn bị: 08/10/2026.

## Cách sử dụng

Đặt file này tại thư mục gốc repository rồi giao Claude Code đọc toàn bộ. Nội dung từ “Bắt đầu prompt” là chỉ dẫn thực thi. Lượt đầu yêu cầu hoàn tất Milestone 0: khảo sát và kế hoạch triển khai; chưa viết toàn bộ game. Sau khi xem kế hoạch, giao triển khai từng milestone bằng câu lệnh ở cuối file.

Các quyết định đã được chủ sản phẩm xác nhận: bám luật Waterfall Park gốc; dùng một màn hình cảm ứng nằm ngang, người chơi ngồi quanh bàn. Các lựa chọn khác dưới đây là mặc định đề xuất, cần ghi nhận trong kế hoạch; không coi là thông số phần cứng đã được xác nhận.

---

# Bắt đầu prompt

Bạn là senior game developer và technical lead, có kinh nghiệm làm game tabletop trên màn hình cảm ứng dùng chung. Hãy giúp tôi thiết kế và triển khai game đầu tiên của sản phẩm Coffee Boardgame Digital.

## 1. Bối cảnh và mục tiêu

Tôi muốn đặt một màn hình cảm ứng nằm ngang ở bàn trong quán cà phê. Nhiều người ngồi xung quanh, chơi trực tiếp và nói chuyện với nhau như board game vật lý. Sản phẩm dài hạn là một bộ game cho nhóm từ 2 người trở lên. Game đầu tiên lấy Waterfall Park làm nền, ưu tiên bám luật gốc.

Giá trị cốt lõi: người chơi nhìn nhau, thương lượng bằng lời; màn hình hỗ trợ quản lý tài sản, ghi nhận thỏa thuận, xây dựng và tính thu nhập. Tránh biến trải nghiệm thành đọc form, quản lý bảng số liệu hoặc chờ một người thao tác quá lâu.

Mục tiêu lần đầu là một prototype chơi trọn ván, sau đó pilot trên bàn thật tại quán. Không tự động coi prototype đã sẵn sàng kinh doanh.

## 2. Phạm vi đã chốt và giả định

| Hạng mục | Quyết định |
|---|---|
| Luật chính | Waterfall Park gốc, có hồ sơ kiểm chứng nguồn |
| Số người chế độ chính | 3–5 người |
| 2 người | Biến thể thử nghiệm riêng, chưa thuộc MVP chính |
| Vị trí màn hình | Nằm ngang, nhóm ngồi quanh bốn cạnh |
| Thiết bị điều khiển | Cảm ứng là chính; chuột để phát triển và dự phòng |
| Điện thoại | Không bắt buộc trong MVP |
| Ngôn ngữ | Tiếng Việt; key văn bản tách khỏi logic |
| Kết nối | Chơi tại một máy, không phụ thuộc Internet trong ván |
| Hình ảnh | 2D dễ đọc; asset prototype tự tạo hoặc có giấy phép phù hợp |
| Độ phân giải giả định | Thiết kế tham chiếu 1920×1080; kiểm tra thêm 4K |
| Cấu hình máy | Chưa biết; phải ghi là giả định và đo trên máy đích |
| Đồng hồ thương lượng | Tắt ở chế độ bám luật gốc; có thể bật nhắc giờ ở cấu hình quán |

Không tự suy diễn “bộ game từ 2 người” thành “Waterfall Park gốc hỗ trợ 2 người”. Không đưa bot vào game chỉ để lấp chỗ trống.

## 3. Kiểm chứng luật trước khi code

Nguồn ưu tiên:

- Trang nhà phát hành: https://www.rprod.com/en/games/waterfall-park
- Rulebook tiếng Anh được liên kết từ trang nhà phát hành: https://cdn.svc.asmodee.net/production-rprod/storage/games/waterfall-park/wat-en01-rules-1695414535F2a1N.pdf
- Bản rulebook tiếng Pháp để đối chiếu hình: https://media.play-in.com/pdf/rules_games/waterfall_park_regles_fr.pdf

Nếu đường dẫn thay đổi, tìm lại từ trang nhà phát hành. Không lấy một bài review làm nguồn quyết định luật. Nếu bảng hoặc hình không đọc rõ, yêu cầu ảnh rõ của đúng trang; vẫn tiếp tục phần kế hoạch và phần độc lập với dữ liệu đó.

Mô tả ban đầu của tôi có chi tiết chưa đúng với luật gốc. Baseline cần dùng: 4 vòng; 4 pha chuẩn bị, trao đổi, xây dựng, thu nhập; không có xây chồng tầng. Bàn dùng các vị trí cố định, không phải rút hex để ghép bản đồ. Công trình đã xây giữ nguyên vị trí nhưng có thể đổi chủ. Thu nhập phải theo bảng và cách phân chia công trình hợp lệ, không tự dùng hàm tăng theo cấp số nhân.

Tạo docs/rules-spec.md, ghi nguồn/trang và trạng thái VERIFIED / UNRESOLVED cho từng nhóm:

1. Thành phần, số lượng và thiết lập đầu ván.
2. Phân phối tài nguyên theo số người và vòng.
3. Chọn, loại, trả lại và loại khỏi bộ thẻ; thời điểm xáo.
4. Hình học bàn, quan hệ kề nhau, vùng ngăn cách và đánh số vị trí.
5. Quyền sở hữu, giới hạn vật phẩm đánh dấu, cách xử lý thiếu vật phẩm.
6. Tài sản nào được trao đổi, giao dịch thực hiện ngay và lời hứa tương lai.
7. Điều kiện xây, giữ lại tài nguyên, chuyển quyền công trình đã xây.
8. Cách chia nhóm, giới hạn kích thước, bảng thu nhập và ví dụ tính.
9. Điều kiện chuyển pha, kết thúc ván và xử lý hòa.
10. Thông tin công khai/bí mật ở từng thời điểm.

Không điền đại những bảng còn thiếu. Dữ liệu giả lập chỉ ở test/dev fixture, có nhãn rõ, không được chọn ở chế độ tiêu chuẩn. Chỉ công bố chế độ bám luật gốc khi toàn bộ dữ liệu ảnh hưởng kết quả đã kiểm chứng.

Tạo riêng docs/digital-adaptations.md: mọi thay đổi do màn hình chung, thời gian, xác nhận, hoàn tác hoặc chế độ quán phải được nêu rõ. Mỗi mục ghi lý do, tác động đến chiến thuật và cách hiển thị cho người chơi.

## 4. UX cho màn hình nằm ngang

### 4.1 Bố cục

- Bàn chơi cố định ở giữa; khay người chơi ở cạnh gần ghế, xoay chữ và nút hướng về người đó.
- Layout 3 người, 4 người và 5 người phải được thiết kế riêng. Với 5 người, cho hai ghế chia một cạnh dài; mỗi ghế có vùng thao tác độc lập.
- Ghế là cấu hình vị trí, không gắn cứng với thứ tự playerId. Có màn hình chọn ghế và thử chiều xoay trước khi bắt đầu.
- Bàn trung tâm không xoay toàn cục khi một người thao tác. Số ô/biểu tượng ở giữa cần đọc được từ nhiều phía hoặc có thẻ chi tiết xoay theo người đang xem.
- Cho người chơi chọn ô bằng ID hoặc bản xem thu nhỏ trong khay của mình để hạn chế phải với tay qua bàn. Hai cách phải trỏ đến cùng cellId.
- Không yêu cầu hover, chuột phải, bàn phím vật lý hoặc thao tác hai ngón để hoàn thành hành động cốt lõi.
- Nút cảm ứng khởi điểm ít nhất 56 CSS px, có khoảng cách; phải hiệu chỉnh theo kích thước vật lý, tỷ lệ hiển thị và khả năng với tay trên bàn thật.
- Phân biệt người chơi bằng màu + biểu tượng + tên. Attraction có icon/hình khác nhau, không chỉ khác màu.

### 4.2 Thông tin bí mật

Một màn hình chung không thể bảo đảm bí mật chỉ bằng cách xoay khay hoặc che bằng CSS. Phải nói rõ hạn chế này trong UX và tài liệu.

Đề xuất mặc định MVP: dùng màn che và bước xem riêng lần lượt khi cần chọn bí mật; người khác quay đi, người đang xem tự che khu vực màn hình. Nhấn giữ để xem tiền riêng, thả ra là che; mất focus/pause/reload tự che lại. Đây là cơ chế xã hội giảm lộ thông tin, không phải bảo mật kỹ thuật.

Không làm chậm pha thương lượng bằng cơ chế xem riêng này. Phân biệt rõ dữ liệu khay nào công khai, dữ liệu nào cần che theo rules-spec. Không làm lộ dữ liệu đang che qua notification, lịch sử, tooltip, accessibility label hoặc lỗi UI.

Cho phép một preset “Chơi mở tại quán” nếu cần, trong đó thông tin vốn bí mật được công khai. Ghi rõ đây là biến thể; không bật âm thầm. Phương án điện thoại cá nhân/QR cho dữ liệu riêng để roadmap, chưa xây trong MVP.

### 4.3 Các màn hình cần có

1. Trang chọn game tối giản, hiện duy nhất game đã chơi được.
2. Tạo ván: số người, tên/nghệ danh, màu/biểu tượng, ghế, preset luật.
3. Hướng dẫn tương tác ngắn, có ván mẫu thao tác được.
4. Chuẩn bị: phân phối, chọn riêng khi cần, xác nhận, công bố đúng thời điểm.
5. Thương lượng: bàn chung, khay tài sản, tạo/xem/xác nhận giao dịch.
6. Xây dựng: chọn công trình → chọn ô hợp lệ → xem trước → xác nhận.
7. Thu nhập: highlight nhóm được tính, công thức tra bảng, tổng từng người.
8. Kết quả: thứ hạng, xử lý hòa, chơi lại hoặc về trang chọn game.
9. Pause/khôi phục/hỗ trợ nhân viên, truy cập được từ các cạnh.

Minh họa wireframe cho 3/4/5 người trước khi hoàn thiện đồ họa. Giữ thao tác quan trọng gần người chơi, tránh modal toàn màn hình trong khi người khác đang thương lượng.

## 5. Mô hình giao dịch

Thương lượng diễn ra trực tiếp bằng lời nói. UI chỉ ghi nhận và thực thi deal đã chốt; không cần chat hay hệ thống đấu giá.

- Hỗ trợ deal hai bên với nhiều tài sản và tiền theo hai chiều. Có thể tặng tài sản hoặc trả tiền không kèm tài sản nếu luật cho phép.
- Mỗi tài sản phải có ID ổn định. Phân biệt tài nguyên chưa xây với ô/công trình trên bàn.
- Với công trình đã xây, thay chủ đúng dữ liệu sở hữu; không biến giao dịch thành thao tác di chuyển công trình.
- Thỏa thuận nhiều bên: engine thiết kế participants/transfers tổng quát. MVP có thể ưu tiên UI hai bên; nếu chưa có UI nhiều bên, ghi đây là giới hạn của bản số hóa, không tự gọi là hỗ trợ trao đổi đầy đủ. Không tự chia một deal nhiều bên thành các bước có thể hoàn thành dở dang.
- Hai bên xem bản tóm tắt cùng một revision và xác nhận tại vùng ghế của mình. Sửa đề nghị sẽ xóa toàn bộ xác nhận cũ.
- Xác nhận tại ghế là bằng chứng đồng thuận trong trải nghiệm tại bàn, không phải xác thực danh tính; màn hình không biết chắc ai đang chạm.
- Chỉ engine được commit. Kiểm tra lại pha, chủ sở hữu, số dư, revision, trạng thái và tài sản trước khi áp dụng.
- Commit tất cả chuyển giao trong một transaction. Hoặc thực hiện toàn bộ, hoặc không thay đổi gì.
- Draft không khóa tài sản vô thời hạn. Nếu hai deal dùng cùng tài sản, deal commit trước thắng; deal còn lại mất hiệu lực và hiển thị lý do.
- Double tap/retry cùng commandId không tạo giao dịch thứ hai.
- Thay đổi dữ liệu liên quan làm mất xác nhận cũ. Không để đề nghị lỗi thời được người cuối bấm chấp thuận.
- Lời hứa tương lai không được engine tự thu tiền hoặc ép thực hiện. Nếu có ghi chú, ghi rõ không ràng buộc.
- Lịch sử đủ để giải thích biến động tài sản; không tự công khai thông tin vốn cần che.

## 6. Cảm ứng đồng thời và chuyển pha

- Dùng Pointer Events với pointerId và pointer capture phù hợp. Mỗi drag là một session riêng; không dùng một biến global “selectedTile” cho mọi người.
- Map tọa độ từ khay xoay về không gian bàn đúng cách. Có test cho 0/90/180/270 độ.
- Cung cấp tap-to-select → tap-to-place bên cạnh drag-and-drop.
- Pointer cancel, mất focus, chạm bị gián đoạn: hủy preview, giải phóng capture/lock, không tự commit.
- Một thao tác phải xác định player context trước khi chạm bàn chung; không đoán chủ hành động từ vị trí chạm giữa bàn.
- Các command vẫn đi qua hàng đợi tuần tự trên một game state có thẩm quyền. Đồng thời ở UI không có nghĩa là ghi state không kiểm soát.
- Dùng ready theo người. Ready xong khóa hành động của người đó; cho bỏ ready khi pha chưa đổi. Nếu nhận deal cần hành động, yêu cầu bỏ ready trước.
- Khi tất cả ready: kiểm tra không còn hành động đang commit, hủy/cảnh báo proposal chưa xong theo policy, lưu trạng thái rồi chuyển pha đúng một lần.
- Timer mặc định chỉ nhắc, không tự xử thua, tự đồng ý giao dịch hoặc chuyển pha.

## 7. Engine và tính thu nhập

Logic luật phải chạy được độc lập với UI. Không chứa logic quyết định game trong component hoặc animation.

Các API gợi ý, có thể cải tiến sau khi khảo sát repo:

```ts
createGame(config, seed): GameState
validateCommand(state, command): ValidationResult
applyCommand(state, command): TransitionResult
getLegalActions(state, playerId): LegalAction[]
computeIncome(state): IncomeBreakdown
getPublicView(state): PublicGameView
getPlayerView(state, playerId, visibility): PlayerGameView
```

- State machine theo pha; chỉ cho command hợp lệ ở pha tương ứng.
- Cấu hình luật bất biến trong ván, có rulesetId/rulesetVersion. Bảng chia và bảng thu nhập là dữ liệu có nguồn, không rải số trong UI.
- Topology bàn là graph cellId → neighbors. Không suy ra ô kề từ khoảng cách pixel của hình minh họa.
- Lưu snapshot topology/config version trong save để cập nhật asset không đổi luật ván đang chơi.
- Thu nhập phải xuất breakdown giải thích được đến từng nhóm và ô thành viên.
- Không mặc định một connected component bằng đúng một công trình tính tiền. Viết đặc tả cách phân chia hợp lệ và tối ưu theo luật đã kiểm chứng.
- Không mặc định lấy size chia maxSize rồi tính phần dư: phải kiểm chứng ràng buộc hình học/liên thông của từng phần. Nếu rulebook chưa đủ rõ, ghi vấn đề và xác minh trước khi chốt thuật toán.
- Với board nhỏ, xem xét liệt kê nhóm liên thông hợp lệ rồi tìm phân hoạch cho thu nhập lớn nhất, có memoization; lựa chọn thuật toán dựa trên kích thước thật, có đo thời gian.
- Bộ giải tối ưu phải khớp exhaustive oracle ở các board nhỏ; không dùng thuật toán tham lam chưa chứng minh đúng.
- Số tiền dùng integer. Ngân hàng và chuyển tiền giữa người chơi có ledger phân biệt; không có số dư âm ngoài luật.
- Mỗi lần thanh toán thu nhập gắn roundId/paymentId và chỉ áp dụng một lần, kể cả reload đúng lúc animation trả tiền.
- PRNG có seed, lưu cả trạng thái cần thiết cho replay; reload không rút lại tài nguyên khác.

## 8. Kiến trúc đề xuất

Ưu tiên repo hiện có; đọc README/AGENTS và kiểm tra stack trước. Với repo trống, mặc định đề xuất TypeScript + React + Vite, board SVG/HTML, IndexedDB để lưu tại máy, Vitest cho engine và Playwright cho luồng UI. Xác minh tài liệu chính thức tương ứng phiên bản trước khi dùng API; không nâng cấp hàng loạt dependency không liên quan.

Đây là hướng triển khai đề xuất, không bắt buộc framework nếu có lựa chọn đơn giản hơn phù hợp repo. Chưa cần WebSocket, account, cloud database, backend microservice hoặc 3D engine cho một bàn một máy.

Tách tối thiểu:

```text
src/
  app/                     # game launcher, setup, route, session
  table/                   # seats, orientation, pointer sessions, overlays
  games/waterfall-park/
    engine/                # state, commands, validation, scoring
    rules/                 # verified config, board topology, sources
    ui/                    # board, trays, trade, income, result
  persistence/             # snapshots, log, migration, recovery
  shared/                  # UI primitives, audio, localization
tests/
  engine/
  integration/
  e2e/
docs/
```

Game registry chỉ cần interface nhỏ cho metadata/setup/render/lifecycle/save version. Không xây generic game engine hoặc plugin marketplace trước khi game đầu tiên hoàn thành. Waterfall-specific state không rò vào launcher.

## 9. Lưu ván, offline và vận hành tại quán

- Autosave mọi command đã commit. Lưu snapshot và log theo transaction IndexedDB hoặc cơ chế tương đương để không có state nửa vời.
- Chỉ hiển thị thành công sau khi đã xác nhận ghi bền vững. Khi storage lỗi/quota đầy, dừng mutation có rủi ro, giữ state trong bộ nhớ, hướng dẫn xuất cứu hộ; không báo “đã lưu” giả.
- Save có schemaVersion, rulesetVersion, gameId, revision, seed/PRNG state, round, phase, players, assets, pending proposals và payment markers.
- Reload: khôi phục ván; preview/capture đang kéo bị hủy; đề nghị chờ phải được kiểm tra lại và cần xác nhận lại; thông tin riêng mặc định che.
- Giữ bản save tốt gần nhất, kiểm tra schema/invariants khi load, không âm thầm ghi đè save lỗi bằng ván mới.
- Phát hiện nhiều tab cùng mở game để chỉ một tab ghi state; tab còn lại bị chặn thao tác hoặc chỉ xem.
- Có export/import save JSON cho hỗ trợ, validate chặt và xác nhận trước khi thay ván hiện tại. Export là dữ liệu quản trị, có thể chứa thông tin riêng.
- Chọn một phương án offline cụ thể: local server trên mini PC với asset bundle tại chỗ hoặc PWA precache đầy đủ. Phải kiểm thử khởi động lại khi mất Internet sau cài đặt.
- Không tải font/icon/audio bắt buộc từ CDN trong ván. Không áp bản cập nhật giữa ván.
- Fullscreen/kiosk ghi rõ phần nào ứng dụng làm được và phần nào cần cấu hình hệ điều hành/browser. Không mô tả fullscreen là kiosk an toàn.
- Pause che thông tin riêng và dừng timer. Quay lại có đếm ngược nhẹ nếu cần.
- Về trang chủ/xóa ván/tạo ván mới cần xác nhận. Thao tác quản trị đặt trong vùng nhân viên, có PIN tùy chọn; không coi PIN cục bộ là biện pháp bảo mật mạnh.
- Âm thanh ngắn, âm lượng thấp, có mute. Không thu thập thông tin cá nhân ngoài tên chơi tùy chọn.
- Undo chỉ hủy preview hoặc bước chưa commit. Không có undo tùy ý sau rút tài nguyên, chuyển tiền hoặc lộ thông tin. Khôi phục checkpoint của nhân viên phải có xác nhận và cảnh báo tác động.

## 10. Phạm vi MVP và roadmap

### MVP bắt buộc

- Chế độ 3–5 người, chơi trọn ván, tính kết quả đúng.
- Bàn + khay theo vị trí ghế, cảm ứng nhiều người, fallback chuột/tap.
- Chuẩn bị, thương lượng, xây dựng, thu nhập, kết quả.
- Giao dịch có xác nhận và chống trùng/xung đột.
- Tutorial ngắn, giải thích hành động không hợp lệ.
- Lưu/khôi phục, chạy offline theo phương án đã chọn.
- Test engine, tính thu nhập, giao dịch, reload và một luồng trọn ván.

### Để sau

- Chế độ 2 người: thiết kế một ruleset có bảng cấu hình riêng, đánh giá tác động đến động lực thương lượng; không chỉ giảm playerCount.
- Điện thoại để giữ thông tin riêng, online multiplayer, AI/bot.
- Tài khoản, thanh toán, loyalty, dashboard nhiều quán.
- 3D, animation phức tạp, nội dung nhiều game.

Nếu một luật gốc chưa được UI hỗ trợ, ghi trong gap list. Không đưa vào “done” hoặc tự thay bằng luật khác.

## 11. Milestones và đầu ra

### Milestone 0 — Khảo sát và kế hoạch, là yêu cầu của lượt đầu

Đọc repo và nguồn luật. Chưa xây toàn bộ game. Tạo:

1. docs/product-brief.md: mục tiêu, phạm vi, giả định phần cứng, trải nghiệm tại bàn.
2. docs/rules-spec.md: luật/dữ liệu đã xác minh, nguồn, điểm còn thiếu.
3. docs/digital-adaptations.md: khác biệt của bản số hóa.
4. docs/architecture.md: module, game state, command flow, persistence.
5. docs/implementation-plan.md: backlog theo milestone, dependency, tiêu chí nghiệm thu, thứ tự triển khai.
6. docs/tabletop-ux.md: wireframe 3/4/5 ghế, private-view, deal và building flow.

Trong kế hoạch, tách blocking issue của engine với thông tin có thể mặc định. Nêu tối đa 5 câu hỏi thực sự ảnh hưởng thiết kế; không hỏi lại những quyết định đã được cung cấp. Nếu thiếu thông số màn hình, dùng giả định rõ ràng và vẫn hoàn tất kế hoạch.

Mỗi backlog item có: ID, kết quả mong muốn, module, phụ thuộc, acceptance criteria, cách kiểm chứng, mức rủi ro. Không cần hứa ngày hoàn thành khi chưa biết repo và phần cứng.

### Milestone 1 — Engine chơi được

Hoàn tất dữ liệu luật đã xác minh, state machine, command validation, giao dịch, xây dựng, tính thu nhập và kết quả. Có test và một script chạy ván deterministic không UI. Gate: không còn blocker về luật trong đường chơi chính; invariant và oracle scoring pass.

### Milestone 2 — Vertical slice tại bàn

UI 3 người chơi được một vòng đầy đủ, từ nhận tài nguyên đến nhận tiền. Khay xoay, chọn ô, giao dịch, preview xây dựng và ready hoạt động. Gate: thao tác cốt lõi không cần dev console hoặc sửa state thủ công.

### Milestone 3 — MVP trọn ván

Mở rộng 3/4/5 người, tutorial, mọi vòng, endgame, autosave/recovery, offline, multiple-tab protection. Gate: hoàn tất checklist nghiệm thu phần 12 trên browser mục tiêu.

### Milestone 4 — Pilot quán cà phê

Hiệu chỉnh hit area, chiều xoay, độ sáng, tầm với, pointer concurrency và hiệu năng trên phần cứng thật. Ghi quan sát nhóm chơi và sửa các bước gây gián đoạn. Phân biệt kiểm chứng bằng automation với kiểm chứng thực tế.

Chỉ chuyển sang milestone kế tiếp khi được giao triển khai tiếp hoặc đã được giao toàn bộ phạm vi. Trong phạm vi đã giao, tự xử lý việc thường lệ, không dừng hỏi ở từng file.

## 12. Tiêu chí nghiệm thu và test quan trọng

| Nhóm | Tình huống bắt buộc |
|---|---|
| Luật | Seed cố định cho kết quả lặp lại; tài nguyên hợp lệ qua từng vòng/số người; reject command sai pha |
| Sở hữu | Không xây trên ô sai chủ/đã có công trình; đổi chủ không đổi vị trí; invariant tài sản duy nhất |
| Giao dịch | Cash+asset hai chiều; thiếu tiền; đổi revision; double tap; hai deal dùng chung tài sản; commit nguyên tử |
| Scoring | Nhóm tách rời; khác chủ; hình phân nhánh; nhiều cách phân chia; chuyển chủ; kết quả khớp oracle board nhỏ |
| Thu nhập | Cùng paymentId chạy hai lần chỉ trả một lần; reload trong lúc trả tiền không trả thêm |
| Chuyển pha | Ready/unready, deal còn pending, pointer đang kéo; không chuyển pha hai lần |
| Cảm ứng | Hai người thao tác độc lập; hai pointer cùng tài sản; pointercancel; tọa độ sau xoay khay |
| Khôi phục | Reload sau giao dịch/xây dựng; save lỗi; storage đầy; tab thứ hai; migration có dữ liệu mẫu |
| Offline | Mất Internet, reload, mở lại app theo phương án đóng gói; không thiếu asset |
| Toàn ván | 3/4/5 người đến màn hình kết quả; hòa; chơi lại không mang state ván cũ |
| Riêng tư | Che mặc định sau pause/reload; log/notification không lộ dữ liệu đang che |

Ngưỡng hiệu năng đề xuất để đo trên máy pilot, chưa phải số liệu đã đạt:

- Phản hồi chọn/chạm p95 dưới 100 ms.
- Mục tiêu animation 60 fps trên máy đích; ưu tiên thao tác đúng và rõ khi cần giảm hiệu ứng.
- Tính thu nhập trên fixture lớn nhất không làm đông UI; nếu tác vụ dài, chạy worker và hiển thị tiến trình. Báo cả thời gian thực đo.
- Ván mẫu 45–60 phút và ít nhất một buổi chơi thực tế; không memory leak tăng dần rõ rệt, không mất state.
- 3/4/5 người đọc được thông tin và hoàn thành thao tác từ vị trí ngồi; đánh giá riêng khả năng với tới giữa bàn.

Pointer mô phỏng không chứng minh phần cứng hỗ trợ đủ touch point hoặc palm rejection. Báo đúng những gì chưa thử trên thiết bị thật.

## 13. Chất lượng hình ảnh và tài sản

Phong cách công viên giải trí tươi sáng, hình lớn, chữ ít, ưu tiên khả năng đọc. Animation xây dựng và nhận tiền ngắn, không cản người khác thao tác. Tránh panel dày đặc giống phần mềm quản trị.

Dùng tên nội bộ cho prototype; tách branding/art/audio khỏi engine. Lập assets/ATTRIBUTION.md cho nguồn và giấy phép tài sản. Trước pilot thương mại, xác nhận phạm vi sử dụng tên và tài sản với chủ sản phẩm; không tự lấy artwork thương mại hoặc tự tuyên bố đã có quyền. Việc này không ngăn xây prototype bằng asset tự tạo.

## 14. Cách làm việc và báo cáo

- Khảo sát trước khi thay stack; không ghi đè thay đổi không liên quan của tôi.
- Không dừng ở mô tả nếu đã được giao implementation; làm phần được giao đến mức chạy và kiểm chứng được.
- Không mock logic luật trong bản được báo hoàn thành.
- Không báo test pass nếu chưa chạy. Nếu môi trường thiếu công cụ, nêu lệnh đã thử và giới hạn chính xác.
- Không tự deploy hoặc cấu hình máy quán khi tôi chỉ giao viết code.
- README có cách cài, chạy, test, build, chạy offline, khôi phục save và giới hạn hiện tại.
- Kết thúc mỗi milestone: báo kết quả, file chính, cách chạy/demo, kiểm chứng đã thực hiện, rủi ro còn lại và bước tiếp theo.

**Bây giờ hãy thực hiện Milestone 0.** Trả lời bằng tiếng Việt, có quyết định kỹ thuật rõ ràng, wireframe đủ để review, backlog triển khai và các điểm cần xác minh. Chưa triển khai toàn bộ game trong lượt này.

# Kết thúc prompt

---

## Các câu lệnh tiếp nối cho chủ sản phẩm

Sau khi review kế hoạch:

```text
Tôi chốt kế hoạch với các điều chỉnh: [ghi điều chỉnh hoặc “không có”].
Hãy triển khai Milestone 1 theo tài liệu đã lập. Hoàn thiện engine và test,
chạy ván deterministic, báo kết quả và vấn đề còn thiếu trước khi làm UI.
```

Khi engine đã đạt:

```text
Hãy triển khai Milestone 2. Ưu tiên vertical slice 3 người trên màn hình
nằm ngang, chơi được một vòng đầy đủ. Kiểm tra khay xoay, giao dịch,
tọa độ cảm ứng và tính thu nhập. Demo bằng dữ liệu luật đã xác minh.
```

Khi vertical slice đã được kiểm tra:

```text
Hãy triển khai Milestone 3 và chuẩn bị bộ kiểm thử Milestone 4.
Hoàn thiện 3–5 người, toàn bộ ván, lưu/khôi phục và offline.
Tách rõ kiểm chứng tự động đã chạy và những mục cần thử trên bàn thật.
```
