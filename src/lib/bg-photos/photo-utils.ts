const OSS_HOST_RE = /\.aliyuncs\.com/i;
const OSS_SIDEBAR_BACKDROP_PROCESS = "x-oss-process=image/resize,w_200/quality,q_50/format,webp";
const OSS_HALL_PROBE_PROCESS = "x-oss-process=image/resize,w_32/quality,q_30/format,webp";
const OSS_HALL_BACKDROP_PROCESS = "x-oss-process=image/resize,w_720/blur,r_10,s_8/quality,q_55/format,webp";
const OSS_STAGE_BACKDROP_PROCESS = "x-oss-process=image/resize,w_1920/blur,r_8,s_6/quality,q_70/format,webp";

const withOssProcess = (url: string, process: string): string => {
  if (!OSS_HOST_RE.test(url) || url.includes("x-oss-process")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${process}`;
};

const stripOssProcess = (url: string): string => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("x-oss-process");
    return parsed.toString();
  } catch {
    return url.replace(/[?&]x-oss-process=[^&]*/g, "").replace(/[?&]$/, "");
  }
};

/** 原图：去掉所有 OSS 处理参数（缩放 / 压缩 / 转码），非 OSS 原样返回 */
export const toOriginalPhotoUrl = (url: string): string => (OSS_HOST_RE.test(url) ? stripOssProcess(url) : url);

/** 背景轮播：原图 */
export const toBgPhotoUrl = toOriginalPhotoUrl;

/** 侧栏前景图：原图 */
export const toSidebarPhotoUrl = toOriginalPhotoUrl;

/** 侧栏模糊底图：本来就要糊掉，用极小图省流量 */
export const toSidebarBackdropUrl = (url: string): string =>
  OSS_HOST_RE.test(url) ? withOssProcess(stripOssProcess(url), OSS_SIDEBAR_BACKDROP_PROCESS) : url;

/** 从 start 起取 size 张，清单不足时取全部，绕回不重复 */
export const takePhotoStrip = (urls: string[], start: number, size: number): string[] => {
  if (!urls.length || size <= 0) return [];
  const take = Math.min(size, urls.length);
  const origin = ((start % urls.length) + urls.length) % urls.length;
  return Array.from({ length: take }, (_, i) => urls[(origin + i) % urls.length]).filter((url): url is string => !!url);
};

/** 下一条带起始下标：图多于列数则整组前进，否则每次挪 1 张 */
export const nextStripStartIndex = (length: number, lastStart: number, size: number): number => {
  if (length <= 0) return -1;
  if (lastStart < 0) return 0;
  const step = length > size ? size : 1;
  return (lastStart + step) % length;
};

/** 手机沉浸看图：原图 */
export const toImmersiveBgUrl = toOriginalPhotoUrl;

/** PC 图墙 tile：原图 */
export const toPcWallPhotoUrl = toOriginalPhotoUrl;

/** 展台主图：原图 */
export const toGalleryPhotoUrl = toOriginalPhotoUrl;

/** 展台氛围底：高清轻糊，磨砂/滤镜由 CSS 叠加，切图只做透明度 */
export const toStageBackdropUrl = (url: string): string =>
  withOssProcess(stripOssProcess(url), OSS_STAGE_BACKDROP_PROCESS);

/** 心形卫星小图：原图 */
export const toSatPhotoUrl = toOriginalPhotoUrl;

/** 画廊瀑布流缩略图：原图 */
export const toHallThumbUrl = toOriginalPhotoUrl;

/** 画廊比例探测：极小图，只读 naturalWidth/Height */
export const toHallProbeUrl = (url: string): string => withOssProcess(url, OSS_HALL_PROBE_PROCESS);

/** 画廊动态背景：轻模糊，能看出人物轮廓 */
export const toHallBackdropUrl = (url: string): string => withOssProcess(url, OSS_HALL_BACKDROP_PROCESS);

/** 画廊 PC 背景：原图，磨砂由 GalleryFrost 叠加 */
export const toHallDesktopBackdropUrl = toOriginalPhotoUrl;

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

/** 轻触换图：按清单顺序下一张，避免随机乱跳 */
export const nextPhotoIndex = (length: number, lastIndex: number): number => {
  if (length <= 0) return -1;
  if (length === 1) return 0;
  return (lastIndex + 1 + length) % length;
};

/** 等页面上的 <img> 解码完成，避免 URL 已写入但像素还没画出来 */
export const waitImgElementPainted = (img: HTMLImageElement): Promise<void> =>
  new Promise((resolve) => {
    const finish = () => {
      if (typeof img.decode === "function") {
        void img.decode().then(() => resolve(), () => resolve());
        return;
      }
      resolve();
    };
    if (img.complete) {
      if (img.naturalWidth > 0) finish();
      else resolve();
      return;
    }
    const onDone = () => {
      img.removeEventListener("load", onDone);
      img.removeEventListener("error", onFail);
      finish();
    };
    const onFail = () => {
      img.removeEventListener("load", onDone);
      img.removeEventListener("error", onFail);
      resolve();
    };
    img.addEventListener("load", onDone);
    img.addEventListener("error", onFail);
  });

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
    const onReady = () => {
      if (typeof img.decode === "function") {
        void img.decode().then(finish, finish);
        return;
      }
      finish();
    };
    img.onload = onReady;
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
