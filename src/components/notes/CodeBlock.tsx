import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from "react";

import { blurActiveInside } from "@/lib/dom/blur-active-inside";
import { useMediaQuery } from "@/lib/dom/use-media-query";
import { toast } from "@/lib/toast/toast";

import styles from "./CodeBlock.module.css";

import type { ReactElement, ReactNode } from "react";

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

const CopyIcon = () => (
  <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden>
    <rect
      x="5.4"
      y="1.7"
      width="8.9"
      height="8.9"
      rx="1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
    />
    <rect
      x="1.7"
      y="5.4"
      width="8.9"
      height="8.9"
      rx="1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
    />
  </svg>
);

const CopiedIcon = () => (
  <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden>
    <path
      d="M3.2 8.4 6.5 11.6 12.8 4.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden>
    <path
      d={collapsed ? "M3.4 5.9 8 10.5 12.6 5.9" : "M3.4 10.1 8 5.5 12.6 10.1"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CodeBlock = ({ children, className, language }: CodeBlockProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState(false);
  const hoverReveal = useMediaQuery("(hover: hover) and (pointer: fine)");
  const content = normalizeCodeChildren(children);
  const langLabel = language?.trim() || null;

  useEffect(() => {
    if (hoverReveal) setActive(false);
  }, [hoverReveal]);

  useEffect(() => {
    if (!active) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setActive(false);
      blurActiveInside(rootRef.current);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [active]);

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
  const bodyClassName = collapsed ? `${styles.body} ${styles.bodyCollapsed}` : styles.body;

  return (
    <div
      ref={rootRef}
      className={active ? `${styles.block} ${styles.blockActive}` : styles.block}
      data-code-block
      onClick={hoverReveal ? undefined : () => setActive(true)}
    >
      <div className={styles.header}>
        <span className={styles.meta}>
          <span className={styles.dots} aria-hidden="true">
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
          </span>
          {langLabel ? <span className={styles.lang}>{langLabel}</span> : null}
        </span>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.collapseBtn}`}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "展开代码" : "收起代码"}
            onClick={() => setCollapsed((prev) => !prev)}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={copied ? "已复制" : "复制代码"}
            onClick={() => void handleCopy()}
          >
            {copied ? <CopiedIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>
      <div className={bodyClassName} aria-hidden={collapsed}>
        <div className={styles.bodyInner}>
          <pre className={preClassName}>{content}</pre>
        </div>
      </div>
    </div>
  );
};
