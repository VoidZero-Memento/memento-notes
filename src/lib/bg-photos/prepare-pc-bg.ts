import { MOBILE_BG_PREPARE_TIMEOUT_MS, MOBILE_BG_TRANSITION_MIN_MS, PC_PAGE_BG_URL } from "@/lib/bg-photos/constants";
import { preloadPhoto, sleep } from "@/lib/bg-photos/photo-utils";

let prepared: string | null = null;

export const takePreparedPcBg = (): string | null => {
  const next = prepared;
  prepared = null;
  return next;
};

/** 预载 PC 固定底图。开启背景时由 splash 调用。 */
export const preparePcBgTransition = async (signal?: AbortSignal): Promise<string | null> => {
  const started = performance.now();

  try {
    await Promise.race([preloadPhoto(PC_PAGE_BG_URL, signal), sleep(MOBILE_BG_PREPARE_TIMEOUT_MS, signal)]);

    if (signal?.aborted) {
      const remain = Math.max(0, MOBILE_BG_TRANSITION_MIN_MS - (performance.now() - started));
      if (remain > 0) await sleep(remain, signal);
      return null;
    }

    prepared = PC_PAGE_BG_URL;

    const remain = Math.max(0, MOBILE_BG_TRANSITION_MIN_MS - (performance.now() - started));
    if (remain > 0) await sleep(remain, signal);

    if (signal?.aborted) return null;
    return prepared;
  } catch {
    const remain = Math.max(0, MOBILE_BG_TRANSITION_MIN_MS - (performance.now() - started));
    if (remain > 0) await sleep(remain, signal);
    return null;
  }
};
