import { nextPhotoIndex, pickNextPhotoIndex, preloadPhoto, sleep } from "@/lib/bg-photos/photo-utils";

import type { BgPhotoSlot } from "@/lib/bg-photos/bg-photos.types";
import type { Dispatch, RefObject, SetStateAction } from "react";

export type BgCrossfadeRefs = {
  urlsRef: RefObject<string[]>;
  lastIndexRef: RefObject<number>;
  generationRef: RefObject<number>;
  loopingRef: RefObject<boolean>;
  activeIsARef: RefObject<boolean>;
  busyRef: RefObject<boolean>;
  setSlotA: Dispatch<SetStateAction<BgPhotoSlot>>;
  setSlotB: Dispatch<SetStateAction<BgPhotoSlot>>;
};

export type RunBgCrossfadeOptions = {
  /** 允许清单仅 1 张时仍溶解（刷新首图） */
  allowSingle?: boolean;
  /** 轻触换图按顺序，避免随机叠切 */
  sequential?: boolean;
  extraPreload?: (url: string) => string | undefined;
  /** 溶解未结束前保持 busy，防止连点叠动画 */
  fadeMs?: number;
};

export const runBgCrossfade = async (
  refs: BgCrossfadeRefs,
  requireLooping: boolean,
  signal?: AbortSignal,
  options?: RunBgCrossfadeOptions,
): Promise<boolean> => {
  if (refs.busyRef.current) return false;
  const urls = refs.urlsRef.current;
  if (!urls?.length) return false;
  if (urls.length <= 1 && (requireLooping || !options?.allowSingle)) return false;
  if (requireLooping && !refs.loopingRef.current) return false;

  const idx = options?.sequential
    ? nextPhotoIndex(urls.length, refs.lastIndexRef.current)
    : pickNextPhotoIndex(urls.length, refs.lastIndexRef.current);
  const nextUrl = urls[idx];
  if (!nextUrl) return false;

  refs.busyRef.current = true;
  const runGen = refs.generationRef.current;
  const extraUrl = options?.extraPreload?.(nextUrl);
  await Promise.all(
    extraUrl ? [preloadPhoto(nextUrl, signal), preloadPhoto(extraUrl, signal)] : [preloadPhoto(nextUrl, signal)],
  );

  const stale = signal?.aborted || runGen !== refs.generationRef.current;
  if (stale || (requireLooping && !refs.loopingRef.current)) {
    refs.busyRef.current = false;
    return false;
  }

  refs.lastIndexRef.current = idx;

  const swapped = await new Promise<boolean>((resolve) => {
    const apply = () => {
      if (signal?.aborted || runGen !== refs.generationRef.current) {
        resolve(false);
        return;
      }
      if (refs.activeIsARef.current) {
        refs.setSlotA((prev) => ({ ...prev, visible: false }));
        refs.setSlotB({ url: nextUrl, visible: true });
        refs.activeIsARef.current = false;
      } else {
        refs.setSlotB((prev) => ({ ...prev, visible: false }));
        refs.setSlotA({ url: nextUrl, visible: true });
        refs.activeIsARef.current = true;
      }
      resolve(true);
    };

    if (refs.activeIsARef.current) {
      refs.setSlotB({ url: nextUrl, visible: false });
    } else {
      refs.setSlotA({ url: nextUrl, visible: false });
    }
    requestAnimationFrame(() => requestAnimationFrame(apply));
  });

  if (!swapped) {
    refs.busyRef.current = false;
    return false;
  }

  const fadeMs = options?.fadeMs ?? 0;
  if (fadeMs > 0) await sleep(fadeMs, signal);
  refs.busyRef.current = false;
  return true;
};
