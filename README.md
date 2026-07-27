# Memento Notes

一个基于 React、TypeScript 与 Vite 的 GitHub 笔记浏览器。它从指定 GitHub 组织读取公开仓库和 Markdown 文件，并在浏览器中呈现笔记内容。

## 功能特性

- 浏览 GitHub 组织下的公开仓库及 Markdown 文件
- 支持 GFM、代码高亮、KaTeX 数学公式与 Mermaid 图表
- Mermaid 按需动态加载，减少初始资源体积
- 支持 GitHub Pages 子路径部署与 SPA 路由刷新回退

## 技术栈

- React 19、TypeScript、Vite 8
- React Router、React Markdown
- highlight.js、KaTeX、Mermaid
- React Compiler 已启用

## 本地开发

环境要求：Node.js 22.18.0（与 CI 保持一致）、pnpm 10。

```bash
pnpm install
pnpm dev
```

开发服务器监听 `0.0.0.0:8899`。

## 配置

### GitHub 组织

在 `src/config/github.config.ts` 中修改 `owner`：

```ts
export const githubOrgConfig = { owner: "VoidZero-Notes" } as const;
```

仅能读取公开仓库与公开文件；访问私有内容需要另行实现 GitHub 认证。

### GitHub Pages 路径

生产环境的 Vite `base` 配置位于 `vite.config.ts`，当前为：

```ts
base: mode === "production" ? "/memento-notes/" : "/",
```

若 GitHub Pages 仓库名变更，请同步修改该路径为 `/<仓库名>/`。生产构建会额外复制 `index.html` 为 `404.html`，用于处理 SPA 子路径刷新。

## 构建与预览

```bash
pnpm build
pnpm preview
pnpm lint
```

`pnpm build` 会先执行 TypeScript 构建检查，再生成 Vite 产物到 `dist`。

## 部署

项目已包含 GitHub Actions 工作流：

- `.github/workflows/ci.yml`：在所有分支推送和 Pull Request 时安装依赖并执行构建。
- `.github/workflows/pages.yml`：在 `main` 或 `master` 分支推送时构建 `dist` 并部署到 GitHub Pages，也支持手动触发。

在仓库 Settings → Pages 中将部署源设为 **GitHub Actions**。推送到 `main` 或 `master` 后，Pages 工作流会自动发布。
