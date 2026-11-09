import { useEffect, useRef } from "react";

import { SPLASH_EDGE_FINISH_MS, SPLASH_EDGE_TOP_HOLD_MS, SPLASH_LOAD_CAP, SPLASH_TICK_MS, drawSplashEdge, splashSimulatedProgress } from "@/lib/splash/splash-loading";

import type { RefObject } from "react";

type UseSplashEdgeOptions = {
  enabled: boolean;
  finishing: boolean;
  /** 画面上的进度已经画到顶点 */
  onFinished?: () => void;
};

/** 贴边进度：等待时爬到 90%，收尾画到顶点后再通知退场。减少动效时不绘制。 */
export const useSplashEdge = (
  rootRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  { enabled, finishing, onFinished }: UseSplashEdgeOptions,
) => {
  const finishingRef = useRef(finishing);
  const onFinishedRef = useRef(onFinished);
  finishingRef.current = finishing;
  onFinishedRef.current = onFinished;

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) {
      if (finishingRef.current) onFinishedRef.current?.();
      return;
    }

    let progress = 0;
    let shown = 0;
    let mode: "wait" | "finish" = "wait";
    let from = 0;
    let startedAt = performance.now();
    let settled = false;
    let settleTimer = 0;
    const size = { w: 0, h: 0 };

    const settle = () => {
      if (settled) return;
      settled = true;
      settleTimer = window.setTimeout(() => onFinishedRef.current?.(), SPLASH_EDGE_TOP_HOLD_MS);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size.w = root.clientWidth;
      size.h = root.clientHeight;
      canvas.width = Math.max(1, Math.round(size.w * dpr));
      canvas.height = Math.max(1, Math.round(size.h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = () => {
      if (finishingRef.current && mode !== "finish") {
        mode = "finish";
        from = Math.min(SPLASH_LOAD_CAP, progress);
        progress = from;
        startedAt = performance.now();
      }
      const elapsed = performance.now() - startedAt;
      if (mode === "wait") {
        progress = Math.min(SPLASH_LOAD_CAP, splashSimulatedProgress(elapsed));
        return;
      }
      const t = Math.min(1, elapsed / SPLASH_EDGE_FINISH_MS);
      progress = from + (100 - from) * t;
    };

    resize();
    const timer = window.setInterval(tick, SPLASH_TICK_MS);
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
    observer?.observe(root);
    if (!observer) window.addEventListener("resize", resize);

    let frame = 0;
    const render = (time: number) => {
      const follow = mode === "finish" ? 0.42 : 0.18;
      shown += (progress - shown) * follow;
      if (mode === "finish" && progress >= 100) shown = 100;
      if (size.w > 0 && size.h > 0) drawSplashEdge(ctx, size.w, size.h, shown / 100, time);
      if (shown >= 100) settle();
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(settleTimer);
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      if (!observer) window.removeEventListener("resize", resize);
    };
  }, [canvasRef, enabled, rootRef]);
};
