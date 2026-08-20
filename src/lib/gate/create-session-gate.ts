import { useCallback, useSyncExternalStore } from "react";

import { verifyGateKey } from "@/lib/gallery/gate-key";

export const createSessionGate = (storageKey: string, expectedDigest: () => string) => {
  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  const readStoredUnlock = () => {
    try {
      return sessionStorage.getItem(storageKey) === expectedDigest();
    } catch {
      return false;
    }
  };

  let unlocked = readStoredUnlock();

  const getUnlocked = () => unlocked;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const persistUnlock = () => {
    unlocked = true;
    try {
      sessionStorage.setItem(storageKey, expectedDigest());
    } catch {
      /* 隐私模式等场景下写入可能失败，内存态仍可用 */
    }
    emit();
  };

  return () => {
    const isUnlocked = useSyncExternalStore(subscribe, getUnlocked, () => false);

    const unlock = useCallback(async (raw: string) => {
      const ok = await verifyGateKey(raw, expectedDigest());
      if (ok) persistUnlock();
      return ok;
    }, []);

    return { unlocked: isUnlocked, unlock };
  };
};
