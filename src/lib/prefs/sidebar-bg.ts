export const SIDEBAR_BG_STORAGE_KEY = "memento-notes:sidebar-bg";

/** 默认关闭；用户手动开启后写入 localStorage */
export const DEFAULT_SIDEBAR_BG_ENABLED = false;

/** 蒙层退场动画时长（需与 CSS transition 对齐） */
export const BG_TRANSITION_EXIT_MS = 720;

/** PC 开启背景。蒙层先盖住正文，首帧就位后再揭开。ENTER / EXIT 是淡入淡出时长。 */
export const PC_BG_ENTER_MS = 880;
export const PC_BG_EXIT_MS = 920;

/** 点击切换后的真实等待蒙层。PC 走多米诺倒牌，手机直接淡出。 */
export const CRAWL_PC_LEAVE_DELAY_MS = 700;
export const CRAWL_PC_DISSOLVE_MS = 880;
export const CRAWL_MOBILE_FADE_MS = 520;

export const getCrawlLeaveDelayMs = (isMobile: boolean) => (isMobile ? 0 : CRAWL_PC_LEAVE_DELAY_MS);
export const getCrawlDissolveMs = (isMobile: boolean) =>
  isMobile ? CRAWL_MOBILE_FADE_MS : CRAWL_PC_DISSOLVE_MS;
/** PC 优先走多米诺倒牌（时长随图墙列数变化），挂载上限留足余量；溶解兜底只用其中一部分 */
export const CRAWL_PC_MOUNT_MS = 2400;

export const getCrawlExitMs = (isMobile: boolean) =>
  isMobile ? CRAWL_MOBILE_FADE_MS : CRAWL_PC_MOUNT_MS;

export const readStoredSidebarBg = (): boolean => {
  try {
    const value = window.localStorage.getItem(SIDEBAR_BG_STORAGE_KEY);
    if (value === null) return DEFAULT_SIDEBAR_BG_ENABLED;
    return value === "1";
  } catch {
    return DEFAULT_SIDEBAR_BG_ENABLED;
  }
};

export const persistSidebarBg = (enabled: boolean): void => {
  try {
    window.localStorage.setItem(SIDEBAR_BG_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // 隐私模式等场景下写入可能失败，静默忽略
  }
};
