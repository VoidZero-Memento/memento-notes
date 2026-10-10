import { easeInOutCubic } from "@/lib/ruler/ruler-math";

import type { RulerSection } from "@/lib/ruler/ruler.types";
import type { LabelsFrameCtx, LabelsLayout, SectionLayout } from "./ruler-labels.types";

/** 判定“翻转做到一半”的区间：flipP 落在其内才需要 snap */
const HALF_MIN = 0.04;
const HALF_MAX = 0.96;
/** 滚动速度低于该值（px/s）视为已停住 */
const REST_VEL = 30;
/** 缩放进度超过该值时不 snap，避免与拖拽/悬停缩放抢滚动 */
const ZOOM_BLOCK_P = 0.3;
/** snap 目标越过翻转/未翻转边界后多走的像素，防止停在边缘又被判成半翻转 */
const OVERSHOOT = 4;
const NEIGHBOR_PAD = 2;

type FlipBounds = { yFlip: number; yUnflip: number };

/** 某章节“刚好完成翻转 / 刚好回到未翻转”所对应的 scrollTop */
const flipBounds = (section: RulerSection, item: SectionLayout, threshold: number, drift: number, flipZone: number): FlipBounds => {
  const yFlip = section.anchor + drift - threshold - HALF_MIN * flipZone;
  const yUnflip = section.anchor + drift - threshold - HALF_MAX * flipZone;
  if (!item.scrollFlip) return { yFlip, yUnflip };
  const { start, end } = item.scrollFlip;
  return {
    yFlip: Math.min(yFlip, start + HALF_MAX * (end - start)),
    yUnflip: Math.min(yUnflip, start + HALF_MIN * (end - start)),
  };
};

/** 计算 snap 落点：朝最近的稳定态走，同时不能把相邻章节推进半翻转区 */
const resolveTarget = (ctx: LabelsFrameCtx, layout: LabelsLayout, half: number, threshold: number, drift: number, maxScroll: number): number => {
  const { sections, cfg } = ctx;
  const { flipZone } = cfg.motion;
  const item = layout.items[half];
  const section = sections[half];
  const forward = item.flipP >= 0.5;

  let base: number;
  if (item.scrollFlip) {
    base = forward ? item.scrollFlip.end + OVERSHOOT : item.scrollFlip.start - OVERSHOOT;
  } else {
    const line = forward ? threshold - OVERSHOOT : threshold + flipZone + OVERSHOOT;
    base = section.anchor + drift - line;
  }

  let adjusted = base;
  layout.items.forEach((other, i) => {
    if (i === half) return;
    const bounds = flipBounds(sections[i], other, threshold, drift, flipZone);
    if (other.flipP >= HALF_MAX) adjusted = Math.max(adjusted, bounds.yFlip + NEIGHBOR_PAD);
    else if (other.flipP <= HALF_MIN) adjusted = Math.min(adjusted, bounds.yUnflip - NEIGHBOR_PAD);
  });

  const own = flipBounds(section, item, threshold, drift, flipZone);
  const adjustedOk = forward ? adjusted >= own.yFlip : adjusted <= own.yUnflip;
  return Math.max(0, Math.min(maxScroll, adjustedOk ? adjusted : base));
};

/**
 * 翻转停在一半且滚动已停住一段时间 → 自动阻尼滚到最近的稳定态（原站 snap）。
 * 与原站的区别：用户输入打断动画时由 RulerLabels 复位 snapping/jumping，不会卡死门闸。
 */
export const runSnap = (ctx: LabelsFrameCtx, layout: LabelsLayout, drift: number, threshold: number, maxScroll: number) => {
  const { st, shared, animator, cfg } = ctx;
  const half = layout.items.findIndex((item) => item.flipP > HALF_MIN && item.flipP < HALF_MAX);
  const now = performance.now();
  if (shared.zoom.dragging) st.armed = true;

  if (st.snapping) {
    if (half < 0) st.snapping = false;
    return;
  }
  const idle = half >= 0 && st.armed && !st.jumping && Math.abs(st.vel) < REST_VEL && !shared.zoom.dragging && shared.zoom.p < ZOOM_BLOCK_P;
  if (!idle) {
    st.snapSince = null;
    return;
  }
  if (st.snapSince === null) {
    st.snapSince = now;
    return;
  }
  if (now - st.snapSince <= cfg.motion.snapDelay) return;

  const target = resolveTarget(ctx, layout, half, threshold, drift, maxScroll);
  st.snapping = true;
  st.armed = false;
  st.snapSince = null;
  animator.scrollTo(target, {
    duration: cfg.motion.snapDur,
    easing: easeInOutCubic,
    onComplete: () => {
      st.snapping = false;
    },
  });
};
