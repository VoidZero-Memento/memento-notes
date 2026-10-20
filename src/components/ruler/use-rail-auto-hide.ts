import { useCallback, useEffect, useRef } from "react";

import type { RefObject } from "react";
import type { RailRefs } from "./ruler-rail.types";

/** 停止滚动后多久淡出 */
const HIDE_DELAY_MS = 1500;

/**
 * 手机标尺的自动显隐：滚动（含程序化滚动）时给 rail 加 showClass，停止 HIDE_DELAY_MS 后移除。
 * 直接操作 classList，避免滚动期间触发 React 重渲染；返回的 poke 用于外部手动续期。
 */
export const useRailAutoHide = (enabled: boolean, scrollRef: RefObject<HTMLElement | null>, refs: RefObject<RailRefs>, showClass: string) => {
  const timer = useRef(0);

  const poke = useCallback(() => {
    const rail = refs.current.rail;
    if (!rail) return;
    rail.classList.add(showClass);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => rail.classList.remove(showClass), HIDE_DELAY_MS);
  }, [refs, showClass]);

  useEffect(() => {
    if (!enabled) return;
    const container = scrollRef.current;
    if (!container) return;
    // 刚出现时亮一下，提示用户这里有标尺
    poke();
    container.addEventListener("scroll", poke, { passive: true });
    return () => {
      container.removeEventListener("scroll", poke);
      window.clearTimeout(timer.current);
    };
  }, [enabled, scrollRef, poke]);

  return poke;
};
