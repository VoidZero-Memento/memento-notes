import { nextPhotoIndex, nextStripStartIndex, pickNextPhotoIndex, preloadPhoto, sleep, takePhotoStrip } from "@/lib/bg-photos/photo-utils";

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

const pickStripStart = (length: number, lastIndex: number, take: number, sequential?: boolean): number => {
  if (take === 1) {
    return sequential ? nextPhotoIndex(length, lastIndex) : pickNextPhotoIndex(length, lastIndex);
  }
  return sequential ? nextStripStartIndex(length, lastIndex, take) : pickNextPhotoIndex(length, lastIndex);
};

export type RunBgCrossfadeOptions = {
  /** 允许清单仅 1 张时仍溶解（刷新首图） */
  allowSingle?: boolean;
  /** 轻触换图按顺序，避免随机叠切 */
  sequential?: boolean;
  extraPreload?: (url: string) => string | undefined;
  /** 溶解未结束前保持 busy，防止连点叠动画 */
  fadeMs?: number;
  /** PC 并排列数；缺省 1 张，与手机轮播一致 */
  stripSize?: number;
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

  const stripSize = Math.max(1, options?.stripSize ?? 1);
  const take = Math.min(stripSize, urls.length);
  const idx = pickStripStart(urls.length, refs.lastIndexRef.current, take, options?.sequential);
  const strip = takePhotoStrip(urls, idx, take);
  const nextUrl = strip[0];
  if (!nextUrl) return false;

  refs.busyRef.current = true;
  const runGen = refs.generationRef.current;
  const extras = strip.flatMap((url) => {
    const extraUrl = options?.extraPreload?.(url);
    return extraUrl ? [preloadPhoto(extraUrl, signal)] : [];
  });
  await Promise.all([...strip.map((url) => preloadPhoto(url, signal)), ...extras]);

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
      const nextSlot = take > 1 ? { url: nextUrl, urls: strip, visible: true } : { url: nextUrl, visible: true };
      if (refs.activeIsARef.current) {
        refs.setSlotA((prev) => ({ ...prev, visible: false }));
        refs.setSlotB(nextSlot);
        refs.activeIsARef.current = false;
      } else {
        refs.setSlotB((prev) => ({ ...prev, visible: false }));
        refs.setSlotA(nextSlot);
        refs.activeIsARef.current = true;
      }
      resolve(true);
    };

    const hiddenSlot = take > 1 ? { url: nextUrl, urls: strip, visible: false } : { url: nextUrl, visible: false };
    if (refs.activeIsARef.current) {
      refs.setSlotB(hiddenSlot);
    } else {
      refs.setSlotA(hiddenSlot);
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
