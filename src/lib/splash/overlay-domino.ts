import { PC_WALL_FLIP_MS, PC_WALL_STAGGER_MS } from "@/lib/bg-photos/constants";
import { createColumn, DONE_BUFFER_MS, flipColumn, freezeMotion } from "@/lib/splash/splash-domino";

/**
 * 点击切换背景后的蒙层退场：与开屏相同，把底图按图墙列数切成列，从左到右倒牌，露出下面的图墙。
 * 无法执行（减少动效 / 图墙未就位）返回 null，调用方走溶解兜底；成功则返回清理函数。
 */
export const runOverlayDomino = (backdrop: HTMLElement, onDone: () => void): (() => void) | null => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const count = document.querySelectorAll("[data-pc-wall-tile]").length;
  if (count <= 0) return null;

  const prevCss = backdrop.style.cssText;
  if (!freezeMotion(backdrop)) return null;

  const columns = Array.from({ length: count }, (_, i) => createColumn(backdrop, i, count));
  let anchor: Element = backdrop;
  columns.forEach((column) => {
    anchor.after(column);
    anchor = column;
  });
  backdrop.style.visibility = "hidden";
  void backdrop.offsetWidth;

  columns.forEach((column, i) => flipColumn(column, i * PC_WALL_STAGGER_MS));
  const doneId = window.setTimeout(onDone, PC_WALL_FLIP_MS + (count - 1) * PC_WALL_STAGGER_MS + DONE_BUFFER_MS);

  return () => {
    window.clearTimeout(doneId);
    columns.forEach((column) => column.remove());
    backdrop.style.cssText = prevCss;
  };
};
