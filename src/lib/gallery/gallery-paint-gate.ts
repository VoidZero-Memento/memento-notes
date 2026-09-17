import { GALLERY_FADE_MS, GALLERY_FADE_REDUCED_MS, GALLERY_FADE_TAIL_MS } from "@/lib/gallery/constants";

export const PAINT_WAIT_MS = 1800;

export const fadeLockMs = () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (reduced ? GALLERY_FADE_REDUCED_MS : GALLERY_FADE_MS) + GALLERY_FADE_TAIL_MS;
};

export const createPaintGate = () => {
  const painted = new Set<string>();
  const waiters = new Map<string, Array<() => void>>();

  const mark = (url: string) => {
    painted.add(url);
    const list = waiters.get(url);
    if (!list) return;
    waiters.delete(url);
    list.forEach((fn) => fn());
  };

  const wait = (url: string) => {
    if (painted.has(url)) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const list = waiters.get(url);
      if (list) list.push(resolve);
      else waiters.set(url, [resolve]);
    });
  };

  return {
    mark,
    wait,
    has: (url: string) => painted.has(url),
    forget: (url: string) => {
      painted.delete(url);
    },
    reset: () => {
      painted.clear();
      waiters.clear();
    },
  };
};
