import { useCallback, useEffect, useRef, useState } from "react";

import {
  CHROME_SWIPE_AXIS_RATIO,
  CHROME_SWIPE_EDGE_PX,
  CHROME_SWIPE_LOCK_PX,
  CHROME_SWIPE_MS,
  CHROME_SWIPE_RUBBER,
  CHROME_SWIPE_SETTLE,
  CHROME_SWIPE_TAP_PX,
  CHROME_SWIPE_VELOCITY,
} from "./constants";
import { shouldYieldChromeSwipe } from "./should-yield";

import type { ChromeSwipeApi, ChromeSwipeOptions } from "./chrome-swipe.types";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const rubber = (value: number) => {
  if (value < 0) return value * CHROME_SWIPE_RUBBER;
  if (value > 1) return 1 + (value - 1) * CHROME_SWIPE_RUBBER;
  return value;
};

export const useChromeSwipe = ({
  enabled,
  blocked = false,
  onClearTap,
}: ChromeSwipeOptions): ChromeSwipeApi => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [cleared, setCleared] = useState(false);

  const progressRef = useRef(0);
  const draggingRef = useRef(false);
  const clearedRef = useRef(false);
  const blockedRef = useRef(blocked);
  const onClearTapRef = useRef(onClearTap);
  const rafRef = useRef(0);
  const suppressClickRef = useRef(false);

  progressRef.current = progress;
  clearedRef.current = cleared;
  blockedRef.current = blocked;
  onClearTapRef.current = onClearTap;

  const cancelAnim = () => {
    window.cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  };

  const settleTo = useCallback((target: 0 | 1) => {
    cancelAnim();
    const from = progressRef.current;
    const snap = () => {
      progressRef.current = target;
      setProgress(target);
      setDragging(false);
      draggingRef.current = false;
      setCleared(target === 1);
    };

    if (reduceMotion() || Math.abs(from - target) < 0.002) {
      snap();
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / CHROME_SWIPE_MS);
      const next = from + (target - from) * easeOutCubic(t);
      progressRef.current = next;
      setProgress(next);
      if (t < 1) {
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }
      snap();
    };
    rafRef.current = window.requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (enabled) return;
    cancelAnim();
    progressRef.current = 0;
    setProgress(0);
    setDragging(false);
    draggingRef.current = false;
    setCleared(false);
  }, [enabled]);

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el || !enabled) return;

    let tracking = false;
    let axis: "x" | "y" | null = null;
    let startX = 0;
    let startY = 0;
    let startProgress = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let pointerId = -1;

    const stopDrag = () => {
      tracking = false;
      axis = null;
      draggingRef.current = false;
      setDragging(false);
      if (pointerId >= 0) {
        try {
          el.releasePointerCapture(pointerId);
        } catch {
          /* already released */
        }
        pointerId = -1;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (blockedRef.current || event.button !== 0) return;
      if (event.clientX < CHROME_SWIPE_EDGE_PX) return;
      if (shouldYieldChromeSwipe(event.target, el)) return;
      cancelAnim();
      tracking = true;
      axis = null;
      startX = event.clientX;
      startY = event.clientY;
      lastX = event.clientX;
      lastT = event.timeStamp;
      velocity = 0;
      startProgress = progressRef.current;
      pointerId = event.pointerId;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!tracking || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const dt = event.timeStamp - lastT;
      if (dt > 0) velocity = (event.clientX - lastX) / dt;
      lastX = event.clientX;
      lastT = event.timeStamp;

      if (!axis) {
        if (Math.hypot(dx, dy) < CHROME_SWIPE_LOCK_PX) return;
        axis = Math.abs(dx) > Math.abs(dy) * CHROME_SWIPE_AXIS_RATIO ? "x" : "y";
        if (axis === "y") {
          tracking = false;
          return;
        }
        draggingRef.current = true;
        setDragging(true);
        suppressClickRef.current = true;
        try {
          el.setPointerCapture(pointerId);
        } catch {
          /* ignore */
        }
      }

      if (axis !== "x") return;
      const width = el.clientWidth || window.innerWidth;
      const next = rubber(startProgress - dx / width);
      progressRef.current = next;
      setProgress(next);
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (!tracking || event.pointerId !== pointerId) return;
      const wasX = axis === "x";
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      stopDrag();

      if (!wasX) {
        if (
          clearedRef.current &&
          Math.hypot(dx, dy) < CHROME_SWIPE_TAP_PX
        ) {
          onClearTapRef.current?.();
        }
        return;
      }

      const current = progressRef.current;
      let target: 0 | 1 = current >= CHROME_SWIPE_SETTLE ? 1 : 0;
      if (velocity < -CHROME_SWIPE_VELOCITY) target = 1;
      else if (velocity > CHROME_SWIPE_VELOCITY) target = 0;
      settleTo(target);
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClickRef.current) return;
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    };

    const onTouchMove = (event: TouchEvent) => {
      if (axis === "x") event.preventDefault();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerEnd);
    el.addEventListener("pointercancel", onPointerEnd);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      cancelAnim();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerEnd);
      el.removeEventListener("pointercancel", onPointerEnd);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [enabled, settleTo]);

  return { surfaceRef, progress, dragging, cleared };
};
