import { Children, isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { rehypeHeadingIds } from "@/lib/markdown/rehype-heading-ids";
import { CodeBlock } from "./CodeBlock";
import { MermaidBlock } from "./MermaidBlock";
import { markdownSanitizeSchema } from "./markdownSanitizeSchema";
import styles from "./MarkdownViewer.module.css";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

import type { Components } from "react-markdown";
import type { ReactNode } from "react";

type MarkdownViewerProps = {
  content: string;
  headingIds?: string[];
  className?: string;
};

const getCodeLanguage = (className?: string): string | null => {
  if (!className) return null;
  const match = /language-([\w-]+)/.exec(className);
  return match?.[1] ?? null;
};

const extractText = (node: unknown): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement<{ children?: unknown }>(node)) return extractText(node.props.children);
  return "";
};

const markdownComponents: Components = {
  pre: ({ children, className }) => {
    const childList = Children.toArray(children);
    const codeChild = childList.find((child) => isValidElement(child));

    if (isValidElement<{ className?: string; children?: unknown }>(codeChild)) {
      const language = getCodeLanguage(codeChild.props.className);
      if (language === "mermaid") {
        return <MermaidBlock chart={extractText(codeChild.props.children).replace(/\n$/, "")} />;
      }
    }

    return <CodeBlock className={className}>{children as ReactNode}</CodeBlock>;
  },
};

export const MarkdownViewer = ({ content, headingIds = [], className }: MarkdownViewerProps) => {
  const rootClassName = className ? `${styles.viewer} ${className}` : styles.viewer;

  return (
    <div className={rootClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, markdownSanitizeSchema],
          rehypeHeadingIds(headingIds),
          rehypeKatex,
          rehypeHighlight,
        ]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
