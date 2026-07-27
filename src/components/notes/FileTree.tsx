import { useState } from "react";

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
          <span className={`${styles.chevron}${isExpanded ? ` ${styles.chevronExpanded}` : ""}`}>▶</span>
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

export const FileTree = ({ nodes, selectedPath, onSelect }: FileTreeProps) => {
  const [expanded, setExpanded] = useState(() => new Set<string>());

  const handleToggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (nodes.length === 0) {
    return <p className={styles.name}>暂无文件</p>;
  }

  return (
    <ul className={styles.tree}>
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
  );
};
