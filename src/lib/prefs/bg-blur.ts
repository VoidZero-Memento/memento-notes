export const BG_BLUR_STORAGE_KEY = "memento-notes:bg-blur";

/** 默认关闭背景磨砂，保留背景图直透 */
export const DEFAULT_BG_BLUR_ENABLED = false;

export const readStoredBgBlur = (): boolean => {
  try {
    const value = window.localStorage.getItem(BG_BLUR_STORAGE_KEY);
    if (value === null) return DEFAULT_BG_BLUR_ENABLED;
    return value === "1";
  } catch {
    return DEFAULT_BG_BLUR_ENABLED;
  }
};

export const persistBgBlur = (enabled: boolean): void => {
  try {
    window.localStorage.setItem(BG_BLUR_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // 隐私模式等场景下写入可能失败，静默忽略
  }
};
