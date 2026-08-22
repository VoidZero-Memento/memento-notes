import { useCallback, useEffect, useRef, useState } from "react";

import { pickNextPhotoIndex, preloadPhoto, sleep } from "@/lib/bg-photos/photo-utils";
import { HALL_BG_FADE_MS, HALL_BG_HOLD_MS } from "@/lib/gallery/constants";
import { useHallDesktop } from "@/lib/gallery/use-hall-desktop";

import type { HallBackdropSlot, HallPhoto } from "@/lib/gallery/hall.types";

const emptySlot = (): HallBackdropSlot => ({ desktopUrl: "", shown: false, url: "" });
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

const toSlot = (photo: HallPhoto, shown: boolean): HallBackdropSlot => ({
  desktopUrl: photo.desktopBackdropUrl,
  shown,
  url: photo.backdropUrl,
});

export const useHallBackdrop = (photos: HallPhoto[], playing: boolean) => {
  const desktop = useHallDesktop();
  const [slotA, setSlotA] = useState<HallBackdropSlot>(emptySlot);
  const [slotB, setSlotB] = useState<HallBackdropSlot>(emptySlot);
  const lastIndexRef = useRef(-1);
  const activeIsARef = useRef(true);
  const seededRef = useRef(false);
  const playingRef = useRef(playing);
  const photosRef = useRef(photos);
  const desktopRef = useRef(desktop);
  const busyRef = useRef(false);
  const lastSwitchRef = useRef(Date.now());
  const abortRef = useRef<AbortController | null>(null);
  const runningRef = useRef(true);
  playingRef.current = playing;
  photosRef.current = photos;
  desktopRef.current = desktop;

  const runCrossfade = useCallback(async (requirePlaying: boolean) => {
    if (busyRef.current) return false;
    if (requirePlaying && !playingRef.current) return false;
    const list = photosRef.current;
    if (list.length <= 1) return false;
    const idx = pickNextPhotoIndex(list.length, lastIndexRef.current);
    const next = list[idx];
    if (!next) return false;

    busyRef.current = true;
    const signal = abortRef.current?.signal;
    const preloadUrl = desktopRef.current ? next.desktopBackdropUrl : next.backdropUrl;
    await preloadPhoto(preloadUrl, signal);
    if (signal?.aborted || !runningRef.current || (requirePlaying && !playingRef.current)) {
      busyRef.current = false;
      return false;
    }

    lastIndexRef.current = idx;
    lastSwitchRef.current = Date.now();
    if (activeIsARef.current) {
      setSlotB(toSlot(next, false));
      requestAnimationFrame(() => {
        if (!runningRef.current || signal?.aborted) {
          busyRef.current = false;
          return;
        }
        setSlotA((prev) => ({ ...prev, shown: false }));
        setSlotB(toSlot(next, true));
        activeIsARef.current = false;
        busyRef.current = false;
      });
      return true;
    }

    setSlotA(toSlot(next, false));
    requestAnimationFrame(() => {
      if (!runningRef.current || signal?.aborted) {
        busyRef.current = false;
        return;
      }
      setSlotB((prev) => ({ ...prev, shown: false }));
      setSlotA(toSlot(next, true));
      activeIsARef.current = true;
      busyRef.current = false;
    });
    return true;
  }, []);

  const advance = useCallback(() => {
    void runCrossfade(false);
  }, [runCrossfade]);

  useEffect(() => {
    if (seededRef.current || photos.length === 0) return;
    const first = photos[Math.floor(Math.random() * photos.length)];
    if (!first?.backdropUrl) return;
    seededRef.current = true;
    lastIndexRef.current = photos.indexOf(first);
    activeIsARef.current = true;
    lastSwitchRef.current = Date.now();
    setSlotA(toSlot(first, true));
    setSlotB(emptySlot());
  }, [photos]);

  useEffect(() => {
    const reduced = window.matchMedia(REDUCED_QUERY).matches;
    const abort = new AbortController();
    abortRef.current = abort;
    runningRef.current = true;

    const loop = async () => {
      while (runningRef.current && !abort.signal.aborted) {
        await sleep(240, abort.signal);
        if (!runningRef.current || abort.signal.aborted) return;
        if (!playingRef.current || reduced) continue;
        if (Date.now() - lastSwitchRef.current < HALL_BG_HOLD_MS) continue;
        const faded = await runCrossfade(true);
        if (!runningRef.current || abort.signal.aborted) return;
        if (!faded) continue;
        await sleep(HALL_BG_FADE_MS, abort.signal);
        if (!runningRef.current || abort.signal.aborted) return;
        if (activeIsARef.current) setSlotB(emptySlot());
        else setSlotA(emptySlot());
      }
    };

    void loop();
    return () => {
      runningRef.current = false;
      abort.abort();
    };
  }, [runCrossfade]);

  return { slotA, slotB, advance };
};
