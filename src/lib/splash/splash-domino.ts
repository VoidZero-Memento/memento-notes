import { PC_WALL_FLIP_MS } from "@/lib/bg-photos/constants";

const FLIP_EASING = "cubic-bezier(0.55, 0, 0.8, 0.4)";
const FLIP_PERSPECTIVE = "perspective(1200px)";
export const DONE_BUFFER_MS = 60;

export const freezeMotion = (el: Element | null) => {
  if (!(el instanceof HTMLElement)) return null;
  const computed = getComputedStyle(el);
  const { transform, opacity } = computed;
  el.style.animation = "none";
  el.style.opacity = opacity;
  el.style.transform = transform;
  return el;
};

export const createColumn = (banners: HTMLElement, index: number, count: number) => {
  const left = (index / count) * 100;
  const right = 100 - ((index + 1) / count) * 100;
  const clone = banners.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  clone.style.visibility = "visible";

  const column = document.createElement("div");
  column.setAttribute("aria-hidden", "true");
  column.style.cssText = [
    "position:absolute",
    "inset:0",
    "z-index:1",
    "pointer-events:none",
    "backface-visibility:hidden",
    "will-change:transform,filter",
    `clip-path:inset(0 ${right}% 0 ${left}%)`,
    `transform-origin:${((index + 0.5) / count) * 100}% 100%`,
    `transform:${FLIP_PERSPECTIVE} rotateX(0deg)`,
  ].join(";");
  column.appendChild(clone);
  return column;
};

export const flipColumn = (column: HTMLElement, delay: number) => {
  window.setTimeout(() => {
    column.style.transition = `transform ${PC_WALL_FLIP_MS}ms ${FLIP_EASING}, filter ${PC_WALL_FLIP_MS}ms ${FLIP_EASING}`;
    column.style.transform = `${FLIP_PERSPECTIVE} rotateX(100deg)`;
    column.style.filter = "brightness(.55)";
  }, delay);
};
