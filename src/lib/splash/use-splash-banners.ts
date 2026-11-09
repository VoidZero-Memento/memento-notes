import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { SPLASH_BANNER_COUNT, SPLASH_BANNER_INTERVAL_MS, SPLASH_BANNER_RETRY_MS, SPLASH_BANNER_REVEAL_FALLBACK_MS } from "@/lib/splash/splash-loading";

import type { RefObject } from "react";

const pickRandomLoaded = (loaded: Set<number>, exclude: number) => {
  const candidates = [...loaded].filter((index) => index !== exclude);
  if (!candidates.length) return -1;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? -1;
};

/** 开屏同款图：先出 01，其余加载后每次随机切一张 */
export const useSplashBanners = (enabled: boolean, stageRef: RefObject<HTMLElement | null>) => {
  const [indexes, setIndexes] = useState<number[]>([0]);
  const [active, setActive] = useState(0);
  const loadedRef = useRef(new Set<number>());
  const restRef = useRef(false);
  const activeRef = useRef(0);

  const revealRest = useCallback(() => {
    if (restRef.current) return;
    restRef.current = true;
    setIndexes(Array.from({ length: SPLASH_BANNER_COUNT }, (_, index) => index));
  }, []);

  const onSettle = useCallback(
    (index: number, ok: boolean) => {
      if (ok) loadedRef.current.add(index);
      else loadedRef.current.delete(index);
      if (index === 0) revealRest();
    },
    [revealRest],
  );

  useLayoutEffect(() => {
    if (!enabled) return;
    const stage = stageRef.current;
    if (!stage) return;
    stage.querySelectorAll("img[data-index]").forEach((node) => {
      if (!(node instanceof HTMLImageElement) || !node.complete) return;
      onSettle(Number(node.dataset.index), node.naturalWidth > 0);
    });
  }, [enabled, indexes, onSettle, stageRef]);

  useEffect(() => {
    if (!enabled) return;
    let timer = 0;
    const advance = () => {
      const next = pickRandomLoaded(loadedRef.current, activeRef.current);
      if (next === -1) {
        timer = window.setTimeout(advance, SPLASH_BANNER_RETRY_MS);
        return;
      }
      activeRef.current = next;
      setActive(next);
      timer = window.setTimeout(advance, SPLASH_BANNER_INTERVAL_MS);
    };
    timer = window.setTimeout(advance, SPLASH_BANNER_INTERVAL_MS);
    const revealTimer = window.setTimeout(revealRest, SPLASH_BANNER_REVEAL_FALLBACK_MS);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(revealTimer);
    };
  }, [enabled, revealRest]);

  return { indexes, active, onSettle };
};
