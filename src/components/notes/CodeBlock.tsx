import { Children, cloneElement, isValidElement, useState } from "react";

import { toast } from "@/lib/toast/toast";

import styles from "./CodeBlock.module.css";

import type { ReactElement, ReactNode } from "react";

type CodeBlockProps = {
  children: ReactNode;
  className?: string;
};

const extractText = (node: unknown): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement<{ children?: unknown }>(node)) return extractText(node.props.children);
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

export const CodeBlock = ({ children, className }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const content = normalizeCodeChildren(children);

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

  const preClassName = className ? `${styles.pre} ${className}` : styles.pre;

  return (
    <div className={styles.block}>
      <div className={styles.header}>
        <div className={styles.dots} aria-hidden="true">
          <span className={`${styles.dot} ${styles.dotRed}`} />
          <span className={`${styles.dot} ${styles.dotYellow}`} />
          <span className={`${styles.dot} ${styles.dotGreen}`} />
        </div>
        <button type="button" className={styles.copyBtn} onClick={() => void handleCopy()}>
          {copied ? "已复制" : "复制代码"}
        </button>
      </div>
      <pre className={preClassName}>{content}</pre>
    </div>
  );
};
