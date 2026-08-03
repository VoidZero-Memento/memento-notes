import { VIEWER_BG_IMAGE_URL } from "@/lib/prefs/sidebar-bg";

/** 首屏占位最少展示时长（从页面导航起算） */
export const SPLASH_MIN_MS = 3000;

export const SPLASH_IMAGE_URL = VIEWER_BG_IMAGE_URL;

const loadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });

const waitDocumentComplete = () => {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
};

const sleep = (ms: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, ms);
});

/**
 * 等页面资源就绪，且从导航起至少满 SPLASH_MIN_MS，再结束首屏占位。
 * 资源 1s 完 → 等到 3s；资源 10s 完 → 显示约 10s。
 */
export const waitForSplash = async () => {
  await Promise.all([loadImage(SPLASH_IMAGE_URL), waitDocumentComplete(), document.fonts.ready]);
  const remain = Math.max(0, SPLASH_MIN_MS - performance.now());
  if (remain > 0) await sleep(remain);
};
