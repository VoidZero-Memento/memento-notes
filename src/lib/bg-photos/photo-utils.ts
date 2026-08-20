const OSS_HOST_RE = /\.aliyuncs\.com/i;
const OSS_BG_PROCESS = "x-oss-process=image/resize,w_720/quality,q_55";
const OSS_GALLERY_PROCESS = "x-oss-process=image/resize,w_1440/quality,q_78/format,webp";
const OSS_SAT_PROCESS = "x-oss-process=image/resize,w_320/quality,q_58/format,webp";
const OSS_BACKDROP_PROCESS = "x-oss-process=image/resize,w_64/blur,r_30,s_30/quality,q_40/format,webp";
const OSS_HALL_THUMB_PROCESS = "x-oss-process=image/resize,w_480/quality,q_62/format,webp";
const OSS_HALL_PROBE_PROCESS = "x-oss-process=image/resize,w_32/quality,q_30/format,webp";
const OSS_HALL_BACKDROP_PROCESS = "x-oss-process=image/resize,w_720/blur,r_10,s_8/quality,q_55/format,webp";

const withOssProcess = (url: string, process: string): string => {
  if (!OSS_HOST_RE.test(url) || url.includes("x-oss-process")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${process}`;
};

/** 背景轮播用低清 OSS 参数，非 OSS 原样返回 */
export const toBgPhotoUrl = (url: string): string => withOssProcess(url, OSS_BG_PROCESS);

/** 展台主图：webp + 中等边长，切图时少解码 */
export const toGalleryPhotoUrl = (url: string): string => withOssProcess(url, OSS_GALLERY_PROCESS);

/** 心形卫星小图：约 2x 显示尺寸 */
export const toSatPhotoUrl = (url: string): string => withOssProcess(url, OSS_SAT_PROCESS);

/** 全屏氛围底：极小图 + OSS 模糊，避免浏览器 filter:blur */
export const toBackdropPhotoUrl = (url: string): string => withOssProcess(url, OSS_BACKDROP_PROCESS);

/** 画廊瀑布流缩略图：约 2x 列宽 */
export const toHallThumbUrl = (url: string): string => withOssProcess(url, OSS_HALL_THUMB_PROCESS);

/** 画廊比例探测：极小图，只读 naturalWidth/Height */
export const toHallProbeUrl = (url: string): string => withOssProcess(url, OSS_HALL_PROBE_PROCESS);

/** 画廊动态背景：轻模糊，能看出人物轮廓 */
export const toHallBackdropUrl = (url: string): string => withOssProcess(url, OSS_HALL_BACKDROP_PROCESS);

export const pickNextPhotoIndex = (length: number, lastIndex: number): number => {
  if (length <= 0) return -1;
  if (length === 1) return 0;
  let idx = Math.floor(Math.random() * length);
  let guard = 0;
  while (idx === lastIndex && guard < 12) {
    idx = Math.floor(Math.random() * length);
    guard += 1;
  }
  return idx;
};

export const preloadPhoto = (url: string, signal?: AbortSignal): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve({ width: 0, height: 0 });
      return;
    }
    const img = new Image();
    const finish = () => {
      img.onload = null;
      img.onerror = null;
      signal?.removeEventListener("abort", onAbort);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    const onAbort = () => finish();
    img.onload = finish;
    img.onerror = finish;
    signal?.addEventListener("abort", onAbort, { once: true });
    img.src = url;
  });

export const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const id = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(id);
      resolve();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
