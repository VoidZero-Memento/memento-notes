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
  document.getElementById("app-splash")?.remove();
};

/** 与 index.html #app-splash 的 opacity 过渡一致 */
const SPLASH_FADE_MS = 900;

const watchOpacityEnd = (splash: HTMLElement, finish: () => void) => {
  splash.addEventListener("transitionend", (event) => {
    if (event.target !== splash || event.propertyName !== "opacity") return;
    finish();
  });
};

/** 四季开屏整层淡出，底下的正文已经画好 */
export const dismissSplash = () => {
  const splash = document.getElementById("app-splash");
  if (!splash) {
    removeSplash();
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    removeSplash();
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    removeSplash();
  };

  splash.classList.add("is-leave");
  watchOpacityEnd(splash, finish);
  window.setTimeout(finish, SPLASH_FADE_MS + 120);
};
