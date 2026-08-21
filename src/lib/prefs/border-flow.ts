export const BORDER_FLOW_STORAGE_KEY = "memento-notes:border-flow";

/** 默认开启描边流光效果 */
export const DEFAULT_BORDER_FLOW_ENABLED = true;

export const readStoredBorderFlow = (): boolean => {
  try {
    const value = window.localStorage.getItem(BORDER_FLOW_STORAGE_KEY);
    if (value === null) return DEFAULT_BORDER_FLOW_ENABLED;
    return value === "1";
  } catch {
    return DEFAULT_BORDER_FLOW_ENABLED;
  }
};

export const persistBorderFlow = (enabled: boolean): void => {
  try {
    window.localStorage.setItem(BORDER_FLOW_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // 隐私模式等场景下写入可能失败，静默忽略
  }
};
