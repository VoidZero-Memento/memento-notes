import { PC_BG_URLS } from "@/lib/bg-photos/constants";

/** 首屏占位最少展示时长（从页面导航起算） */
export const SPLASH_MIN_MS = 3000;

/** banner 等待上限，超时后不再阻塞挂载 */
export const SPLASH_BANNER_TIMEOUT_MS = 10000;

const SPLASH_IMAGE_MOBILE =
  "https://memento-static.oss-cn-shenzhen.aliyuncs.com/lite-loading-background1.png";
const SPLASH_IMAGE_PC =
  "https://memento-static.oss-cn-shenzhen.aliyuncs.com/notes-background2.png";

type SplashBoot = {
  urls: string[];
  index: number;
};

const readSplashBoot = (): SplashBoot | undefined => {
  const boot = (window as Window & { __MEMENTO_SPLASH__?: SplashBoot }).__MEMENTO_SPLASH__;
  if (!boot?.urls?.length) return undefined;
  return boot;
};

/** 与 index.html 首屏当前帧一致 */
export const SPLASH_IMAGE_URL = () => {
  const boot = readSplashBoot();
  const url = boot?.urls[boot.index];
  if (url) return url;
  return window.matchMedia("(min-width: 861px)").matches ? SPLASH_IMAGE_PC : SPLASH_IMAGE_MOBILE;
};

const loadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    const finish = () => resolve();
    const onReady = () => {
      if (typeof img.decode === "function") {
        void img.decode().then(finish, finish);
        return;
      }
      finish();
    };
    img.onload = onReady;
    img.onerror = finish;
    img.src = src;
  });

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const waitBanner = () =>
  Promise.race([
    loadImage(SPLASH_IMAGE_URL()),
    sleep(SPLASH_BANNER_TIMEOUT_MS),
  ]);

const preparePageBg = () => {
  if (window.matchMedia("(max-width: 860px)").matches) {
    return import("@/lib/bg-photos/prepare-mobile-bg").then((m) => m.prepareMobileBgTransition());
  }
  return import("@/lib/bg-photos/photo-utils").then((m) => m.preloadPhoto(PC_BG_URLS[0]));
};

/**
 * 等首屏 banner（含超时）与整页底图首帧预载就绪，且从导航起至少满 SPLASH_MIN_MS。
 * 不再阻塞 React 挂载；由 splash-gate 在底图画上后再摘掉 splash。
 */
export const waitForSplash = async () => {
  await Promise.all([waitBanner(), preparePageBg()]);
  const remain = Math.max(0, SPLASH_MIN_MS - performance.now());
  if (remain > 0) await sleep(remain);
};
