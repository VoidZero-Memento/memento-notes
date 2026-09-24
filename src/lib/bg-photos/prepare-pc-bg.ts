import { prepareMobileBgTransition } from "@/lib/bg-photos/prepare-mobile-bg";

import type { PreparedMobileBg } from "@/lib/bg-photos/prepare-mobile-bg";

/**
 * PC 正文底与手机共用当前图集。预载首张，交给轮播层接手。
 * 展示差异在 PcBgCarousel，不改手机铺满逻辑。
 */
export const preparePcBgTransition = (signal?: AbortSignal): Promise<PreparedMobileBg | null> =>
  prepareMobileBgTransition(signal);
