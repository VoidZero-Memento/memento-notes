import { useEffect, useState } from "react";

import styles from "./NotesShell.module.css";

import type { ReactNode, TransitionEvent } from "react";

type NoteEnterProps = {
  children: ReactNode;
};

/** 等正文提交并完成绘制后再触发上滑，避免 iOS 上重渲染吃掉 mount 动画 */
export const NoteEnter = ({ children }: NoteEnterProps) => {
  const [active, setActive] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setActive(true);
      setSettled(true);
      return;
    }

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setActive(true));
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "opacity" && event.propertyName !== "transform") return;
    setSettled(true);
  };

  const className = [
    styles.noteEnter,
    active ? styles.noteEnterActive : "",
    settled ? styles.noteEnterSettled : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} onTransitionEnd={onTransitionEnd}>
      {children}
    </div>
  );
};
