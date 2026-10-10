import type { RulerMap } from "./ruler.types";

export const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** 原站 rulerMap 去掉导航栏高度（NAV_H = 0）：容器就是整个视口 */
export const rulerMap = (vh: number, edgePad: number): RulerMap => ({
  base: edgePad,
  span: Math.max(1, vh - 2 * edgePad),
  drift: (progress) => edgePad - progress * (2 * edgePad),
});