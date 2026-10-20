import { clamp01, rulerMap } from "@/lib/ruler/ruler-math";

import type { RulerGeom } from "@/lib/ruler/ruler.types";

const MIN_THUMB_PX = 32;
const MAX_THUMB_RATIO = 0.6;

export type ThumbCache = { h: number; p: number };

/**
 * 手机收起态的滚动条滑块：长度 = 视口占文档比例，位置 = 滚动进度。
 * 只写 CSS 变量（--thumb-h / --thumb-p），具体样式在 ScrollRuler.module.css；值没变就不写。
 */
export const writeThumbVars = (rail: HTMLElement | null, geom: RulerGeom, edgePad: number, scrollTop: number, cache: ThumbCache) => {
  if (!rail || !geom.vh || geom.docH <= geom.vh) return;
  const { span } = rulerMap(geom.vh, edgePad);
  const h = Math.round(Math.min(span * MAX_THUMB_RATIO, Math.max(MIN_THUMB_PX, (geom.vh / geom.docH) * span)));
  const p = Math.round(clamp01(scrollTop / (geom.docH - geom.vh)) * 1000) / 1000;
  if (h !== cache.h) {
    rail.style.setProperty("--thumb-h", `${h}px`);
    cache.h = h;
  }
  if (p !== cache.p) {
    rail.style.setProperty("--thumb-p", String(p));
    cache.p = p;
  }
};
