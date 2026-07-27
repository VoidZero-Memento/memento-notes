import { createHeadingIdGenerator } from "./heading-id";

import type { OutlineItem, OutlineTreeNode } from "./outline.types";

const ATX_HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE_RE = /^(```+|~~~+)/;

/** 去掉常见行内 Markdown，使文本与 React 渲染后的纯文本一致 */
const stripInlineMarkdown = (text: string): string =>
  text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .trim();

/** 从 Markdown 解析 ATX 标题，跳过 fenced code block */
export const parseOutline = (markdown: string): OutlineItem[] => {
  const lines = markdown.split(/\r?\n/);
  const items: OutlineItem[] = [];
  const nextId = createHeadingIdGenerator();
  let inFence = false;
  let fenceChar: "`" | "~" | null = null;
  let fenceLen = 0;

  for (const line of lines) {
    const fenceMatch = FENCE_RE.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      const char = marker[0] as "`" | "~";
      const len = marker.length;

      if (!inFence) {
        inFence = true;
        fenceChar = char;
        fenceLen = len;
      } else if (char === fenceChar && len >= fenceLen && /^[`~]*\s*$/.test(line.slice(len))) {
        inFence = false;
        fenceChar = null;
        fenceLen = 0;
      }
      continue;
    }

    if (inFence) continue;

    const headingMatch = ATX_HEADING_RE.exec(line);
    if (!headingMatch) continue;

    const text = stripInlineMarkdown(headingMatch[2]);
    if (!text) continue;

    items.push({
      id: nextId(text),
      level: headingMatch[1].length,
      text,
    });
  }

  return items;
};

/** 将扁平大纲转为嵌套树（按 level 嵌套） */
export const buildOutlineTree = (items: OutlineItem[]): OutlineTreeNode[] => {
  const root: OutlineTreeNode[] = [];
  const stack: OutlineTreeNode[] = [];

  for (const item of items) {
    const node: OutlineTreeNode = { ...item, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) root.push(node);
    else stack[stack.length - 1].children.push(node);

    stack.push(node);
  }

  return root;
};
