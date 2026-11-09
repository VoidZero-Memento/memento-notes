import { MOBILE_BG_PREPARE_TIMEOUT_MS, MOBILE_BG_TRANSITION_MIN_MS, PC_PAGE_BG_URL } from "@/lib/bg-photos/constants";
import { preloadPhoto, sleep } from "@/lib/bg-photos/photo-utils";

import type { PreparedMobileBg } from "@/lib/bg-photos/prepare-mobile-bg";

/** PC 正文底只预载这一张图，不拉手机壁纸清单 */
export const preparePcBgTransition = async (signal?: AbortSignal): Promise<PreparedMobileBg | null> => {
  const started = performance.now();
  try {
    await Promise.race([preloadPhoto(PC_PAGE_BG_URL, signal), sleep(MOBILE_BG_PREPARE_TIMEOUT_MS, signal)]);
    const remain = Math.max(0, MOBILE_BG_TRANSITION_MIN_MS - (performance.now() - started));
    if (remain > 0) await sleep(remain, signal);
    if (signal?.aborted) return null;
    return { urls: [PC_PAGE_BG_URL], firstUrl: PC_PAGE_BG_URL, firstIndex: 0 };
  } catch {
    const remain = Math.max(0, MOBILE_BG_TRANSITION_MIN_MS - (performance.now() - started));
    if (remain > 0) await sleep(remain, signal);
    return null;
  }
};
