import type { RulerConfig, RulerLayoutConfig, RulerLookConfig, RulerMode, RulerMotionConfig } from "./ruler.types";

/**
 * 以下三组默认值取自原站 tunables，保持同名字段。
 * full 模式的标题区（headingPx / queuePx / topPad 等）已针对笔记阅读收敛：字号更小，少占正文。
 */
export const RULER_LAYOUT: RulerLayoutConfig = {
  edgePad: 12,
  railW: 60,
  minorPct: 1,
  labelPct: 5,
  thresholdPct: 12,
  headingPx: 20,
  ridingPx: 14,
  queuePx: 13,
  topPad: 16,
  currentGap: 16,
  queueSlot: 18,
  // 队列最后一行文字中心距视口底部的距离，与顶部 topPad 对称；回到顶部按钮不在此处让位
  queuePad: 20,
  textPad: 0,
  // 章节数上限为 8（MAX_SECTIONS），取 7 即顶部已读章节全部露出；底部待读队列始终全部露出
  stackPrev: 7,
  labelPx: 9,
};

export const RULER_MOTION: RulerMotionConfig = {
  flipZone: 200,
  detachZone: 240,
  stagger: 0.16,
  arc: 28,
  jumpDur: 1.25,
  snapDelay: 400,
  snapDur: 0.7,
  introDur: 1,
  introStagger: 0.01,
  velRadius: 180,
  velMax: 0.6,
  zoomInDelay: 150,
  zoomOutDelay: 150,
  zoomLerp: 10,
  dragLerp: 0.18,
};

export const RULER_LOOK: RulerLookConfig = {
  minorAlpha: 0.4,
  majorAlpha: 0.8,
  labelAlpha: 0.5,
  minorLen: 10,
  majorLen: 20,
  ghostAlpha: 1,
  ghostThick: 3,
  // 非当前章节（上一章 / 下一章 / 骑行字）统一的透明度，只有当前章节是 1
  queueAlpha: 0.6,
  yieldPad: 24,
  needleFadePct: 3,
  bracketAlpha: 0.1,
  mapAlpha: 0.85,
};

/** 手机/触屏：窄 rail、稀疏刻度；触摸上关掉速度拉伸省性能，入场缩短 */
export const RULER_LAYOUT_LITE: RulerLayoutConfig = {
  ...RULER_LAYOUT,
  railW: 30,
  minorPct: 2,
  labelPct: 10,
  labelPx: 8,
  // lite 只在缩放地图里显示章节名，字号取小以免相互压叠
  queuePx: 12,
};

export const RULER_LOOK_LITE: RulerLookConfig = {
  ...RULER_LOOK,
  minorLen: 6,
  majorLen: 12,
};

export const RULER_MOTION_LITE: RulerMotionConfig = {
  ...RULER_MOTION,
  introDur: 0.5,
  velMax: 0,
  velRadius: 0,
  zoomInDelay: 0,
  zoomOutDelay: 600,
};

const CONFIGS: Record<RulerMode, RulerConfig> = {
  full: { layout: RULER_LAYOUT, motion: RULER_MOTION, look: RULER_LOOK },
  lite: { layout: RULER_LAYOUT_LITE, motion: RULER_MOTION_LITE, look: RULER_LOOK_LITE },
  static: { layout: RULER_LAYOUT, motion: RULER_MOTION, look: RULER_LOOK },
};

/** 返回固定引用，便于作为 hook / memo 依赖 */
export const getRulerConfig = (mode: RulerMode): RulerConfig => CONFIGS[mode];

/** 内容滚动距离不足该值则不显示标尺 */
export const RULER_MIN_OVERFLOW = 80;
/** 已开启时的关闭阈值，留出回差避免因 padding 变化来回抖动 */
export const RULER_MIN_OVERFLOW_KEEP = 40;
