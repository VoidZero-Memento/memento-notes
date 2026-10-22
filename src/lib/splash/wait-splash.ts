import { readStoredSidebarBg } from "@/lib/prefs/sidebar-bg";

/** 首屏占位最少展示时长（从页面导航起算） */
export const SPLASH_MIN_MS = 8000;

/** 四季底图等待上限，超时后不再阻塞退场 */
export const SPLASH_BANNER_TIMEOUT_MS = 10000;

const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

const SEASON_IMAGE_BASE = "https://memento-static.oss-cn-shenzhen.aliyuncs.com/common-images";

const seasonUrl = (name: (typeof SEASONS)[number]) => `${SEASON_IMAGE_BASE}/${name}.jpg`;

/** 气象季节：3–5 春，6–8 夏，9–11 秋，12–2 冬。与 index.html 开屏首帧一致 */
const seasonIndex = (month = new Date().getMonth()) => {
  if (month === 11 || month < 2) return 3;
  if (month < 5) return 0;
  if (month < 8) return 1;
  return 2;
};

export const SPLASH_IMAGE_URL = () => seasonUrl(SEASONS[seasonIndex()]);

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
    Promise.all(SEASONS.map((name) => loadImage(seasonUrl(name)))).then(() => undefined),
    sleep(SPLASH_BANNER_TIMEOUT_MS),
  ]);

const preparePageBg = () => {
  if (window.matchMedia("(max-width: 860px)").matches) {
    return import("@/lib/bg-photos/prepare-mobile-bg").then((m) => m.prepareMobileBgTransition());
  }
  return import("@/lib/bg-photos/prepare-pc-bg").then((m) => m.preparePcBgTransition());
};

/**
 * 等四季底图（含超时），背景开启时再等整页底图首帧，且从导航起至少满 SPLASH_MIN_MS。
 * 不再阻塞 React 挂载；由 splash-gate 在入口画上后再摘掉 splash。
 */
export const waitForSplash = async () => {
  const tasks: Array<Promise<unknown>> = [waitBanner()];
  if (readStoredSidebarBg()) tasks.push(preparePageBg());
  await Promise.all(tasks);
  const remain = Math.max(0, SPLASH_MIN_MS - performance.now());
  if (remain > 0) await sleep(remain);
};
