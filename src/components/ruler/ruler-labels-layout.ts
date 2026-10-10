import { clamp01 } from "@/lib/ruler/ruler-math";

import type { LetterMetrics, RulerConfig, RulerGeom, RulerSection } from "@/lib/ruler/ruler.types";
import type { LabelDims, LabelsLayout, LabelsMetrics, LetterPose, ScrollFlip, SectionLayout } from "./ruler-labels.types";

/** 末端章节“滚到底仍到不了阈值线”时，留给兜底翻转的最小滚动区间 */
const MIN_SCROLL_FLIP_ZONE = 24;

export const getLabelDims = (cfg: RulerConfig, vh: number): LabelDims => {
  const { layout } = cfg;
  return {
    threshold: (layout.thresholdPct / 100) * vh,
    queueBottom: vh - layout.queuePad,
    heading: layout.headingPx,
    ride: layout.ridingPx / layout.headingPx,
    small: layout.queuePx / layout.headingPx,
  };
};

/** 横排姿态（顶部堆叠 / 底部队列 / 压缩地图）：右对齐到 rail 左缘，所以字母 x 从右往左量 */
export const stackPose = (
  m: LetterMetrics,
  i: number,
  y: number,
  scale: number,
  alpha: number,
  dims: LabelDims,
  cfg: RulerConfig,
  vw: number,
): LetterPose => {
  const offset = (m.cum[i] + m.adv[i] / 2) * dims.heading * scale;
  const fromEdge = cfg.layout.railW + cfg.layout.textPad + (m.total * dims.heading * scale - offset);
  return { x: vw - fromEdge, y, rot: 0, scale, alpha };
};

/** 竖排“骑行”姿态：旋转 -90°，字首在下，沿 rail 中线向上读 */
export const ridingPose = (m: LetterMetrics, i: number, y: number, dims: LabelDims, cfg: RulerConfig, vw: number): LetterPose => ({
  x: vw - cfg.layout.railW / 2,
  y: y + (m.total - m.cum[i] - m.adv[i] / 2) * dims.heading * dims.ride,
  rot: -90,
  scale: dims.ride,
  alpha: cfg.look.queueAlpha,
});

type LayoutArgs = {
  sections: RulerSection[];
  labels: string[];
  metrics: LabelsMetrics;
  cfg: RulerConfig;
  geom: RulerGeom;
  dims: LabelDims;
  scrollTop: number;
  drift: number;
};

/** 单章节的翻转进度；末尾章节若到不了阈值线，再叠一段按滚动位置的兜底翻转 */
const computeFlip = (section: RulerSection, v: number, args: LayoutArgs): { flipP: number; scrollFlip: ScrollFlip | null } => {
  const { cfg, geom, dims, scrollTop } = args;
  const maxScroll = Math.max(1, geom.docH - geom.vh);
  let flipP = clamp01((dims.threshold + cfg.motion.flipZone - v) / cfg.motion.flipZone);
  if (section.anchor - maxScroll <= dims.threshold) return { flipP, scrollFlip: null };
  const start = Math.min(section.bottom - geom.vh, maxScroll - MIN_SCROLL_FLIP_ZONE);
  const span = Math.max(MIN_SCROLL_FLIP_ZONE, maxScroll - start);
  flipP = Math.max(flipP, clamp01((scrollTop - start) / span));
  return { flipP, scrollFlip: { start, end: maxScroll } };
};

/** 原站 p() 每帧开头的 $ 数组：每章节的 v / rideLen / flipP / detachP / yq */
export const computeLayouts = (args: LayoutArgs): LabelsLayout => {
  const { sections, labels, metrics, cfg, dims, scrollTop, drift } = args;
  const { motion, layout } = cfg;

  const items: SectionLayout[] = sections.map((section, index) => {
    const rideLen = (metrics[labels[index]]?.total ?? 0) * dims.heading * dims.ride;
    const v = section.anchor - scrollTop + drift;
    // 首个章节恒为已翻转，占据顶部堆叠第一槽
    if (index === 0) return { v, rideLen, flipP: 1, scrollFlip: null, detachP: 1, yq: dims.queueBottom };
    return { v, rideLen, ...computeFlip(section, v, args), detachP: 0, yq: dims.queueBottom };
  });

  // 底部队列：最后一个章节恒贴在队列基线上，前面的按“排在它之后、尚未脱离的章节数 tail”向上排，
  // 所以队列高度只取决于还剩几个章节，与章节标题长短无关；前面的先脱离时，其余章节原位不动。
  // 自后向前算：yq 只依赖后面章节的 detachP，detachP 又只依赖自己的 yq，没有循环依赖
  let tail = 0;
  for (let i = items.length - 1; i >= 1; i--) {
    const item = items[i];
    item.yq = dims.queueBottom - layout.queueSlot * tail;
    item.detachP = clamp01((item.yq + motion.detachZone - (item.v + item.rideLen)) / motion.detachZone);
    tail += 1 - item.detachP;
  }

  let flipDone = 0;
  let flipPartial = 0;
  for (const item of items) {
    if (item.flipP >= 1) flipDone++;
    else if (item.flipP > 0) flipPartial += item.flipP;
  }
  const stackP = Math.max(0, flipDone - 1 + flipPartial);
  return { items, flipDone, flipPartial, stackP };
};
