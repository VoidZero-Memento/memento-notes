/**
 * 使用 cn-font-split 将霞鹜文楷整包拆成 unicode-range 分段字体。
 *
 * 源文件（不部署）：
 *   fonts-src/LXGWWenKai-Regular.woff2
 *   fonts-src/LXGWWenKaiMono-Regular.woff2
 *
 * 输出（部署）：
 *   public/fonts/lxgw/result.css + *.woff2
 *   public/fonts/lxgw-mono/result.css + *.woff2
 *
 * 用法：
 *   pnpm split-fonts
 *   node scripts/split-fonts.mjs
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const jobs = [
  {
    input: path.join(root, "fonts-src", "LXGWWenKai-Regular.woff2"),
    outDir: path.join(root, "public", "fonts", "lxgw"),
    fontFamily: "LXGWWenKai",
  },
  {
    input: path.join(root, "fonts-src", "LXGWWenKaiMono-Regular.woff2"),
    outDir: path.join(root, "public", "fonts", "lxgw-mono"),
    fontFamily: "LXGWWenKaiMono",
  },
];

const legacyPublic = [
  path.join(root, "public", "fonts", "LXGWWenKai-Regular.woff2"),
  path.join(root, "public", "fonts", "LXGWWenKaiMono-Regular.woff2"),
];

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const emptyDir = (dir) => {
  fs.rmSync(dir, { recursive: true, force: true });
  ensureDir(dir);
};

const migrateLegacySources = () => {
  const srcDir = path.join(root, "fonts-src");
  ensureDir(srcDir);
  for (const file of legacyPublic) {
    const name = path.basename(file);
    const dest = path.join(srcDir, name);
    if (fs.existsSync(file) && !fs.existsSync(dest)) {
      console.log(`migrate ${name} -> fonts-src/`);
      fs.renameSync(file, dest);
    }
  }
};

const removeLegacyPublic = () => {
  for (const file of legacyPublic) {
    if (fs.existsSync(file)) {
      console.log(`remove deployable whole-font: ${path.relative(root, file)}`);
      fs.unlinkSync(file);
    }
  }
};

const runSplit = ({ input, outDir, fontFamily }) => {
  if (!fs.existsSync(input)) {
    throw new Error(`缺少源字体: ${input}\n请放到 fonts-src/ 后重试`);
  }

  emptyDir(outDir);
  console.log(`\n>>> split ${path.basename(input)} -> ${path.relative(root, outDir)}`);

  const args = [
    "dlx",
    "cn-font-split",
    "run",
    "-i",
    input,
    "-o",
    outDir,
    "--css.fontFamily",
    fontFamily,
    "--css.fontWeight",
    "400",
    "--css.fontDisplay",
    "swap",
    "--css.fileName",
    "result.css",
    "--css.compress",
    "true",
    "--css.commentBase",
    "false",
    "--css.commentNameTable",
    "false",
    "--css.commentUnicodes",
    "false",
    "--testHtml",
    "false",
    "--reporter",
    "false",
  ];

  const result = spawnSync("pnpm", args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    throw new Error(`cn-font-split 失败: ${fontFamily} (exit ${result.status})`);
  }

  const cssPath = path.join(outDir, "result.css");
  if (!fs.existsSync(cssPath)) {
    throw new Error(`未生成 CSS: ${cssPath}`);
  }

  const css = fs.readFileSync(cssPath, "utf8");
  if (!css.includes(`font-family:"${fontFamily}"`) && !css.includes(`font-family: "${fontFamily}"`)) {
    throw new Error(`CSS 中未找到 font-family "${fontFamily}"`);
  }
  if (css.includes("url(/") || css.includes('url("/')) {
    throw new Error(`CSS 含绝对路径 url，应为相对路径 ./xxx.woff2`);
  }

  for (const name of ["index.proto", "index.html", "preview.svg", "preview.png"]) {
    const extra = path.join(outDir, name);
    if (fs.existsSync(extra)) fs.unlinkSync(extra);
  }

  const woff2 = fs.readdirSync(outDir).filter((f) => f.endsWith(".woff2"));
  const total = woff2.reduce((sum, f) => sum + fs.statSync(path.join(outDir, f)).size, 0);
  const max = Math.max(...woff2.map((f) => fs.statSync(path.join(outDir, f)).size));
  console.log(
    `    ${woff2.length} chunks, ${(total / 1024 / 1024).toFixed(2)} MB total, max ${(max / 1024).toFixed(1)} KB`,
  );
};

migrateLegacySources();

for (const job of jobs) {
  runSplit(job);
}

removeLegacyPublic();

console.log("\nDone. 确认 src/styles/fonts.css 与 index.html 已引用分段 CSS，且不再 preload 整包。");
