import { pickNextPhotoIndex, preloadPhoto } from "@/lib/bg-photos/photo-utils";

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

export const runBgCrossfade = async (
  refs: BgCrossfadeRefs,
  requireLooping: boolean,
  signal?: AbortSignal,
): Promise<boolean> => {
  if (refs.busyRef.current) return false;
  const urls = refs.urlsRef.current;
  if (!urls || urls.length <= 1) return false;
  if (requireLooping && !refs.loopingRef.current) return false;

  const idx = pickNextPhotoIndex(urls.length, refs.lastIndexRef.current);
  const nextUrl = urls[idx];
  if (!nextUrl) return false;

  refs.busyRef.current = true;
  const runGen = refs.generationRef.current;
  await preloadPhoto(nextUrl, signal);

  const stale = signal?.aborted || runGen !== refs.generationRef.current;
  if (stale || (requireLooping && !refs.loopingRef.current)) {
    refs.busyRef.current = false;
    return false;
  }

  refs.lastIndexRef.current = idx;

  await new Promise<void>((resolve) => {
    const apply = () => {
      if (signal?.aborted || runGen !== refs.generationRef.current) {
        refs.busyRef.current = false;
        resolve();
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
      refs.busyRef.current = false;
      resolve();
    };

    if (refs.activeIsARef.current) {
      refs.setSlotB({ url: nextUrl, visible: false });
    } else {
      refs.setSlotA({ url: nextUrl, visible: false });
    }
    requestAnimationFrame(apply);
  });

  return true;
};
