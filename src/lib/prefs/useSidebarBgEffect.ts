import { useCallback, useSyncExternalStore } from "react";

import { DEFAULT_SIDEBAR_BG_EFFECT, persistSidebarBgEffect, readStoredSidebarBgEffect } from "./sidebar-bg-effect";

import type { SidebarBgEffect } from "./sidebar-bg-effect.types";

const listeners = new Set<() => void>();

let effect: SidebarBgEffect = readStoredSidebarBgEffect();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getEffect = () => effect;

export const useSidebarBgEffect = () => {
  const current = useSyncExternalStore(subscribe, getEffect, () => DEFAULT_SIDEBAR_BG_EFFECT);

  const setEffect = useCallback((next: SidebarBgEffect) => {
    if (next === effect) return;
    effect = next;
    persistSidebarBgEffect(next);
    emit();
  }, []);

  return { effect: current, setEffect };
};
