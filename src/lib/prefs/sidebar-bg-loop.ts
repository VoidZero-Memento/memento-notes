export const SIDEBAR_BG_LOOP_STORAGE_KEY = "memento-notes:sidebar-bg-loop";

/** 默认开启循环；关闭后停在当前图 */
export const DEFAULT_SIDEBAR_BG_LOOP = true;

export const readStoredSidebarBgLoop = (): boolean => {
  try {
    const value = window.localStorage.getItem(SIDEBAR_BG_LOOP_STORAGE_KEY);
    if (value === null) return DEFAULT_SIDEBAR_BG_LOOP;
    return value === "1";
  } catch {
    return DEFAULT_SIDEBAR_BG_LOOP;
  }
};

export const persistSidebarBgLoop = (looping: boolean): void => {
  try {
    window.localStorage.setItem(SIDEBAR_BG_LOOP_STORAGE_KEY, looping ? "1" : "0");
  } catch {
    // 隐私模式等场景下写入可能失败，静默忽略
  }
};
