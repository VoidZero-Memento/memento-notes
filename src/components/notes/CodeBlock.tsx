import { isValidElement, useState } from "react";

import styles from "./CodeBlock.module.css";

import type { ReactNode } from "react";

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

export const CodeBlock = ({ children, className }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = extractText(children).replace(/\n$/, "");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
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
      <pre className={preClassName}>{children}</pre>
    </div>
  );
};
