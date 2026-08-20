/** 按颜色相似度排序：红橙粉 → 暖金 → 金青 → 翠绿 → 青蓝紫 → 霓虹 */
export const THEME_IDS = ["15", "8", "19", "18", "1", "5", "17", "2", "4", "10", "9", "3", "14", "12", "11"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

/** 默认：金盏碧绿 */
export const DEFAULT_THEME_ID: ThemeId = "1";

export const THEME_LABELS: Record<ThemeId, string> = {
  "15": "激光红黑",
  "8": "炭黑甜粉",
  "19": "熔金光环",
  "18": "琥珀暖金",
  "1": "金盏碧绿",
  "5": "碧青栀子",
  "17": "翠雾森岚",
  "2": "松花苏梅",
  "4": "丁香柳芽",
  "10": "米白星蓝",
  "9": "湖青黛紫",
  "3": "青紫双撞",
  "14": "全息虹彩",
  "12": "赛博霓虹",
  "11": "极光紫金",
};

export const THEME_PREVIEWS: Record<ThemeId, string> = {
  "15": "linear-gradient(135deg, #ff003c 0%, #ff6b00 55%, #ffffff 100%)",
  "8": "linear-gradient(135deg, #e6397c 0%, #1a1a1d 50%, #ff8ab0 100%)",
  "19": "linear-gradient(135deg, #ffd28c 0%, #ffbe64 48%, #ff8c28 100%)",
  "18": "linear-gradient(135deg, #fbbf24 0%, #f59e0b 48%, #ea580c 100%)",
  "1": "linear-gradient(135deg, #fcc307 0%, #ffe08a 48%, #2ade9f 100%)",
  "5": "linear-gradient(135deg, #72afba 0%, #e9c46a 50%, #fad390 100%)",
  "17": "linear-gradient(135deg, #34d399 0%, #2dd4bf 48%, #a3e635 100%)",
  "2": "linear-gradient(135deg, #a8c686 0%, #e497a4 50%, #f2e6d0 100%)",
  "4": "linear-gradient(135deg, #c1a1ca 0%, #96c24e 50%, #8c64a0 100%)",
  "10": "linear-gradient(135deg, #41bbc8 0%, #fcf9e8 50%, #7ed4dc 100%)",
  "9": "linear-gradient(135deg, #38b0b0 0%, #815c94 50%, #a888bc 100%)",
  "3": "linear-gradient(135deg, #00f0ff 0%, #9d00ff 50%, #c77dff 100%)",
  "14": "linear-gradient(135deg, #22d3ee 0%, #a855f7 48%, #f472b6 100%)",
  "12": "linear-gradient(135deg, #00f0ff 0%, #7c5cff 48%, #ff2d95 100%)",
  "11": "linear-gradient(135deg, #a78bfa 0%, #f0abfc 50%, #fbbf24 100%)",
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
