# Asset Attribution

Ghi nguồn và giấy phép cho mọi hình ảnh, font, icon, âm thanh đưa vào repo.

| File | Tác giả / nguồn | Giấy phép | Ghi chú |
|---|---|---|---|
| `src/games/thac-cong-vien/ui/art.ts` (9 tranh minh hoạ trò chơi) | Tự vẽ cho dự án (Claude Code) | Thuộc dự án | SVG màu, không dựa trên artwork thương mại |
| `assets/icons/*.svg` (bộ icon nét cũ, giữ để tham khảo) | Tự vẽ cho dự án (Claude Code) | Thuộc dự án | Không còn dùng trong game |
| Font Baloo 2 (`@fontsource/baloo-2`) | Ek Type | SIL Open Font License 1.1 | Đóng gói trong bundle để chạy offline |
| Font Be Vietnam Pro (`@fontsource/be-vietnam-pro`) | Lâm Bảo, Tony Le, ViệtAnh Nguyễn | SIL Open Font License 1.1 | Đóng gói trong bundle để chạy offline |

Quy tắc:
- Prototype chỉ dùng asset tự tạo hoặc có giấy phép cho phép dùng thương mại/sửa đổi.
- **Không** dùng artwork, logo, hình bàn chơi hay rulebook của Waterfall Park (Repos Production / Asmodee) trong bundle.
- UI dùng tên nội bộ “Thác Công viên” (quyết định D5, docs/implementation-plan.md §5). Không hiển thị tên “Waterfall Park” trong sản phẩm.
