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

/** 与 index.html PC 退场时长一致：先收回漂移，再把整层淡进正文 */
const PC_SPLASH_SETTLE_MS = 760;
const PC_SPLASH_DISSOLVE_DELAY_MS = 700;
const PC_SPLASH_DISSOLVE_MS = 880;

const identityOf = (frozen: string) =>
  frozen.includes("matrix3d")
    ? "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)"
    : "matrix(1, 0, 0, 1, 0, 0)";

const freezeMotion = (el: Element | null) => {
  if (!(el instanceof HTMLElement)) return null;
  const computed = getComputedStyle(el);
  const frozen = computed.transform;
  const opacity = computed.opacity;
  el.style.animation = "none";
  el.style.opacity = opacity;
  el.style.transform = frozen;
  return el;
};

const dismissSplashPc = (splash: HTMLElement) => {
  const stage = freezeMotion(splash.querySelector(".splash-stage"));
  const motion = freezeMotion(splash.querySelector(".splash-banners"));
  void splash.offsetWidth;
  const transition = `transform ${PC_SPLASH_SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  for (const el of [stage, motion]) {
    if (!el) continue;
    const frozen = el.style.transform;
    if (!frozen || frozen === "none") continue;
    el.style.transition = transition;
    el.style.transform = identityOf(frozen);
  }

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

  splash.addEventListener("transitionend", (event) => {
    if (event.target !== splash || event.propertyName !== "opacity") return;
    finish();
  });
  window.setTimeout(finish, PC_SPLASH_DISSOLVE_DELAY_MS + PC_SPLASH_DISSOLVE_MS + 120);
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
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    removeSplash();
  };
  splash.classList.add("is-leave");
  splash.addEventListener("transitionend", (event) => {
    if (event.target !== splash || event.propertyName !== "opacity") return;
    finish();
  });
  window.setTimeout(finish, 360);
};
