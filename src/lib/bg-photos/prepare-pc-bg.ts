import { MOBILE_BG_PREPARE_TIMEOUT_MS, MOBILE_BG_TRANSITION_MIN_MS, PC_BG_STRIP_SIZE, PC_BG_URLS } from "@/lib/bg-photos/constants";
import { fetchGalleryBannerUrls } from "@/lib/bg-photos/images";
import { pickNextPhotoIndex, preloadPhoto, sleep, takePhotoStrip, toPcStripBgUrl } from "@/lib/bg-photos/photo-utils";

export type PreparedPcBg = {
  urls: string[];
  strip: string[];
  index: number;
};

let prepared: PreparedPcBg | null = null;

export const takePreparedPcBg = (): PreparedPcBg | null => {
  const next = prepared;
  prepared = null;
  return next;
};

const fallbackUrls = (): string[] => PC_BG_URLS.map(toPcStripBgUrl);

/**
 * 拉取图集 + 预载首组并排图。PC 开启背景时由 splash 调用。
 */
export const preparePcBgTransition = async (signal?: AbortSignal): Promise<PreparedPcBg | null> => {
  const started = performance.now();

  try {
    const list = await Promise.race([
      fetchGalleryBannerUrls(signal),
      sleep(MOBILE_BG_PREPARE_TIMEOUT_MS, signal).then(() => null),
    ]);

    const urls = list?.length ? list.map(toPcStripBgUrl) : fallbackUrls();
    if (signal?.aborted || !urls.length) {
      const remain = Math.max(0, MOBILE_BG_TRANSITION_MIN_MS - (performance.now() - started));
      if (remain > 0) await sleep(remain, signal);
      return null;
    }

    const index = pickNextPhotoIndex(urls.length, -1);
    const strip = takePhotoStrip(urls, index, PC_BG_STRIP_SIZE);
    await Promise.race([
      Promise.all(strip.map((url) => preloadPhoto(url, signal))),
      sleep(MOBILE_BG_PREPARE_TIMEOUT_MS, signal),
    ]);

    prepared = { urls, strip, index };

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
