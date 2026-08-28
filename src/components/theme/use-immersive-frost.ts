import { useEffect, useState } from "react";

import { IMMERSIVE_MS, useImmersive } from "@/components/theme/ImmersiveLayer";

const REDUCED_MQ = "(prefers-reduced-motion: reduce)";

/** 高清层晚一帧挂上、退出后再留一拍，让清晰↔磨砂走 opacity/filter 过渡 */
export const useImmersiveFrost = () => {
  const immersive = useImmersive();
  const [frostOff, setFrostOff] = useState(false);
  const [sharpOn, setSharpOn] = useState(false);

  useEffect(() => {
    if (window.matchMedia(REDUCED_MQ).matches) {
      setFrostOff(immersive);
      setSharpOn(immersive);
      return;
    }

    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;
    if (immersive) {
      setSharpOn(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (!cancelled) setFrostOff(true);
        });
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    setFrostOff(false);
    const timeout = window.setTimeout(() => setSharpOn(false), IMMERSIVE_MS);
    return () => window.clearTimeout(timeout);
  }, [immersive]);

  return { frostOff, sharpOn };
};
