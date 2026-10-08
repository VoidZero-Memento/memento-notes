import type { SidebarBgEffect } from "./sidebar-bg-effect.types";

export const SIDEBAR_BG_EFFECT_STORAGE_KEY = "memento-notes:sidebar-bg-effect";

export const DEFAULT_SIDEBAR_BG_EFFECT: SidebarBgEffect = "flip";

/** 菜单点击时按此顺序循环 */
export const SIDEBAR_BG_EFFECTS: SidebarBgEffect[] = ["fade", "slide", "flip", "spin"];

export const SIDEBAR_BG_EFFECT_LABELS: Record<SidebarBgEffect, string> = {
  fade: "淡入淡出",
  slide: "左右滑动",
  flip: "3D 翻转",
  spin: "旋转缩放",
};

export const nextSidebarBgEffect = (current: SidebarBgEffect): SidebarBgEffect => {
  const index = SIDEBAR_BG_EFFECTS.indexOf(current);
  return SIDEBAR_BG_EFFECTS[(index + 1) % SIDEBAR_BG_EFFECTS.length] ?? DEFAULT_SIDEBAR_BG_EFFECT;
};

const isSidebarBgEffect = (value: string | null): value is SidebarBgEffect =>
  SIDEBAR_BG_EFFECTS.some((effect) => effect === value);

export const readStoredSidebarBgEffect = (): SidebarBgEffect => {
  try {
    const value = window.localStorage.getItem(SIDEBAR_BG_EFFECT_STORAGE_KEY);
    return isSidebarBgEffect(value) ? value : DEFAULT_SIDEBAR_BG_EFFECT;
  } catch {
    return DEFAULT_SIDEBAR_BG_EFFECT;
  }
};

export const persistSidebarBgEffect = (effect: SidebarBgEffect): void => {
  try {
    window.localStorage.setItem(SIDEBAR_BG_EFFECT_STORAGE_KEY, effect);
  } catch {
    // 隐私模式等场景下写入可能失败，静默忽略
  }
};
