import { preloadPhoto, toHallProbeUrl } from "@/lib/bg-photos/photo-utils";
import { HALL_PROBE_CACHE_KEY } from "@/lib/gallery/constants";

import type { HallNaturalSize } from "@/lib/gallery/hall.types";

const memoryCache = new Map<string, HallNaturalSize>();
let storageHydrated = false;

const isSize = (value: unknown): value is HallNaturalSize => {
  if (!value || typeof value !== "object") return false;
  const item = value as HallNaturalSize;
  return Number.isFinite(item.width) && item.width > 0 && Number.isFinite(item.height) && item.height > 0;
};

const hydrateStorage = () => {
  if (storageHydrated) return;
  storageHydrated = true;
  try {
    const raw = sessionStorage.getItem(HALL_PROBE_CACHE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isSize(value)) memoryCache.set(key, value);
    }
  } catch {
    /* ignore quota / parse */
  }
};

const persistStorage = () => {
  try {
    sessionStorage.setItem(HALL_PROBE_CACHE_KEY, JSON.stringify(Object.fromEntries(memoryCache)));
  } catch {
    /* ignore quota */
  }
};

export const peekHallSize = (key: string): HallNaturalSize | undefined => {
  hydrateStorage();
  return memoryCache.get(key);
};

export const rememberHallSize = (key: string, size: HallNaturalSize) => {
  hydrateStorage();
  memoryCache.set(key, size);
  persistStorage();
};

export const probeHallSize = async (url: string, signal?: AbortSignal): Promise<HallNaturalSize | null> => {
  const size = await preloadPhoto(toHallProbeUrl(url), signal);
  if (signal?.aborted || size.width <= 0 || size.height <= 0) return null;
  return size;
};
