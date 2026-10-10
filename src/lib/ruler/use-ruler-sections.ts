import { useEffect, useState } from "react";

import type { RefObject } from "react";
import type { RulerGeom, RulerSection } from "./ruler.types";

const MAX_SECTIONS = 8;
const MAX_LABEL_CHARS = 14;

type HeadingInfo = { el: HTMLElement; level: number; anchor: number };

const truncateLabel = (text: string): string => {
  const chars = Array.from(text.replace(/\s+/g, " ").trim());
  return chars.length > MAX_LABEL_CHARS ? `${chars.slice(0, MAX_LABEL_CHARS).join("")}…` : chars.join("");
};

/** 选取参与标尺的标题：>8 个时只留最浅一级；仍不足 2 个说明只有孤零零的 h1，退回 h2 */
const pickHeadings = (all: HeadingInfo[]): HeadingInfo[] => {
  let picked = all;
  if (picked.length > MAX_SECTIONS) {
    const minLevel = Math.min(...all.map((h) => h.level));
    const shallow = all.filter((h) => h.level === minLevel);
    picked = shallow.length >= 2 ? shallow : all.filter((h) => h.level !== minLevel);
  }
  return picked.slice(0, MAX_SECTIONS);
};

const computeSections = (container: HTMLElement, docH: number): RulerSection[] => {
  const containerTop = container.getBoundingClientRect().top;
  const all: HeadingInfo[] = [...container.querySelectorAll<HTMLElement>("h1, h2")].map((el) => ({
    el,
    level: Number(el.tagName[1]),
    // 用 rect 而非 offsetTop：容器本身非定位元素，offsetParent 链不经过它
    anchor: el.getBoundingClientRect().top - containerTop + container.scrollTop,
  }));

  return pickHeadings(all).map((heading, index) => {
    const next = all.find((other) => other.anchor > heading.anchor && other.level <= heading.level);
    return {
      id: heading.el.id || `ruler-section-${index}`,
      label: truncateLabel(heading.el.textContent ?? ""),
      index,
      anchor: heading.anchor,
      bottom: next ? next.anchor : docH,
    };
  });
};

const sameSections = (a: RulerSection[], b: RulerSection[]): boolean =>
  a.length === b.length &&
  a.every((s, i) => s.id === b[i].id && s.label === b[i].label && s.anchor === b[i].anchor && s.bottom === b[i].bottom);

/** geom 变化（含字体/图片撑高）、正文 DOM 变化、入场位移动画结束后都重算锚点 */
export const useRulerSections = (
  containerRef: RefObject<HTMLElement | null>,
  geom: RulerGeom,
  contentKey: string | null,
): RulerSection[] => {
  const [sections, setSections] = useState<RulerSection[]>([]);
  const { docH, vw } = geom;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !docH) return;

    let raf = 0;
    const recompute = () => {
      raf = 0;
      const next = computeSections(container, container.scrollHeight);
      setSections((prev) => (sameSections(prev, next) ? prev : next));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(recompute);
    };

    recompute();
    const mo = new MutationObserver(schedule);
    mo.observe(container, { childList: true, subtree: true, characterData: true });
    // NoteEnter 入场带 translateY，rect 在动画期间偏移，结束后需重取
    container.addEventListener("transitionend", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      mo.disconnect();
      container.removeEventListener("transitionend", schedule);
    };
  }, [containerRef, docH, vw, contentKey]);

  return sections;
};
