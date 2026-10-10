import { useLayoutEffect } from "react";

import type { RefObject } from "react";
import type { RulerConfig, RulerMode } from "@/lib/ruler/ruler.types";
import type { RailRefs, RailState, RailTick } from "./ruler-rail.types";

/** 原站 gsap power3.out */
const POWER3_OUT = "cubic-bezier(0.215, 0.61, 0.355, 1)";

type Args = {
  ticks: RailTick[];
  mode: RulerMode;
  cfg: RulerConfig;
  refs: RefObject<RailRefs>;
  st: RefObject<RailState>;
  played: RefObject<boolean>;
};

/**
 * 刻度入场：scaleX 0→1、opacity 0→alpha，逐条 stagger（WAAPI 代替 gsap）。
 * 先把内联样式写成终态，动画只用 backwards fill，结束后不残留 fill，后续每帧写 style 才不会被动画覆盖。
 */
export const useRailIntro = ({ ticks, mode, cfg, refs, st, played }: Args) => {
  useLayoutEffect(() => {
    const state = st.current;
    const marks = refs.current.marks;
    ticks.forEach((tick, i) => {
      const mark = marks[i];
      if (!mark) return;
      mark.style.transform = "scaleX(1)";
      mark.style.opacity = String(tick.alpha);
    });

    if (mode === "static" || played.current || !ticks.length) {
      state.introDone = true;
      return;
    }

    state.introDone = false;
    const { introDur, introStagger } = cfg.motion;
    const animations: Animation[] = [];
    ticks.forEach((tick, i) => {
      const mark = marks[i];
      if (!mark) return;
      animations.push(
        mark.animate(
          [
            { transform: "scaleX(0)", opacity: 0 },
            { transform: "scaleX(1)", opacity: tick.alpha },
          ],
          { duration: introDur * 1000, delay: i * introStagger * 1000, easing: POWER3_OUT, fill: "backwards" },
        ),
      );
    });

    const last = animations[animations.length - 1];
    if (!last) {
      state.introDone = true;
      return;
    }
    // 只在真正播完时记账：StrictMode 下首轮会被 cleanup 取消，必须允许重播
    last.finished
      .then(() => {
        played.current = true;
        state.introDone = true;
      })
      .catch(() => {});

    return () => {
      for (const animation of animations) animation.cancel();
      state.introDone = true;
    };
  }, [ticks, mode, cfg, refs, st, played]);
};
