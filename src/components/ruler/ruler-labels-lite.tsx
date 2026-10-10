import { useRef } from "react";

import { RULER_LABEL_FONT_FAMILY, RULER_LABEL_FONT_WEIGHT } from "@/lib/ruler/measure-letters";
import { clamp01, rulerMap } from "@/lib/ruler/ruler-math";
import { useRafLoop } from "@/lib/ruler/use-raf-loop";

import styles from "./RulerLabels.module.css";

import type { RulerLabelsProps } from "./ruler-labels.types";

/** 当前章节判定线：视口上方 30% 处，与“正在读的章节”体感一致 */
const CURRENT_LINE = 0.3;
/** 气泡与容器上下边缘的最小间距 */
const BUBBLE_EDGE = 4;
/** 气泡与 rail 左缘的间距 */
const BUBBLE_GAP = 10;

type BubbleState = { text: string; height: number; written: number };

/** 按 scrollTop 找最后一个 anchor<=scrollTop+vh*0.3 的章节，未到第一个标题时返回 -1 */
const findCurrent = (anchors: number[], line: number): number => {
  let found = -1;
  for (let i = 0; i < anchors.length; i++) {
    if (anchors[i] <= line) found = i;
  }
  return found;
};

/**
 * 手机/触屏的章节标题：只有按住 rail 缩放（zoom.p>0）时出现——
 * 整页压缩地图小字 + 指针处“当前章节”气泡。不可点击，不做字母飞行。
 */
export const RulerLabelsLite = ({ config, geom, sections, shared, scrollRef, active }: RulerLabelsProps) => {
  const labelEls = useRef<(HTMLSpanElement | null)[]>([]);
  const bubbleEl = useRef<HTMLDivElement | null>(null);
  const bubble = useRef<BubbleState>({ text: "", height: 0, written: -1 });
  const { layout, look } = config;
  const map = rulerMap(geom.vh, layout.edgePad);
  const docH = Math.max(1, geom.docH);

  useRafLoop(() => {
    const zp = shared.zoom.p;
    const state = bubble.current;
    // 完全收起后只需保证一次归零，之后每帧直接跳过
    if (zp === 0 && state.written === 0) return;
    state.written = zp;

    const alpha = String(look.mapAlpha * zp);
    for (const el of labelEls.current) if (el) el.style.opacity = alpha;

    const el = bubbleEl.current;
    const container = scrollRef.current;
    if (!el || !container) return;
    const index = findCurrent(
      sections.map((s) => s.anchor),
      container.scrollTop + geom.vh * CURRENT_LINE,
    );
    // 以文本而非下标判断变化：章节列表重算后同下标可能是别的标题
    const text = index >= 0 ? sections[index].label : "";
    if (text !== state.text) {
      state.text = text;
      el.textContent = text;
      // 文字变化才读一次高度，避免每帧触发布局
      state.height = el.offsetHeight;
    }
    const half = state.height / 2;
    const y = Math.max(half + BUBBLE_EDGE, Math.min(geom.vh - half - BUBBLE_EDGE, shared.pointerY));
    el.style.transform = `translate3d(0, ${y}px, 0) translateY(-50%)`;
    el.style.opacity = index >= 0 ? String(clamp01(zp)) : "0";
  }, active);

  if (!sections.length) return null;

  const fontStyle = { fontFamily: RULER_LABEL_FONT_FAMILY, fontWeight: RULER_LABEL_FONT_WEIGHT };
  const right = layout.railW + layout.textPad + 6;

  return (
    <div aria-hidden className={styles.layer} style={fontStyle}>
      {sections.map((section, i) => (
        <span
          key={`${section.id}-${i}`}
          ref={(el) => {
            labelEls.current[i] = el;
          }}
          className={styles.mapLabel}
          style={{
            right,
            fontSize: layout.queuePx,
            transform: `translate3d(0, ${map.base + (section.anchor / docH) * map.span}px, 0) translateY(-50%)`,
          }}
        >
          {section.label.toUpperCase()}
        </span>
      ))}
      <div ref={bubbleEl} className={styles.bubble} style={{ right: layout.railW + BUBBLE_GAP }} />
    </div>
  );
};
