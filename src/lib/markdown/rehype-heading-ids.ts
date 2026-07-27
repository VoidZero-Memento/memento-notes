import type { Element, Root, RootContent } from "hast";

const isHeading = (node: RootContent): node is Element =>
  node.type === "element" && /^h[1-6]$/.test(node.tagName);

const walk = (nodes: RootContent[], assign: (node: Element) => void) => {
  for (const node of nodes) {
    if (isHeading(node)) assign(node);
    if (node.type === "element" && node.children.length > 0) {
      walk(node.children as RootContent[], assign);
    }
  }
};

/** 按文档顺序为 h1–h6 写入预计算 id，避免在 React render 中生成 id（Strict Mode 会算乱） */
export const rehypeHeadingIds = (ids: string[]) => {
  return () => (tree: Root) => {
    let index = 0;

    walk(tree.children, (node) => {
      if (index >= ids.length) return;
      node.properties ??= {};
      node.properties.id = ids[index];
      index += 1;
    });
  };
};
