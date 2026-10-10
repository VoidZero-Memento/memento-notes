import { clamp01, easeInOutCubic, rulerMap } from "@/lib/ruler/ruler-math";
import { computeLayouts, getLabelDims, ridingPose, stackPose } from "./ruler-labels-layout";
import { runSnap } from "./ruler-labels-snap";

import type { LetterMetrics } from "@/lib/ruler/ruler.types";
import type { LabelDims, LabelState, LabelsFrameCtx, LabelsLayout, LetterPose, SectionLayout, SectionPoses } from "./ruler-labels.types";

/** 悬停提亮的阻尼时间常数（秒） */
const HOVER_TAU = 0.08;
/** 点击后 accent 闪色持续（毫秒）与最大混入比例 */
const FLASH_MS = 350;
const FLASH_MIX = 70;
/** 命中区在字母包围盒外多留的像素 */
const HIT_PAD = 2;

export const createLabelState = (count: number): LabelState => ({
  lastY: -1,
  vel: 0,
  snapSince: null,
  snapping: false,
  armed: true,
  jumping: false,
  hover: -1,
  hoverP: new Float32Array(count),
  flashUntil: new Float64Array(count),
});

/** 按当前进度决定该章节字母的起止姿态：翻转 → 顶部堆叠；未到 → 队列 / 脱离；其余 → 骑行 */
const pickPoses = (ctx: LabelsFrameCtx, index: number, item: SectionLayout, layout: LabelsLayout, dims: LabelDims, m: LetterMetrics): SectionPoses => {
  const { cfg, geom } = ctx;
  const { queueSlot, currentGap, topPad, stackPrev } = cfg.layout;
  const { queueAlpha } = cfg.look;
  const stack = (i: number, y: number, scale: number, alpha: number) => stackPose(m, i, y, scale, alpha, dims, cfg, geom.vw);
  const ride = (i: number, y: number) => ridingPose(m, i, y, dims, cfg, geom.vw);

  if (item.flipP > 0) {
    const from = (i: number) => ride(i, item.v);
    // 只保留当前标题之上的 stackPrev 个已读章节：整体按连续序号上推，更早的淡出，避免堆叠越来越高
    const shift = Math.max(0, layout.stackP - stackPrev) * queueSlot;
    const vis = clamp01(stackPrev + 1 - (layout.stackP - index));
    const baseY = topPad + index * queueSlot - shift;
    if (item.flipP >= 1) {
      // 最后一个已翻转的章节在下一个开始翻转时，逐步让出“当前大标题”位置缩成队列小字
      const k = index === layout.flipDone - 1 ? layout.flipPartial : 1;
      const y = baseY + currentGap * (1 - k);
      const scale = 1 - (1 - dims.small) * k;
      const alpha = (1 - (1 - queueAlpha) * k) * vis;
      return { t: item.flipP, reversed: true, from, to: (i) => stack(i, y, scale, alpha) };
    }
    return { t: item.flipP, reversed: true, from, to: (i) => stack(i, baseY + currentGap, 1, vis) };
  }
  if (item.detachP < 1) {
    const y = item.yq - item.rideLen;
    return { t: item.detachP, reversed: true, from: (i) => stack(i, item.yq, dims.small, queueAlpha), to: (i) => ride(i, y) };
  }
  const pose = (i: number) => ride(i, item.v);
  return { t: 1, reversed: false, from: pose, to: pose };
};

type SectionState = { zoomH: number; mapY: number; hover: number; flash: number };

/** 二次贝塞尔：控制点取起止中点并向页面一侧（-x）偏 arc，字母沿弧线飞行 */
const flyLetter = (a: LetterPose, b: LetterPose, d: number, arc: number): LetterPose => {
  const cx = (a.x + b.x) / 2 - arc;
  const cy = (a.y + b.y) / 2;
  const u = 1 - d;
  return {
    x: u * u * a.x + 2 * u * d * cx + d * d * b.x,
    y: u * u * a.y + 2 * u * d * cy + d * d * b.y,
    rot: a.rot + (b.rot - a.rot) * d,
    scale: a.scale + (b.scale - a.scale) * d,
    alpha: a.alpha + (b.alpha - a.alpha) * d,
  };
};

/** 悬停/闪色叠加后的字母颜色：不透明走主题前景色，其余用带 alpha 的前景色 */
const letterColor = (alpha: number, hover: number, flash: number): string => {
  const shown = alpha + (1 - alpha) * hover;
  const base = shown >= 0.995 ? "rgb(var(--fg-rgb))" : `rgba(var(--fg-rgb), ${clamp01(shown).toFixed(3)})`;
  return flash > 0.01 ? `color-mix(in srgb, var(--accent-3) ${(FLASH_MIX * flash).toFixed(0)}%, ${base})` : base;
};

/** 写一个章节所有字母的 transform/opacity/color，并让命中区跟随字母包围盒 */
const writeSection = (ctx: LabelsFrameCtx, index: number, poses: SectionPoses, dims: LabelDims, m: LetterMetrics, s: SectionState) => {
  const { cfg, geom } = ctx;
  const { stagger, arc } = cfg.motion;
  const letters = ctx.refs[index].letters;
  const count = m.adv.length;
  const total = 1 + (count - 1) * stagger;
  const mapPose = (i: number) => stackPose(m, i, s.mapY, dims.small, cfg.look.mapAlpha, dims, cfg, geom.vw);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let maxAlpha = 0;

  for (let i = 0; i < count; i++) {
    const el = letters[i];
    if (!el) continue;
    // 翻转/脱离时末字先动；骑行与队列保持原序
    const order = poses.reversed ? count - 1 - i : i;
    const d = easeInOutCubic(clamp01(poses.t * total - order * stagger));
    const pose = flyLetter(poses.from(i), poses.to(i), d, arc);

    if (s.zoomH > 0) {
      const map = mapPose(i);
      pose.x += (map.x - pose.x) * s.zoomH;
      pose.y += (map.y - pose.y) * s.zoomH;
      pose.rot *= 1 - s.zoomH;
      pose.scale += (map.scale - pose.scale) * s.zoomH;
      pose.alpha += (map.alpha - pose.alpha) * s.zoomH;
    }

    el.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0) translate(-50%, -50%) rotate(${pose.rot}deg) scale(${pose.scale})`;
    if (el.style.opacity !== "1") el.style.opacity = "1";
    el.style.color = letterColor(pose.alpha, s.hover, s.flash);
    maxAlpha = Math.max(maxAlpha, pose.alpha);

    // 旋转超过 45° 视为竖排，包围盒宽高互换；半宽取字宽、半高取字号
    const along = (m.adv[i] * dims.heading * pose.scale) / 2 + HIT_PAD;
    const across = (dims.heading * pose.scale) / 2 + HIT_PAD;
    const vertical = Math.abs(pose.rot) > 45;
    const halfW = vertical ? across : along;
    const halfH = vertical ? along : across;
    minX = Math.min(minX, pose.x - halfW);
    maxX = Math.max(maxX, pose.x + halfW);
    minY = Math.min(minY, pose.y - halfH);
    maxY = Math.max(maxY, pose.y + halfH);
  }

  const hit = ctx.refs[index].hit;
  if (!hit || !Number.isFinite(minX)) return;
  hit.style.left = `${minX - HIT_PAD}px`;
  hit.style.top = `${minY - HIT_PAD}px`;
  hit.style.width = `${maxX - minX + HIT_PAD * 2}px`;
  hit.style.height = `${maxY - minY + HIT_PAD * 2}px`;
  hit.style.pointerEvents = maxAlpha > 0.05 ? "auto" : "none";
};

/** 标题字母飞行每帧主流程（原站 p() 内 ticker 回调） */
export const runLabelsFrame = (ctx: LabelsFrameCtx, dtMs: number) => {
  const { cfg, geom, sections, container, st, shared, labels, metrics } = ctx;
  if (!sections.length || !geom.docH || !geom.vh) return;

  const dt = Math.min(dtMs / 1000, 0.1) || 0.016;
  const scrollTop = container.scrollTop;
  const maxScroll = Math.max(1, geom.docH - geom.vh);
  const map = rulerMap(geom.vh, cfg.layout.edgePad);
  const drift = map.drift(clamp01(scrollTop / maxScroll));

  if (st.lastY < 0) st.lastY = scrollTop;
  st.vel += ((scrollTop - st.lastY) / dt - st.vel) * (1 - Math.exp(-6 * dt));
  st.lastY = scrollTop;

  const dims = getLabelDims(cfg, geom.vh);
  const layout = computeLayouts({ sections, labels, metrics, cfg, geom, dims, scrollTop, drift });

  const zoomH = easeInOutCubic(shared.zoom.p);
  const occupancy = shared.railOccupancy.spans;
  occupancy.length = 0;
  const now = performance.now();
  const hoverRate = 1 - Math.exp(-dt / HOVER_TAU);

  for (let i = 0; i < sections.length; i++) {
    const m = metrics[labels[i]];
    if (!m || !ctx.refs[i]) continue;
    const item = layout.items[i];
    st.hoverP[i] += ((st.hover === i ? 1 : 0) - st.hoverP[i]) * hoverRate;
    const state: SectionState = {
      zoomH,
      mapY: map.base + (sections[i].anchor / geom.docH) * map.span,
      hover: st.hoverP[i],
      flash: clamp01((st.flashUntil[i] - now) / FLASH_MS),
    };
    writeSection(ctx, i, pickPoses(ctx, i, item, layout, dims, m), dims, m, state);

    // 骑行字所在的 rail 区间让百分比数字让位；强度 = 脱离进度 × 未翻转程度
    const k = item.detachP * (1 - item.flipP);
    if (k > 0.02) occupancy.push({ top: item.v, bottom: item.v + item.rideLen, k });
  }

  runSnap(ctx, layout, drift, dims.threshold, maxScroll);
};
