import { MOBILE_BG_PREPARE_TIMEOUT_MS, MOBILE_BG_TRANSITION_MIN_MS } from "@/lib/bg-photos/constants";
import { fetchGalleryBannerUrls } from "@/lib/bg-photos/images";
import { pickNextPhotoIndex, preloadPhoto, sleep, toBgPhotoUrl } from "@/lib/bg-photos/photo-utils";

export type PreparedMobileBg = {
  urls: string[];
  firstUrl: string;
  firstIndex: number;
};

/** 开启过渡期间预选的首图，供轮播层挂载时接手 */
let preparedFirstUrl: string | null = null;
let preparedFirstIndex = -1;

export const takePreparedMobileBg = (): { url: string; index: number } | null => {
  if (!preparedFirstUrl) return null;
  const result = { url: preparedFirstUrl, index: preparedFirstIndex };
  preparedFirstUrl = null;
  preparedFirstIndex = -1;
  return result;
};

/**
 * 拉取 images.json + 预加载首张图，总耗时不少于 MIN_MS。
 * 仅应在手机端、开启背景时调用。
 */
export const prepareMobileBgTransition = async (signal?: AbortSignal): Promise<PreparedMobileBg | null> => {
  const started = performance.now();

  try {
    const list = await Promise.race([
      fetchGalleryBannerUrls(signal),
      sleep(MOBILE_BG_PREPARE_TIMEOUT_MS, signal).then(() => null),
    ]);

    if (signal?.aborted || !list?.length) {
      const remain = Math.max(0, MOBILE_BG_TRANSITION_MIN_MS - (performance.now() - started));
      if (remain > 0) await sleep(remain, signal);
      return null;
    }

    const bgUrls = list.map(toBgPhotoUrl);
    const firstIndex = pickNextPhotoIndex(bgUrls.length, -1);
    const firstUrl = bgUrls[firstIndex] ?? bgUrls[0];

    await Promise.race([preloadPhoto(firstUrl, signal), sleep(MOBILE_BG_PREPARE_TIMEOUT_MS, signal)]);

    preparedFirstUrl = firstUrl;
    preparedFirstIndex = firstIndex;

    const remain = Math.max(0, MOBILE_BG_TRANSITION_MIN_MS - (performance.now() - started));
    if (remain > 0) await sleep(remain, signal);

    if (signal?.aborted) return null;
    return { urls: bgUrls, firstUrl, firstIndex };
  } catch {
    const remain = Math.max(0, MOBILE_BG_TRANSITION_MIN_MS - (performance.now() - started));
    if (remain > 0) await sleep(remain, signal);
    return null;
  }
};
