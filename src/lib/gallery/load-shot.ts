import { preloadPhoto, toBackdropPhotoUrl, toGalleryPhotoUrl } from "@/lib/bg-photos/photo-utils";

import type { OssImageMeta } from "@/lib/bg-photos/bg-photos.types";
import type { GalleryNaturalSize, GalleryPreparedShot, GallerySlot } from "@/lib/gallery/gallery.types";

const SHOT_CACHE_MAX = 16;

const shotCache = new Map<number, GalleryPreparedShot>();
const shotInflight = new Map<number, Promise<GalleryPreparedShot | null>>();

export const emptySlot = (): GallerySlot => ({ url: "", motion: "leave" });

export const emptySize = (): GalleryNaturalSize => ({ width: 0, height: 0 });

export const afterPaint = (fn: () => void) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
};

const rememberShot = (idx: number, shot: GalleryPreparedShot) => {
  if (shotCache.has(idx)) shotCache.delete(idx);
  shotCache.set(idx, shot);
  while (shotCache.size > SHOT_CACHE_MAX) {
    const oldest = shotCache.keys().next().value;
    if (oldest === undefined) break;
    shotCache.delete(oldest);
  }
};

const decodeShot = async (photos: OssImageMeta[], idx: number): Promise<GalleryPreparedShot | null> => {
  const meta = photos[idx];
  if (!meta) return null;
  const url = toGalleryPhotoUrl(meta.url);
  const backdrop = toBackdropPhotoUrl(meta.url);
  const warmBackdrop = new Image();
  warmBackdrop.src = backdrop;
  const img = new Image();
  img.src = url;
  try {
    if (img.decode) await img.decode();
    else {
      const size = await preloadPhoto(url);
      if (size.width <= 0) return null;
      return { idx, url, backdrop, size };
    }
  } catch {
    if (img.naturalWidth <= 0) return null;
  }
  if (img.naturalWidth <= 0) return null;
  return { idx, url, backdrop, size: { width: img.naturalWidth, height: img.naturalHeight } };
};

export const loadShot = async (
  photos: OssImageMeta[],
  idx: number,
  signal?: AbortSignal,
): Promise<GalleryPreparedShot | null> => {
  if (signal?.aborted) return null;
  const cached = shotCache.get(idx);
  if (cached) {
    rememberShot(idx, cached);
    return cached;
  }

  const pending = shotInflight.get(idx);
  const task =
    pending ??
    decodeShot(photos, idx).finally(() => {
      shotInflight.delete(idx);
    });
  if (!pending) shotInflight.set(idx, task);

  const shot = await task;
  if (signal?.aborted) return null;
  if (shot) rememberShot(idx, shot);
  return shot;
};

export const prefetchShot = (photos: OssImageMeta[], idx: number) => {
  if (!photos[idx] || shotCache.has(idx) || shotInflight.has(idx)) return;
  void loadShot(photos, idx);
};

export const prefetchShots = (photos: OssImageMeta[], idxs: number[]) => {
  let i = 0;
  const step = () => {
    if (i >= idxs.length) return;
    prefetchShot(photos, idxs[i]);
    i += 1;
    if (i >= idxs.length) return;
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(step, { timeout: 1400 });
      return;
    }
    window.setTimeout(step, 320);
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(step, { timeout: 900 });
    return;
  }
  window.setTimeout(step, 480);
};
