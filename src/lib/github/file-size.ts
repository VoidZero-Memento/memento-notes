import type { GithubFileTreeNode } from "./github.types";

const UNITS = ["B", "KB", "MB", "GB"] as const;

/** GitHub Trees API 的 size 是字节。小于 10 的单位保留一位小数。 */
export const formatByteSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${Math.round(bytes)} B`;

  let value = bytes / 1024;
  let unit = 1;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const digits = value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unit]}`;
};

export const findBlobSize = (nodes: GithubFileTreeNode[], path: string): number | null => {
  for (const node of nodes) {
    if (node.path === path) {
      return node.type === "blob" && typeof node.size === "number" ? node.size : null;
    }
    if (!node.children) continue;
    const found = findBlobSize(node.children, path);
    if (found != null) return found;
  }
  return null;
};
