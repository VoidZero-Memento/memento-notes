import type { RulerConfig, RulerGeom, RulerMode, RulerShared } from "@/lib/ruler/ruler.types";

export type RailTick = {
  pct: number;
  /** 刻度在文档中的 1:1 位置（px） */
  docY: number;
  major: boolean;
  alpha: number;
};

/** 每帧直接写 DOM 的节点集合，避免走 React 渲染 */
export type RailRefs = {
  rail: HTMLDivElement | null;
  layer: HTMLDivElement | null;
  bracket: HTMLDivElement | null;
  needle: HTMLDivElement | null;
  readout: HTMLSpanElement | null;
  ghost: HTMLDivElement | null;
  ghostLine: HTMLSpanElement | null;
  digits: (HTMLSpanElement | null)[];
  wraps: (HTMLDivElement | null)[];
  marks: (HTMLSpanElement | null)[];
  nums: (HTMLSpanElement | null)[];
};

/** 帧间可变状态（原站 O.current） */
export type RailState = {
  vel: number;
  lastY: number;
  introDone: boolean;
  prevDigits: number[];
  prevPct: number;
  readoutAbove: boolean;
  zoomIntent: boolean;
  zoomTimer: number;
  zoomWrote: boolean;
  ghostActive: boolean;
  /** 相对 rail 顶部的 y */
  ghostY: number;
  dragStartY: number;
  dragMoved: number;
};

export type RailFrameCtx = {
  refs: RailRefs;
  st: RailState;
  ticks: RailTick[];
  geom: RulerGeom;
  cfg: RulerConfig;
  mode: RulerMode;
  shared: RulerShared;
  container: HTMLElement;
};
