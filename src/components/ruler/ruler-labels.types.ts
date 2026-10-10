import type { RefObject } from "react";
import type { LetterMetrics, RulerConfig, RulerGeom, RulerMode, RulerSection, RulerShared, ScrollAnimator } from "@/lib/ruler/ruler.types";

/** ScrollRuler 交给 RulerLabels（章节标题字母飞行）的全部输入 */
export type RulerLabelsProps = {
  mode: RulerMode;
  config: RulerConfig;
  geom: RulerGeom;
  sections: RulerSection[];
  /** 与 rail 共享的缩放进度与让位区间 */
  shared: RulerShared;
  animator: ScrollAnimator;
  scrollRef: RefObject<HTMLElement | null>;
  active: boolean;
};

/** 以展示用（已转大写）标题为键的逐字宽度表 */
export type LabelsMetrics = Record<string, LetterMetrics>;

/** 单个字母在某一时刻的姿态；x/y 为字母中心点 */
export type LetterPose = { x: number; y: number; rot: number; scale: number; alpha: number };

/** 每个章节 DOM 引用：字母 span 与隐形命中区 */
export type LabelRefs = { letters: (HTMLSpanElement | null)[]; hit: HTMLAnchorElement | null };

/** 跨帧状态：速度、snap 门闸、悬停/点击闪色的阻尼量 */
export type LabelState = {
  /** 上一帧 scrollTop；<0 表示尚未采样，避免首帧把初始位置当成巨大速度 */
  lastY: number;
  vel: number;
  snapSince: number | null;
  snapping: boolean;
  armed: boolean;
  jumping: boolean;
  hover: number;
  hoverP: Float32Array;
  flashUntil: Float64Array;
};

/** 帧内不随章节变化的尺寸换算 */
export type LabelDims = {
  /** 翻转阈值线（px，距视口顶） */
  threshold: number;
  /** 底部队列最下一槽的 y */
  queueBottom: number;
  /** 当前章节大标题字号 */
  heading: number;
  /** 骑行字相对大标题的缩放 */
  ride: number;
  /** 队列/堆叠小字相对大标题的缩放 */
  small: number;
};

/** 章节自带滚动区间的翻转（章节在文末到不了阈值线时，按滚动位置兜底翻转） */
export type ScrollFlip = { start: number; end: number };

export type SectionLayout = {
  /** 锚点在视口中的 y（含 drift） */
  v: number;
  rideLen: number;
  flipP: number;
  scrollFlip: ScrollFlip | null;
  detachP: number;
  yq: number;
};

export type LabelsLayout = {
  items: SectionLayout[];
  /** flipP>=1 的章节数 */
  flipDone: number;
  /** 0<flipP<1 的章节 flipP 之和 */
  flipPartial: number;
  /** 顶部堆叠的连续“当前序号”：flipDone-1+flipPartial，用来平滑上推并淡出更早的章节 */
  stackP: number;
};

/** 每帧动画所需的全部输入 */
export type LabelsFrameCtx = {
  cfg: RulerConfig;
  geom: RulerGeom;
  sections: RulerSection[];
  /** 与 sections 一一对应的展示标题（大写） */
  labels: string[];
  metrics: LabelsMetrics;
  shared: RulerShared;
  animator: ScrollAnimator;
  container: HTMLElement;
  refs: LabelRefs[];
  st: LabelState;
};

/** 某章节本帧的起止姿态与进度（letters 沿二次贝塞尔从 from 飞到 to） */
export type SectionPoses = {
  t: number;
  /** 翻转/脱离时字母顺序反向（末字先动），与原站一致 */
  reversed: boolean;
  from: (index: number) => LetterPose;
  to: (index: number) => LetterPose;
};
