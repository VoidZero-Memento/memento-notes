import { useCallback, useSyncExternalStore } from "react";

import { DEFAULT_SIDEBAR_BG_LOOP, persistSidebarBgLoop, readStoredSidebarBgLoop } from "./sidebar-bg-loop";

const listeners = new Set<() => void>();

let looping = readStoredSidebarBgLoop();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getLooping = () => looping;

export const useSidebarBgLoop = () => {
  const isLooping = useSyncExternalStore(subscribe, getLooping, () => DEFAULT_SIDEBAR_BG_LOOP);

  const setLooping = useCallback((next: boolean) => {
    if (next === looping) return;
    looping = next;
    persistSidebarBgLoop(next);
    emit();
  }, []);

  return { looping: isLooping, setLooping };
};
