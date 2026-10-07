import { PC_WALL_FLIP_MS, PC_WALL_STAGGER_MS } from "@/lib/bg-photos/constants";

const FLIP_EASING = "cubic-bezier(0.55, 0, 0.8, 0.4)";
const FLIP_PERSPECTIVE = "perspective(1200px)";
const DONE_BUFFER_MS = 60;

const freezeMotion = (el: Element | null) => {
  if (!(el instanceof HTMLElement)) return null;
  const computed = getComputedStyle(el);
  const { transform, opacity } = computed;
  el.style.animation = "none";
  el.style.opacity = opacity;
  el.style.transform = transform;
  return el;
};

/** 冻结每张横幅当前的淡入淡出进度，避免克隆后跳帧 */
const freezeBanners = (banners: HTMLElement) => {
  banners.querySelectorAll<HTMLElement>(".splash-banner").forEach((img) => {
    img.style.opacity = getComputedStyle(img).opacity;
    img.style.transition = "none";
  });
};

const createColumn = (banners: HTMLElement, index: number, count: number) => {
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

const flipColumn = (column: HTMLElement, delay: number) => {
  window.setTimeout(() => {
    column.style.transition = `transform ${PC_WALL_FLIP_MS}ms ${FLIP_EASING}, filter ${PC_WALL_FLIP_MS}ms ${FLIP_EASING}`;
    column.style.transform = `${FLIP_PERSPECTIVE} rotateX(100deg)`;
    column.style.filter = "brightness(.55)";
  }, delay);
};

/** PC 加载图退场：按图墙列数把横幅切成列，从左到右倒牌；不可执行时不改 DOM 并返回 false */
export const dismissSplashDomino = (splash: HTMLElement, onDone: () => void): boolean => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const count = document.querySelectorAll("[data-pc-wall-tile]").length;
  if (count <= 0) return false;
  const stageEl = splash.querySelector(".splash-stage");
  const bannersEl = splash.querySelector(".splash-banners");
  if (!(stageEl instanceof HTMLElement) || !(bannersEl instanceof HTMLElement)) return false;

  const stage = freezeMotion(stageEl);
  const banners = freezeMotion(bannersEl);
  if (!stage || !banners) return false;
  freezeBanners(banners);

  const columns = Array.from({ length: count }, (_, i) => createColumn(banners, i, count));
  let anchor: Element = banners;
  columns.forEach((column) => {
    anchor.after(column);
    anchor = column;
  });
  banners.style.visibility = "hidden";

  splash.dataset.leaving = "1";
  splash.style.background = "transparent";
  splash.classList.add("is-domino", "is-leave");
  void splash.offsetWidth;

  columns.forEach((column, i) => flipColumn(column, i * PC_WALL_STAGGER_MS));
  window.setTimeout(onDone, PC_WALL_FLIP_MS + (count - 1) * PC_WALL_STAGGER_MS + DONE_BUFFER_MS);
  return true;
};
