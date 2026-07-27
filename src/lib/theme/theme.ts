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

export const isThemeId = (value: string | null | undefined): value is ThemeId =>
  value != null && (THEME_IDS as readonly string[]).includes(value);

export const parseThemeId = (value: string | null | undefined): ThemeId =>
  isThemeId(value) ? value : DEFAULT_THEME_ID;

export const applyTheme = (themeId: ThemeId) => {
  document.documentElement.dataset.theme = themeId;
};

export const readThemeFromSearch = (search = window.location.search): ThemeId => {
  const theme = new URLSearchParams(search).get("theme");
  return parseThemeId(theme);
};
