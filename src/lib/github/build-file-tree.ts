import type { GithubFileTreeNode, GithubTreeItem } from "./github.types";

const compareNodes = (a: GithubFileTreeNode, b: GithubFileTreeNode): number => {
  if (a.type !== b.type) {
    return a.type === "tree" ? -1 : 1;
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
};

const sortTree = (nodes: GithubFileTreeNode[]): GithubFileTreeNode[] => {
  const sorted = [...nodes].sort(compareNodes);
  return sorted.map((node) =>
    node.children ? { ...node, children: sortTree(node.children) } : node,
  );
};

/** 将 GitHub Trees API 的扁平列表转为排序后的递归树（目录优先、同级按名称）。 */
export const buildFileTree = (items: GithubTreeItem[]): GithubFileTreeNode[] => {
  const root: GithubFileTreeNode[] = [];
  const dirMap = new Map<string, GithubFileTreeNode>();

  const ensureDir = (path: string, name: string, sha: string): GithubFileTreeNode => {
    const existing = dirMap.get(path);
    if (existing) {
      if (!existing.sha) existing.sha = sha;
      return existing;
    }

    const node: GithubFileTreeNode = { name, path, type: "tree", sha, children: [] };
    dirMap.set(path, node);

    const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    if (!parentPath) {
      root.push(node);
    } else {
      const parentName = parentPath.includes("/")
        ? parentPath.slice(parentPath.lastIndexOf("/") + 1)
        : parentPath;
      const parent = ensureDir(parentPath, parentName, "");
      parent.children ??= [];
      parent.children.push(node);
    }
    return node;
  };

  for (const item of items) {
    const segments = item.path.split("/");
    const name = segments[segments.length - 1] ?? item.name;

    if (item.type === "tree") {
      ensureDir(item.path, name, item.sha);
      continue;
    }

    const parentPath = segments.length > 1 ? segments.slice(0, -1).join("/") : "";
    const blobNode: GithubFileTreeNode = {
      name,
      path: item.path,
      type: "blob",
      sha: item.sha,
    };

    if (!parentPath) {
      root.push(blobNode);
    } else {
      const parentName = parentPath.includes("/")
        ? parentPath.slice(parentPath.lastIndexOf("/") + 1)
        : parentPath;
      const parent = ensureDir(parentPath, parentName, "");
      parent.children ??= [];
      parent.children.push(blobNode);
    }
  }

  return sortTree(root);
};
