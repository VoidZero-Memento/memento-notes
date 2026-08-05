import fs from "node:fs";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import type { Plugin } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** GitHub Pages 刷新子路径时请求真实文件会 404；用与 index 相同的 SPA 入口承接 */
const githubPagesSpa404 = (): Plugin => ({
  name: "github-pages-spa-404",
  apply: "build",
  closeBundle() {
    const outDir = path.resolve(__dirname, "dist");
    const indexHtml = path.join(outDir, "index.html");
    const notFoundHtml = path.join(outDir, "404.html");
    if (fs.existsSync(indexHtml)) {
      fs.copyFileSync(indexHtml, notFoundHtml);
    }
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    ...(mode === "production" ? [githubPagesSpa404()] : []),
  ],
  /** GitHub Pages 项目页：username.github.io/repo-name/ */
  base: mode === "production" ? "/memento-notes/" : "/",
  /**
   * Vite 8 默认 cssMinify=lightningcss 会丢掉标准 backdrop-filter，
   * 只保留 -webkit-，导致 Chromium 生产构建磨砂失效。
   * @see https://github.com/vitejs/vite/issues/22649
   */
  build: {
    cssMinify: "esbuild",
  },
  server: {
    host: "0.0.0.0",
    port: 8899,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
