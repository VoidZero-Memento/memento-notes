import { useEffect, useRef } from "react";

type FrameCallback = (now: number, dtMs: number) => void;

const MAX_DT_MS = 100;

/** active=false 或页面隐藏时完全停掉 rAF，回到前台后 dt 从头算，避免一帧巨跳 */
export const useRafLoop = (callback: FrameCallback, active: boolean) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, MAX_DT_MS) : 16;
      last = now;
      callbackRef.current(now, dt);
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active]);
};
