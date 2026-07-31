import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { isMarkdownPath } from "@/lib/github/repo-path";
import styles from "./FileTree.module.css";

import type { GithubFileTreeNode } from "@/lib/github/github.types";

type FileTreeProps = {
  nodes: GithubFileTreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
};

type TreeNodeProps = {
  node: GithubFileTreeNode;
  depth: number;
  selectedPath: string | null;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
};

type HighlightRect = {
  top: number;
  height: number;
  ready: boolean;
};

const FolderIcon = () => (
  <svg className={`${styles.icon} ${styles.iconFolder}`} viewBox="0 0 16 16" aria-hidden>
    <path
      fill="currentColor"
      d="M1.75 2.5a.75.75 0 0 0-.75.75v10c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75v-7.5a.75.75 0 0 0-.75-.75H8.31l-.9-1.2A.75.75 0 0 0 6.81 2.5H1.75Z"
    />
  </svg>
);

const FileIcon = () => (
  <svg className={`${styles.icon} ${styles.iconFile}`} viewBox="0 0 16 16" aria-hidden>
    <path
      fill="currentColor"
      d="M3.75 1.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75V6.31a.75.75 0 0 0-.22-.53L9.22 1.72a.75.75 0 0 0-.53-.22H3.75Zm5.47 1.56 2.72 2.72H9.22a.75.75 0 0 1-.75-.75V3.06Z"
    />
  </svg>
);

const ChevronIcon = () => (
  <svg className={styles.chevronIcon} viewBox="0 0 16 16" aria-hidden>
    <path fill="currentColor" d="M6.2 3.2a.75.75 0 0 1 1.06 0l4 4a.75.75 0 0 1 0 1.06l-4 4A.75.75 0 0 1 6.2 11.2L9.64 7.75 6.2 4.3a.75.75 0 0 1 0-1.1Z" />
  </svg>
);

const TreeNode = ({ node, depth, selectedPath, expanded, onToggle, onSelect }: TreeNodeProps) => {
  const isTree = node.type === "tree";
  const isExpanded = isTree && expanded.has(node.path);
  const isMarkdown = !isTree && isMarkdownPath(node.path);
  const isSelected = !isTree && selectedPath === node.path;
  const paddingLeft = 8 + depth * 14;
  const rowClassName = `${styles.row}${isSelected ? ` ${styles.rowSelected}` : ""}${
    !isTree && !isMarkdown ? ` ${styles.rowDisabled}` : ""
  }`;

  if (isTree) {
    return (
      <li className={styles.item}>
        <button
          type="button"
          className={rowClassName}
          style={{ paddingLeft }}
          onClick={() => onToggle(node.path)}
          title={node.path}
        >
          <span className={`${styles.chevron}${isExpanded ? ` ${styles.chevronExpanded}` : ""}`}>
            <ChevronIcon />
          </span>
          <FolderIcon />
          <span className={styles.name}>{node.name}</span>
        </button>
        {isExpanded && node.children && node.children.length > 0 ? (
          <ul className={styles.children}>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                expanded={expanded}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  if (isMarkdown) {
    return (
      <li className={styles.item}>
        <button
          type="button"
          className={rowClassName}
          style={{ paddingLeft }}
          data-tree-path={node.path}
          onClick={() => onSelect(node.path)}
          title={node.path}
        >
          <span className={styles.chevronSpacer} />
          <FileIcon />
          <span className={styles.name}>{node.name}</span>
        </button>
      </li>
    );
  }

  return (
    <li className={styles.item}>
      <span className={rowClassName} style={{ paddingLeft }} title="仅支持预览 Markdown 文件">
        <span className={styles.chevronSpacer} />
        <FileIcon />
        <span className={styles.name}>{node.name}</span>
      </span>
    </li>
  );
};

const measureHighlight = (tree: HTMLElement, selectedPath: string): HighlightRect | null => {
  const selected = tree.querySelector<HTMLElement>(`[data-tree-path="${CSS.escape(selectedPath)}"]`);
  if (!selected) return null;

  const wrap = tree.parentElement;
  if (!wrap) return null;

  const wrapRect = wrap.getBoundingClientRect();
  const rowRect = selected.getBoundingClientRect();

  return {
    top: rowRect.top - wrapRect.top + wrap.scrollTop,
    height: rowRect.height,
    ready: true,
  };
};

const enableAnimateAfterPaint = (enable: () => void) => {
  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(enable);
  });
  return () => {
    cancelAnimationFrame(outer);
    cancelAnimationFrame(inner);
  };
};

export const FileTree = ({ nodes, selectedPath, onSelect }: FileTreeProps) => {
  const [expanded, setExpanded] = useState(() => new Set<string>());
  const treeRef = useRef<HTMLUListElement>(null);
  const highlightReadyRef = useRef(false);
  const [highlight, setHighlight] = useState<HighlightRect>({ top: 0, height: 0, ready: false });
  const [animate, setAnimate] = useState(false);

  const handleToggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  useEffect(() => {
    if (!selectedPath) return;

    const segments = selectedPath.split("/");
    const ancestors: string[] = [];
    for (let i = 0; i < segments.length - 1; i += 1) {
      ancestors.push(segments.slice(0, i + 1).join("/"));
    }

    setExpanded((prev) => {
      const missing = ancestors.filter((path) => !prev.has(path));
      if (missing.length === 0) return prev;

      const next = new Set(prev);
      missing.forEach((path) => next.add(path));
      return next;
    });
  }, [selectedPath]);

  useLayoutEffect(() => {
    const tree = treeRef.current;
    if (!tree || !selectedPath) {
      highlightReadyRef.current = false;
      setAnimate(false);
      setHighlight((prev) => (prev.ready ? { ...prev, ready: false } : prev));
      return;
    }

    const next = measureHighlight(tree, selectedPath);
    if (!next) {
      setHighlight((prev) => (prev.ready ? { ...prev, ready: false } : prev));
      return;
    }

    const canAnimate = highlightReadyRef.current;
    highlightReadyRef.current = true;
    // 过渡类需在「已有旧位置」之后再挂上，避免首帧与位移同帧导致起步发涩
    setAnimate(canAnimate);
    setHighlight(next);

    let cancelEnable: (() => void) | undefined;
    if (!canAnimate) {
      cancelEnable = enableAnimateAfterPaint(() => setAnimate(true));
    }

    const observer = new ResizeObserver(() => {
      const updated = measureHighlight(tree, selectedPath);
      if (!updated) return;
      setAnimate(false);
      setHighlight(updated);
      cancelEnable?.();
      cancelEnable = enableAnimateAfterPaint(() => setAnimate(true));
    });
    observer.observe(tree);

    return () => {
      cancelEnable?.();
      observer.disconnect();
    };
  }, [selectedPath, expanded, nodes]);

  if (nodes.length === 0) {
    return <p className={styles.name}>暂无文件</p>;
  }

  const highlightClassName = `${styles.highlight}${highlight.ready ? ` ${styles.highlightVisible}` : ""}${
    animate ? ` ${styles.highlightAnimate}` : ""
  }`;

  return (
    <div className={styles.treeWrap}>
      <div
        className={highlightClassName}
        aria-hidden
        style={{
          transform: `translate3d(0, ${highlight.top}px, 0)`,
          height: highlight.height,
        }}
      />
      <ul className={styles.tree} ref={treeRef}>
        {nodes.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            expanded={expanded}
            onToggle={handleToggle}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
};
