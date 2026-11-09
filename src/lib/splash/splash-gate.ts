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

/** 开屏在 index.html 里把进度补到 100% 后自行淡出；这里只通知它可以收尾 */
export const dismissSplash = () => {
  const splash = document.getElementById("app-splash");
  if (!splash) return;
  if (splash.dataset.armed === "1") {
    splash.dispatchEvent(new Event("memento-splash-ready"));
    return;
  }
  splash.remove();
};
