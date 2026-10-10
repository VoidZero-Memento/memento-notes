export type RulerMode = "full" | "lite" | "static";

/** 几何/布局类参数（原站 rulerLayout，去掉 side：本项目固定在右侧） */
export type RulerLayoutConfig = {
  /** 映射整体上下内缩 px，保证 0/100 刻度完整可见 */
  edgePad: number;
  railW: number;
  minorPct: number;
  labelPct: number;
  thresholdPct: number;
  headingPx: number;
  ridingPx: number;
  queuePx: number;
  topPad: number;
  currentGap: number;
  queueSlot: number;
  queuePad: number;
  textPad: number;
  /** 顶部堆叠里，当前标题之上最多保留几个已读章节（更早的淡出） */
  stackPrev: number;
  /** 主刻度/里程表数字字号（原站写死 9，lite 需要更小） */
  labelPx: number;
};

/** 动效类参数（原站 rulerMotion，去掉 hero 相关） */
export type RulerMotionConfig = {
  flipZone: number;
  detachZone: number;
  stagger: number;
  arc: number;
  /** 点击跳转最大时长（秒） */
  jumpDur: number;
  snapDelay: number;
  snapDur: number;
  introDur: number;
  introStagger: number;
  velRadius: number;
  velMax: number;
  zoomInDelay: number;
  zoomOutDelay: number;
  zoomLerp: number;
  dragLerp: number;
};

/** 外观类参数（原站 rulerLook） */
export type RulerLookConfig = {
  minorAlpha: number;
  majorAlpha: number;
  labelAlpha: number;
  minorLen: number;
  majorLen: number;
  ghostAlpha: number;
  ghostThick: number;
  queueAlpha: number;
  yieldPad: number;
  needleFadePct: number;
  bracketAlpha: number;
  mapAlpha: number;
};

export type RulerConfig = {
  layout: RulerLayoutConfig;
  motion: RulerMotionConfig;
  look: RulerLookConfig;
};

/** 章节：anchor/bottom 均为滚动容器内的 scrollTop 坐标 */
export type RulerSection = {
  id: string;
  label: string;
  index: number;
  anchor: number;
  bottom: number;
};

export type RulerGeom = {
  docH: number;
  vh: number;
  vw: number;
};

export type LetterMetrics = {
  adv: number[];
  cum: number[];
  total: number;
};

export type RailOccupancySpan = {
  top: number;
  bottom: number;
  k: number;
};

export type RulerShared = {
  zoom: { target: number; p: number; dragging: boolean };
  /** 指针在 rail 上的 y（相对覆盖层顶部，已夹到映射范围）；lite 的当前章节气泡跟随它 */
  pointerY: number;
  railOccupancy: { spans: RailOccupancySpan[] };
};

export type RulerMap = {
  base: number;
  span: number;
  drift: (progress: number) => number;
};

export type ScrollToOptions = {
  /** 秒；与 lerp 互斥，二者都缺省则瞬时跳转 */
  duration?: number;
  easing?: (t: number) => number;
  /** 追随系数（0~1，越大越紧），用于拖拽 scrub */
  lerp?: number;
  onComplete?: () => void;
  immediate?: boolean;
};

export type ScrollAnimator = {
  scrollTo: (top: number, options?: ScrollToOptions) => void;
  stop: () => void;
  destroy: () => void;
};
