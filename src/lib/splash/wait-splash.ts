/** 首屏占位最少展示时长（从页面导航起算） */
export const SPLASH_MIN_MS = 3000;

/** banner 等待上限，超时后不再阻塞挂载 */
export const SPLASH_BANNER_TIMEOUT_MS = 10000;

/** 与 index.html 首屏 banner 一致 */
export const SPLASH_IMAGE_URL =
  "https://my-ledger.oss-cn-shenzhen.aliyuncs.com/banner163.png";

const loadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const waitBanner = () =>
  Promise.race([loadImage(SPLASH_IMAGE_URL), sleep(SPLASH_BANNER_TIMEOUT_MS)]);

/**
 * 等首屏 banner（含超时）就绪，且从导航起至少满 SPLASH_MIN_MS，再结束首屏占位。
 * 不等待 window.load；JS 执行后即可开始等待并挂载。
 * banner 1s 就绪 → 等到约 3s；banner 10s 就绪/超时 → 约显示 10s。
 */
export const waitForSplash = async () => {
  await waitBanner();
  const remain = Math.max(0, SPLASH_MIN_MS - performance.now());
  if (remain > 0) await sleep(remain);
};
