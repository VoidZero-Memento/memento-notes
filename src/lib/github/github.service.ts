import { buildFileTree } from "./build-file-tree";

import type { GithubRepoConfig } from "@/config/github.types";
import type { GithubFileTreeNode, GithubNoteListItem, GithubTreeItem } from "./github.types";

type GithubApiTreeEntry = {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
};

type GithubApiTreeResponse = {
  sha?: string;
  url?: string;
  tree?: GithubApiTreeEntry[];
  truncated?: boolean;
  message?: string;
};

type GithubApiRepoOwner = {
  login?: string;
  avatar_url?: string;
};

type GithubApiRepo = {
  name?: string;
  default_branch?: string;
  archived?: boolean;
  disabled?: boolean;
  owner?: GithubApiRepoOwner;
};

type GithubApiRepoListResponse = GithubApiRepo[] | { message?: string };

const GITHUB_API_ACCEPT = "application/vnd.github+json";
const GITHUB_API_VERSION = "2022-11-28";

const githubApiHeaders = {
  Accept: GITHUB_API_ACCEPT,
  "X-GitHub-Api-Version": GITHUB_API_VERSION,
};

const buildRawContentUrl = (config: GithubRepoConfig, path: string): string => {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/refs/heads/${config.branch}/${encodedPath}`;
};

const buildTreeApiUrl = (config: GithubRepoConfig): string =>
  `https://api.github.com/repos/${config.owner}/${config.repo}/git/trees/${encodeURIComponent(config.branch)}?recursive=1`;

const toTreeItems = (entries: GithubApiTreeEntry[]): GithubTreeItem[] =>
  entries
    .filter(
      (entry): entry is GithubApiTreeEntry & { path: string; type: string; sha: string } =>
        Boolean(entry.path && entry.sha && (entry.type === "tree" || entry.type === "blob")),
    )
    .map((entry) => {
      const name = entry.path.includes("/")
        ? entry.path.slice(entry.path.lastIndexOf("/") + 1)
        : entry.path;
      return {
        path: entry.path,
        name,
        type: entry.type as "tree" | "blob",
        sha: entry.sha,
        ...(typeof entry.size === "number" ? { size: entry.size } : {}),
      };
    });

export const getRepoFileTree = async (config: GithubRepoConfig): Promise<GithubFileTreeNode[]> => {
  const url = buildTreeApiUrl(config);
  const res = await fetch(url, {
    headers: githubApiHeaders,
  });

  let body: GithubApiTreeResponse | null = null;
  try {
    body = (await res.json()) as GithubApiTreeResponse;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const detail = body?.message ? `: ${body.message}` : "";
    throw new Error(`获取仓库文件树失败 (${config.owner}/${config.repo}): ${res.status} ${res.statusText}${detail}`);
  }

  if (!body?.tree) {
    throw new Error(`获取仓库文件树失败 (${config.owner}/${config.repo}): 响应缺少 tree 字段`);
  }

  if (body.truncated) {
    throw new Error(`获取仓库文件树失败 (${config.owner}/${config.repo}): 文件树被截断，请缩小仓库规模或改用分页方案`);
  }

  return buildFileTree(toTreeItems(body.tree));
};

export const listOrgRepos = async (owner: string): Promise<GithubRepoConfig[]> => {
  const url = `https://api.github.com/orgs/${encodeURIComponent(owner)}/repos?per_page=100&type=public&sort=full_name`;
  const res = await fetch(url, { headers: githubApiHeaders });

  let body: GithubApiRepoListResponse | null = null;
  try {
    body = (await res.json()) as GithubApiRepoListResponse;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const detail = body && !Array.isArray(body) && body.message ? `: ${body.message}` : "";
    throw new Error(`获取组织仓库失败 (${owner}): ${res.status} ${res.statusText}${detail}`);
  }

  if (!Array.isArray(body)) {
    throw new Error(`获取组织仓库失败 (${owner}): 响应缺少仓库列表`);
  }

  return body
    .filter((repo): repo is GithubApiRepo & { name: string } => Boolean(repo.name) && !repo.archived && !repo.disabled)
    .map((repo) => ({
      id: repo.name.toLowerCase(),
      label: repo.name,
      owner: repo.owner?.login || owner,
      ...(repo.owner?.avatar_url ? { ownerAvatarUrl: repo.owner.avatar_url } : {}),
      repo: repo.name,
      branch: repo.default_branch || "main",
    }));
};

export const getNoteRawContent = async (config: GithubRepoConfig, path: string): Promise<string> => {
  const url = buildRawContentUrl(config, path);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`获取笔记内容失败 (${path}): ${res.status} ${res.statusText}`);
  }
  return res.text();
};

/** 从完整文件树中提取 .md blob，供原型页列表使用。 */
export const listNotes = async (config: GithubRepoConfig): Promise<GithubNoteListItem[]> => {
  const tree = await getRepoFileTree(config);
  const notes: GithubNoteListItem[] = [];

  const walk = (nodes: GithubFileTreeNode[]) => {
    for (const node of nodes) {
      if (node.type === "blob" && node.name.toLowerCase().endsWith(".md")) {
        notes.push({ path: node.path, name: node.name, sha: node.sha });
      }
      if (node.children) walk(node.children);
    }
  };

  walk(tree);
  return notes;
};
