import type { ScrollAnimator, ScrollToOptions } from "./ruler.types";

type Job =
  | { kind: "tween"; from: number; to: number; start: number; durMs: number; easing: (t: number) => number; onComplete?: () => void }
  | { kind: "lerp"; to: number; lerp: number; onComplete?: () => void };

const linear = (t: number) => t;

/** 替代 Lenis：只驱动一个滚动容器；用户 wheel/touch/键盘/容器内按下会立刻打断，避免与手势打架 */
export const createScrollAnimator = (container: HTMLElement): ScrollAnimator => {
  let raf = 0;
  let job: Job | null = null;
  let last = 0;

  const maxTop = () => Math.max(0, container.scrollHeight - container.clientHeight);

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    job = null;
  };

  const finish = (target: number, onComplete?: () => void) => {
    container.scrollTop = target;
    stop();
    onComplete?.();
  };

  const tick = (now: number) => {
    raf = 0;
    if (!job) return;
    const current = job;
    if (current.kind === "tween") {
      const t = Math.min(1, (now - current.start) / current.durMs);
      if (t >= 1) return finish(current.to, current.onComplete);
      container.scrollTop = current.from + (current.to - current.from) * current.easing(t);
    } else {
      // 按 60fps 等效帧率换算，使拖拽手感与帧率无关
      const dt = Math.min((now - last) / 1000, 0.1);
      const top = container.scrollTop;
      if (Math.abs(current.to - top) < 0.5) return finish(current.to, current.onComplete);
      container.scrollTop = top + (current.to - top) * (1 - (1 - current.lerp) ** (dt * 60));
    }
    last = now;
    raf = requestAnimationFrame(tick);
  };

  const scrollTo = (top: number, options: ScrollToOptions = {}) => {
    const { duration, easing = linear, lerp, onComplete, immediate } = options;
    const target = Math.max(0, Math.min(maxTop(), top));
    const wasRunning = job !== null;

    if (immediate || (!duration && !lerp)) {
      stop();
      container.scrollTop = target;
      onComplete?.();
      return;
    }

    const now = performance.now();
    if (lerp) {
      job = { kind: "lerp", to: target, lerp: Math.max(0.01, Math.min(1, lerp)), onComplete };
    } else {
      const from = container.scrollTop;
      if (from === target) return finish(target, onComplete);
      job = { kind: "tween", from, to: target, start: now, durMs: (duration ?? 0) * 1000, easing, onComplete };
    }
    if (!wasRunning) last = now;
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const interrupt = () => {
    if (job) stop();
  };

  container.addEventListener("wheel", interrupt, { passive: true });
  container.addEventListener("touchstart", interrupt, { passive: true });
  container.addEventListener("pointerdown", interrupt, { passive: true });
  window.addEventListener("keydown", interrupt, { passive: true });

  const destroy = () => {
    stop();
    container.removeEventListener("wheel", interrupt);
    container.removeEventListener("touchstart", interrupt);
    container.removeEventListener("pointerdown", interrupt);
    window.removeEventListener("keydown", interrupt);
  };

  return { scrollTo, stop, destroy };
};
