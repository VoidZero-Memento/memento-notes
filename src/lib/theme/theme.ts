export const THEME_IDS = ["1", "2", "3", "4", "5"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

/** 默认：原赛博霓虹 */
export const DEFAULT_THEME_ID: ThemeId = "2";

export const THEME_LABELS: Record<ThemeId, string> = {
  "1": "极光紫金",
  "2": "赛博霓虹",
  "3": "冰焰蓝橙",
  "4": "全息虹彩",
  "5": "激光红黑",
};

export const THEME_PREVIEWS: Record<ThemeId, string> = {
  "1": "linear-gradient(135deg, #a78bfa 0%, #f0abfc 50%, #fbbf24 100%)",
  "2": "linear-gradient(135deg, #00f0ff 0%, #7c5cff 48%, #ff2d95 100%)",
  "3": "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #fb923c 100%)",
  "4": "linear-gradient(135deg, #22d3ee 0%, #a855f7 48%, #f472b6 100%)",
  "5": "linear-gradient(135deg, #ff003c 0%, #ff6b00 55%, #ffffff 100%)",
};

export const THEME_STORAGE_KEY = "memento-notes:theme";

export const isThemeId = (value: string | null | undefined): value is ThemeId =>
  value != null && (THEME_IDS as readonly string[]).includes(value);

export const parseThemeId = (value: string | null | undefined): ThemeId =>
  isThemeId(value) ? value : DEFAULT_THEME_ID;

export const applyTheme = (themeId: ThemeId) => {
  document.documentElement.dataset.theme = themeId;
};

export const readStoredTheme = (): ThemeId => {
  try {
    return parseThemeId(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME_ID;
  }
};

export const persistTheme = (id: ThemeId): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // 隐私模式等场景下写入可能失败，静默忽略
  }
};
