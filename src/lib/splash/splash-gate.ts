let painted = false;
const waiters: Array<() => void> = [];

/** 整页底图第一帧已画上（或无需底图） */
export const notifyAppBgPainted = () => {
  if (painted) return;
  painted = true;
  while (waiters.length) waiters.pop()?.();
};

export const waitAppBgPainted = () =>
  painted ? Promise.resolve() : new Promise<void>((resolve) => waiters.push(resolve));

export const dismissSplash = () => {
  delete document.documentElement.dataset.splash;
  document.getElementById("app-splash")?.remove();
};
