const OSS_HOST_RE = /\.aliyuncs\.com/i;
const OSS_BG_PROCESS = "x-oss-process=image/resize,w_720/quality,q_55";

/** 背景轮播用低清 OSS 参数，非 OSS 原样返回 */
export const toBgPhotoUrl = (url: string): string => {
  if (!OSS_HOST_RE.test(url) || url.includes("x-oss-process")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${OSS_BG_PROCESS}`;
};

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

export const preloadPhoto = (url: string, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const img = new Image();
    const finish = () => {
      img.onload = null;
      img.onerror = null;
      signal?.removeEventListener("abort", onAbort);
      resolve();
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
