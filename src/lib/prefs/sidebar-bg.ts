export const SIDEBAR_BG_STORAGE_KEY = "memento-notes:sidebar-bg";

/** 默认关闭；用户手动开启后写入 localStorage */
export const DEFAULT_SIDEBAR_BG_ENABLED = false;

/** 开启背景时全屏过渡蒙层展示时长，退场与画面运动重叠 */
export const BG_TRANSITION_HOLD_MS = 1680;

/** 蒙层退场动画时长（需与 CSS transition 对齐） */
export const BG_TRANSITION_EXIT_MS = 720;

/**
 * PC 开启背景。蒙层先盖住正文，再挂底图，画面收到与正文同一帧后才揭开。
 * 百分比写在 BgTransitionOverlay.module.css，三者和须与 keyframes 对齐。
 */
export const PC_BG_ENTER_MS = 880;
export const PC_BG_HOLD_MS = 1040;
export const PC_BG_EXIT_MS = 920;

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
