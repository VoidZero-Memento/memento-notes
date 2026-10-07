import { useLayoutEffect, useRef, useState } from "react";

import type { WallSize } from "@/lib/bg-photos/bg-photos.types";
import type { RefObject } from "react";

const readWindowSize = (): WallSize => ({ width: window.innerWidth, height: window.innerHeight });

/**
 * 图墙容器尺寸：ResizeObserver + resize，rAF 合并；
 * sizeRef 始终是最新值，供异步流程同步读取。
 */
export const usePcWallViewport = (rootRef: RefObject<HTMLElement | null>) => {
  const [size, setSize] = useState<WallSize>(readWindowSize);
  const sizeRef = useRef<WallSize>(size);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const next = { width: root.clientWidth, height: root.clientHeight };
      if (next.width <= 0 || next.height <= 0) return;
      const prev = sizeRef.current;
      if (prev.width === next.width && prev.height === next.height) return;
      sizeRef.current = next;
      setSize(next);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(root);
    window.addEventListener("resize", schedule);
    measure();

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef]);

  return { size, sizeRef };
};
