// Chuyển dist-single/index.html thành nội dung trang artifact (không có <html>/<head>/<body>).
import { readFileSync, writeFileSync } from "node:fs";
const html = readFileSync("dist-single/index.html", "utf8");
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]);
// Lấy nguyên khối từ <script đầu tiên đến </script> cuối cùng (bundle có thể chứa chuỗi "<script").
const scripts = [html.slice(html.indexOf("<script"), html.lastIndexOf("</script>") + "</script>".length)];
const out = [
  "<title>Thác Công viên</title>",
  "<style>html,body{height:100%;margin:0;background:#062a2b}</style>",
  ...styles,
  '<div id="root"></div>',
  ...scripts,
].join("\n");
writeFileSync("dist-single/thac-cong-vien.html", out);
console.log(`dist-single/thac-cong-vien.html ${(out.length / 1024).toFixed(0)} KB`);
