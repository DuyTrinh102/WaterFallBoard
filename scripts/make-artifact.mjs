// Chuyển một bản build 1 file thành nội dung trang artifact (không có <html>/<head>/<body>).
// node scripts/make-artifact.mjs [input] [output] [title]
import { readFileSync, writeFileSync } from "node:fs";
const [input = "dist-single/index.html", output = "dist-single/thac-cong-vien.html", title = "Thác Công viên"] = process.argv.slice(2);
const html = readFileSync(input, "utf8");
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]);
// Lấy nguyên khối từ <script đầu tiên đến </script> cuối cùng (bundle có thể chứa chuỗi "<script").
const scriptStart = html.indexOf("<script");
const scriptEnd = html.lastIndexOf("</script>") + "</script>".length;
const bodyStart = html.indexOf("<body>") + "<body>".length;
const bodyEnd = html.lastIndexOf("</body>");
// Phần thân không gồm script (ví dụ canvas, nút của demo); với bản game là <div id="root">.
let body = html.slice(bodyStart, bodyEnd);
if (scriptStart > bodyStart && scriptStart < bodyEnd) body = body.replace(html.slice(scriptStart, scriptEnd), "");
const out = [
  `<title>${title}</title>`,
  "<style>html,body{height:100%;margin:0;background:#08262c}</style>",
  ...styles,
  body.trim(),
  html.slice(scriptStart, scriptEnd),
].join("\n");
writeFileSync(output, out);
console.log(`${output} ${(out.length / 1024).toFixed(0)} KB`);
