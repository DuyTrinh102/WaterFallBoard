import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// mode "single": một file HTML tự chứa (để chia sẻ link chơi thử / chạy offline từ 1 file).
export default defineConfig(({ mode }) => ({
  plugins: mode === "single" ? [react(), viteSingleFile()] : [react()],
  base: "./",
  build: { outDir: mode === "single" ? "dist-single" : "dist" },
  test: { include: ["tests/**/*.test.ts"] },
}));
