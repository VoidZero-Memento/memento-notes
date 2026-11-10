export const githubOrgConfig = { owner: "VoidZero-Notes" } as const;

const OSS_HEAD_BASE = "https://memento-static.oss-cn-shenzhen.aliyuncs.com/notes/heads";

/** 仓库名（小写）→ 侧栏头像。未列出的仓库仍用 GitHub 头像。 */
export const repoAvatarUrls: Record<string, string> = {
  ai: `${OSS_HEAD_BASE}/ai-head.jpg`,
  ops: `${OSS_HEAD_BASE}/ops-head.jpg`,
  python: `${OSS_HEAD_BASE}/python-head.jpg`,
  web: `${OSS_HEAD_BASE}/web-head.jpg`,
};
