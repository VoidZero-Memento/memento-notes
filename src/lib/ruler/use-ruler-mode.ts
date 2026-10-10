import { MOBILE_BG_MQ } from "@/lib/bg-photos/constants";
import { useMediaQuery } from "@/lib/dom/use-media-query";

import type { RulerMode } from "./ruler.types";

const FINE_POINTER_MQ = "(pointer: fine) and (hover: hover)";
const REDUCE_MOTION_MQ = "(prefers-reduced-motion: reduce)";

/** reduce-motion 优先于设备判断：静态模式去掉所有过渡 */
export const useRulerMode = (): RulerMode => {
  const reduceMotion = useMediaQuery(REDUCE_MOTION_MQ);
  const isMobile = useMediaQuery(MOBILE_BG_MQ);
  const finePointer = useMediaQuery(FINE_POINTER_MQ);

  if (reduceMotion) return "static";
  return isMobile || !finePointer ? "lite" : "full";
};
