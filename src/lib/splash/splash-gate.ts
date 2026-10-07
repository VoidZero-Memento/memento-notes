import { dismissSplashDomino } from "@/lib/splash/splash-domino";
import { requestSplashHandoff } from "@/lib/splash/splash-handoff";

let painted = false;
const waiters: Array<() => void> = [];

let entryPainted = false;
const entryWaiters: Array<() => void> = [];

const ENTRY_PAINT_TIMEOUT_MS = 12000;

/** 整页底图第一帧已画上（或无需底图） */
export const notifyAppBgPainted = () => {
  if (painted) return;
  painted = true;
  while (waiters.length) waiters.pop()?.();
};

export const waitAppBgPainted = () =>
  painted ? Promise.resolve() : new Promise<void>((resolve) => waiters.push(resolve));

/** 入口页（正文路由 / 门闸 / 失败页）已提交绘制 */
export const notifyEntryPainted = () => {
  if (entryPainted) return;
  entryPainted = true;
  while (entryWaiters.length) entryWaiters.pop()?.();
};

export const waitEntryPainted = () => {
  if (entryPainted) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, ENTRY_PAINT_TIMEOUT_MS);
    entryWaiters.push(() => {
      window.clearTimeout(timer);
      resolve();
    });
  });
};

const removeSplash = () => {
  delete document.documentElement.dataset.splash;
  document.getElementById("app-splash")?.remove();
};

/** 与 index.html 退场时长一致 */
const PC_SPLASH_DISSOLVE_DELAY_MS = 700;
const PC_SPLASH_DISSOLVE_MS = 880;
const MOBILE_SPLASH_FADE_MS = 520;

const freezeMotion = (el: Element | null) => {
  if (!(el instanceof HTMLElement)) return;
  const computed = getComputedStyle(el);
  const { transform, opacity } = computed;
  el.style.animation = "none";
  el.style.opacity = opacity;
  el.style.transform = transform;
};

const watchOpacityEnd = (splash: HTMLElement, finish: () => void) => {
  splash.addEventListener("transitionend", (event) => {
    if (event.target !== splash || event.propertyName !== "opacity") return;
    finish();
  });
};

const dismissSplashPcFallback = (splash: HTMLElement) => {
  freezeMotion(splash.querySelector(".splash-stage"));
  freezeMotion(splash.querySelector(".splash-banners"));
  void splash.offsetWidth;
  splash.classList.add("is-leave");

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    removeSplash();
  };

  window.setTimeout(() => {
    if (!splash.isConnected) return;
    splash.classList.add("is-dissolve");
  }, PC_SPLASH_DISSOLVE_DELAY_MS);

  watchOpacityEnd(splash, finish);
  window.setTimeout(finish, PC_SPLASH_DISSOLVE_DELAY_MS + PC_SPLASH_DISSOLVE_MS + 120);
};

const dismissSplashPc = (splash: HTMLElement) => {
  if (dismissSplashDomino(splash, removeSplash)) return;
  dismissSplashPcFallback(splash);
};

const dismissSplashMobile = async (splash: HTMLElement) => {
  splash.dataset.leaving = "1";
  const banner = splash.querySelector<HTMLImageElement>(".splash-banner.is-on");
  const url = banner?.currentSrc || banner?.src;
  if (url) await requestSplashHandoff(url);
  if (!splash.isConnected) return;

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    removeSplash();
  };
  splash.style.transitionDuration = `${MOBILE_SPLASH_FADE_MS}ms`;
  splash.classList.add("is-leave");
  watchOpacityEnd(splash, finish);
  window.setTimeout(finish, MOBILE_SPLASH_FADE_MS + 80);
};

export const dismissSplash = () => {
  const splash = document.getElementById("app-splash");
  if (!splash) {
    removeSplash();
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    removeSplash();
    return;
  }
  if (window.matchMedia("(min-width: 861px)").matches) {
    dismissSplashPc(splash);
    return;
  }
  void dismissSplashMobile(splash);
};
