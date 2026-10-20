import { useEffect } from "react";

import { CURRENT_LINE, findCurrentSection } from "@/lib/ruler/current-section";

import type { RefObject } from "react";
import type { RulerSection } from "@/lib/ruler/ruler.types";
import type { RailRefs } from "./ruler-rail.types";

/** 旧标题退场时长，需与 CSS 的 nextTitleOut 一致 */
const OUT_MS = 220;
/** 标题最多显示的字符数，超出以省略号收尾 */
const MAX_CHARS = 12;

type Classes = { text: string; char: string; in: string; out: string };

type Args = {
  enabled: boolean;
  sections: RulerSection[];
  vh: number;
  scrollRef: RefObject<HTMLElement | null>;
  refs: RefObject<RailRefs>;
  classes: Classes;
};

/** 纵向堆叠时省略号要竖着，用 ⋮ */
const toChars = (label: string) => {
  const chars = Array.from(label.replace(/\s+/g, ""));
  return chars.length > MAX_CHARS ? [...chars.slice(0, MAX_CHARS - 1), "⋮"] : chars;
};

/**
 * 手机标尺：在滚动条中部维护「下一章」标题。
 * 当前章节变化时，旧标题上滑淡出、新标题从下滑入；已是最后一章则清空。
 * 只通过 DOM 写入驱动，滚动期间不触发 React 渲染；样式与动画见 ScrollRuler.module.css。
 */
export const useRailSectionTitle = ({ enabled, sections, vh, scrollRef, refs, classes }: Args) => {
  useEffect(() => {
    const container = scrollRef.current;
    const host = refs.current.nextTitle;
    if (!enabled || !container || !host || !sections.length) return;

    const anchors = sections.map((section) => section.anchor);
    // 未到第一个标题时 current=-1，下一章即第一个标题；最后一章之后没有下一章
    const nextIndex = () => {
      const next = findCurrentSection(anchors, container.scrollTop + vh * CURRENT_LINE) + 1;
      return next < sections.length ? next : -1;
    };

    const append = (index: number, animate: boolean) => {
      const span = document.createElement("span");
      span.className = animate ? `${classes.text} ${classes.in}` : classes.text;
      span.replaceChildren(
        ...toChars(sections[index].label).map((char) => {
          const item = document.createElement("span");
          item.className = classes.char;
          item.textContent = char;
          return item;
        }),
      );
      host.append(span);
    };

    // 旧节点只标记退场，到点再移除；快速连续切换时各节点互不干扰
    const retire = () => {
      for (const old of host.children) {
        if (old.classList.contains(classes.out)) continue;
        old.classList.remove(classes.in);
        old.classList.add(classes.out);
        window.setTimeout(() => old.remove(), OUT_MS);
      }
    };

    // 初始状态不播放入场，避免刚打开文章就动
    let last = nextIndex();
    host.replaceChildren();
    if (last >= 0) append(last, false);

    const onScroll = () => {
      const index = nextIndex();
      if (index === last) return;
      last = index;
      retire();
      if (index >= 0) append(index, true);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      host.replaceChildren();
    };
  }, [enabled, sections, vh, scrollRef, refs, classes]);
};
