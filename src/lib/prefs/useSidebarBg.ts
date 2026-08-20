import { useCallback, useSyncExternalStore } from "react";

import { DEFAULT_SIDEBAR_BG_ENABLED, persistSidebarBg, readStoredSidebarBg } from "@/lib/prefs/sidebar-bg";

const listeners = new Set<() => void>();

let enabled = readStoredSidebarBg();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getEnabled = () => enabled;

export const useSidebarBg = () => {
  const isEnabled = useSyncExternalStore(subscribe, getEnabled, () => DEFAULT_SIDEBAR_BG_ENABLED);

  const setEnabled = useCallback((next: boolean) => {
    if (next === enabled) return;
    enabled = next;
    persistSidebarBg(next);
    emit();
  }, []);

  return { enabled: isEnabled, setEnabled };
};
