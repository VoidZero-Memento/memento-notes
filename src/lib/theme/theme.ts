/** 按主题名拼音排序：冰 → 翠 → 琥 → 激 → 极 → 全 → 熔 → 赛 → 樱 */
export const THEME_IDS = ["3", "7", "8", "5", "1", "4", "9", "2", "6"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

/** 默认：原赛博霓虹 */
export const DEFAULT_THEME_ID: ThemeId = "2";

export const THEME_LABELS: Record<ThemeId, string> = {
  "3": "冰焰蓝橙",
  "7": "翠雾森岚",
  "8": "琥珀暖金",
  "5": "激光红黑",
  "1": "极光紫金",
  "4": "全息虹彩",
  "9": "熔金光环",
  "2": "赛博霓虹",
  "6": "樱花粉黛",
};

export const THEME_PREVIEWS: Record<ThemeId, string> = {
  "3": "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #fb923c 100%)",
  "7": "linear-gradient(135deg, #34d399 0%, #2dd4bf 48%, #a3e635 100%)",
  "8": "linear-gradient(135deg, #fbbf24 0%, #f59e0b 48%, #ea580c 100%)",
  "5": "linear-gradient(135deg, #ff003c 0%, #ff6b00 55%, #ffffff 100%)",
  "1": "linear-gradient(135deg, #a78bfa 0%, #f0abfc 50%, #fbbf24 100%)",
  "4": "linear-gradient(135deg, #22d3ee 0%, #a855f7 48%, #f472b6 100%)",
  "9": "linear-gradient(135deg, #ffd28c 0%, #ffbe64 48%, #ff8c28 100%)",
  "2": "linear-gradient(135deg, #00f0ff 0%, #7c5cff 48%, #ff2d95 100%)",
  "6": "linear-gradient(135deg, #ff9ebb 0%, #ffb7d5 48%, #ffd6e4 100%)",
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
