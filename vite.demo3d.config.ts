import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Demo 2.5D: build riêng thành một file HTML tự chứa (dist-demo3d/index.html).
export default defineConfig({
  root: resolve(__dirname, "demo3d"),
  base: "./",
  publicDir: false,
  server: { fs: { allow: [resolve(__dirname)] } },
  plugins: [viteSingleFile()],
  build: { outDir: resolve(__dirname, "dist-demo3d"), emptyOutDir: true },
});
