import { Children, cloneElement, isValidElement, useState } from "react";

import { toast } from "@/lib/toast/toast";

import styles from "./CodeBlock.module.css";

import type { KeyboardEvent, MouseEvent, ReactElement, ReactNode } from "react";

type CodeBlockProps = {
  children: ReactNode;
  className?: string;
  language?: string | null;
};

const extractText = (node: unknown): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement<{ children?: unknown }>(node))
    return extractText(node.props.children);
  return "";
};

const trimTrailingNewline = (node: ReactNode): ReactNode => {
  if (typeof node === "string") return node.replace(/\n$/, "");
  if (!Array.isArray(node)) return node;

  const next = [...node];
  for (let i = next.length - 1; i >= 0; i -= 1) {
    const item = next[i];
    if (typeof item === "string") {
      next[i] = item.replace(/\n$/, "");
      break;
    }
    if (item != null && item !== false) break;
  }
  return next;
};

const normalizeCodeChildren = (children: ReactNode): ReactNode =>
  Children.map(children, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    return cloneElement(child as ReactElement<{ children?: ReactNode }>, {
      children: trimTrailingNewline(child.props.children),
    });
  });

export const CodeBlock = ({ children, className, language }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const content = normalizeCodeChildren(children);
  const langLabel = language?.trim() || null;

  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  const handleCopy = async () => {
    const text = extractText(content);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("已复制到剪贴板");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      toast.error("复制失败，请检查浏览器权限");
    }
  };

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleCollapsed();
  };

  const stopToggle = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handleCopyClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void handleCopy();
  };

  const handleCopyKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const preClassName = className ? `${styles.pre} ${className}` : styles.pre;
  const bodyClassName = collapsed ? `${styles.body} ${styles.bodyCollapsed}` : styles.body;

  return (
    <div className={styles.block} data-code-block>
      <div
        className={styles.header}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "展开代码" : "收起代码"}
        onClick={toggleCollapsed}
        onKeyDown={handleHeaderKeyDown}
      >
        <span className={styles.meta} onClick={stopToggle}>
          <span className={styles.dots} aria-hidden="true">
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
          </span>
          {langLabel ? <span className={styles.lang}>{langLabel}</span> : null}
        </span>
        <button
          type="button"
          className={styles.copyBtn}
          onClick={handleCopyClick}
          onKeyDown={handleCopyKeyDown}
        >
          {copied ? "已复制" : "复制代码"}
        </button>
      </div>
      <div className={bodyClassName} aria-hidden={collapsed}>
        <div className={styles.bodyInner}>
          <pre className={preClassName}>{content}</pre>
        </div>
      </div>
    </div>
  );
};
