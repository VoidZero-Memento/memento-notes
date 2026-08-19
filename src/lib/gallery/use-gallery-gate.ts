import { useCallback, useSyncExternalStore } from "react";

import { GALLERY_GATE_SESSION_KEY } from "@/lib/gallery/constants";
import { expectedDigest, verifyGateKey } from "@/lib/gallery/gate-key";

const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const readStoredUnlock = () => {
  try {
    return sessionStorage.getItem(GALLERY_GATE_SESSION_KEY) === expectedDigest();
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
    sessionStorage.setItem(GALLERY_GATE_SESSION_KEY, expectedDigest());
  } catch {
    /* 隐私模式等场景下写入可能失败，内存态仍可用 */
  }
  emit();
};

export const useGalleryGate = () => {
  const isUnlocked = useSyncExternalStore(subscribe, getUnlocked, () => false);

  const unlock = useCallback(async (raw: string) => {
    const ok = await verifyGateKey(raw);
    if (ok) persistUnlock();
    return ok;
  }, []);

  return { unlocked: isUnlocked, unlock };
};
