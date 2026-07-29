import { useEffect, useState } from "react";

const DEFAULT_DURATION_MS = 180;

/** 控制面板挂载与可见性，关闭时先播 exit 再卸载 */
export const useAnimatedOpen = (open: boolean, durationMs = DEFAULT_DURATION_MS) => {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setMounted(false), reduceMotion ? 0 : durationMs);
    return () => clearTimeout(timer);
  }, [open, durationMs]);

  return { mounted, visible };
};
