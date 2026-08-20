import { useEffect, useRef, useState } from "react";

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
  playingRef.current = playing;
  photosRef.current = photos;
  desktopRef.current = desktop;

  useEffect(() => {
    if (seededRef.current || photos.length === 0) return;
    const first = photos[Math.floor(Math.random() * photos.length)];
    if (!first?.backdropUrl) return;
    seededRef.current = true;
    lastIndexRef.current = photos.indexOf(first);
    activeIsARef.current = true;
    setSlotA(toSlot(first, true));
    setSlotB(emptySlot());
  }, [photos]);

  useEffect(() => {
    const reduced = window.matchMedia(REDUCED_QUERY).matches;
    const abort = new AbortController();
    let running = true;

    const crossfade = async () => {
      while (running && !abort.signal.aborted && photosRef.current.length <= 1) {
        await sleep(240, abort.signal);
      }

      while (running && !abort.signal.aborted) {
        await sleep(HALL_BG_HOLD_MS, abort.signal);
        if (!running || abort.signal.aborted) return;
        if (!playingRef.current || reduced) continue;

        const list = photosRef.current;
        if (list.length <= 1) continue;
        const idx = pickNextPhotoIndex(list.length, lastIndexRef.current);
        const next = list[idx];
        if (!next) continue;

        const preloadUrl = desktopRef.current ? next.desktopBackdropUrl : next.backdropUrl;
        await preloadPhoto(preloadUrl, abort.signal);
        if (!running || abort.signal.aborted || !playingRef.current) continue;

        lastIndexRef.current = idx;
        if (activeIsARef.current) {
          setSlotB(toSlot(next, false));
          requestAnimationFrame(() => {
            if (!running || abort.signal.aborted) return;
            setSlotA((prev) => ({ ...prev, shown: false }));
            setSlotB(toSlot(next, true));
            activeIsARef.current = false;
          });
        } else {
          setSlotA(toSlot(next, false));
          requestAnimationFrame(() => {
            if (!running || abort.signal.aborted) return;
            setSlotB((prev) => ({ ...prev, shown: false }));
            setSlotA(toSlot(next, true));
            activeIsARef.current = true;
          });
        }

        await sleep(HALL_BG_FADE_MS, abort.signal);
        if (!running || abort.signal.aborted) return;
        if (activeIsARef.current) setSlotB(emptySlot());
        else setSlotA(emptySlot());
      }
    };

    void crossfade();
    return () => {
      running = false;
      abort.abort();
    };
  }, []);

  return { slotA, slotB };
};
