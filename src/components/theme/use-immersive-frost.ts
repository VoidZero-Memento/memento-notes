import { useEffect, useState } from "react";

import { useImmersive } from "@/components/theme/ImmersiveLayer";

const REDUCED_MQ = "(prefers-reduced-motion: reduce)";

/** 高清层晚一帧挂上再开过渡；退出只关 class，图层由轮播槽自己按 url 留着淡出 */
export const useImmersiveFrost = (immersiveSource?: boolean) => {
  const layerImmersive = useImmersive();
  const immersive = immersiveSource ?? layerImmersive;
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
    setSharpOn(false);
  }, [immersive]);

  return { frostOff, sharpOn };
};
