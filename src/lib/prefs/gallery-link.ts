export const GALLERY_LINK_STORAGE_KEY = "memento-notes:gallery-link";

/** 默认隐藏展台 / 画廊入口 */
export const DEFAULT_GALLERY_LINK_ENABLED = false;

export const readStoredGalleryLink = (): boolean => {
  try {
    const value = window.localStorage.getItem(GALLERY_LINK_STORAGE_KEY);
    if (value === null) return DEFAULT_GALLERY_LINK_ENABLED;
    return value === "1";
  } catch {
    return DEFAULT_GALLERY_LINK_ENABLED;
  }
};

export const persistGalleryLink = (enabled: boolean): void => {
  try {
    window.localStorage.setItem(GALLERY_LINK_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // 隐私模式等场景下写入可能失败，静默忽略
  }
};
