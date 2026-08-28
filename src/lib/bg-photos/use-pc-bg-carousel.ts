import { useCallback, useEffect, useRef, useState } from "react";

import { PC_BG_INTERVAL_MS, PC_BG_URLS } from "@/lib/bg-photos/constants";
import { runBgCrossfade } from "@/lib/bg-photos/run-bg-crossfade";

import type { BgPhotoSlot } from "@/lib/bg-photos/bg-photos.types";
import type { BgCrossfadeRefs } from "@/lib/bg-photos/run-bg-crossfade";

const URLS = [...PC_BG_URLS];
const emptySlot = (): BgPhotoSlot => ({ url: "", visible: false });
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

type UsePcBgCarouselOptions = {
  looping: boolean;
};

/** 仅应在 PC 且背景开启时挂载（由父组件条件渲染保证）。 */
export const usePcBgCarousel = ({ looping }: UsePcBgCarouselOptions) => {
  const [slotA, setSlotA] = useState<BgPhotoSlot>(() => ({ url: URLS[0], visible: true }));
  const [slotB, setSlotB] = useState<BgPhotoSlot>(emptySlot);

  const urlsRef = useRef(URLS);
  const lastIndexRef = useRef(0);
  const generationRef = useRef(0);
  const loopingRef = useRef(looping);
  const activeIsARef = useRef(true);
  const busyRef = useRef(false);
  const intervalRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const reducedRef = useRef(false);

  loopingRef.current = looping;

  const fadeRefsRef = useRef<BgCrossfadeRefs>({
    urlsRef,
    lastIndexRef,
    generationRef,
    loopingRef,
    activeIsARef,
    busyRef,
    setSlotA,
    setSlotB,
  });

  const clearCarousel = () => {
    window.clearInterval(intervalRef.current);
    intervalRef.current = 0;
  };

  const armInterval = useCallback(() => {
    window.clearInterval(intervalRef.current);
    intervalRef.current = 0;
    if (reducedRef.current || !loopingRef.current) return;
    intervalRef.current = window.setInterval(() => {
      void runBgCrossfade(fadeRefsRef.current, true, abortRef.current?.signal);
    }, PC_BG_INTERVAL_MS);
  }, []);

  useEffect(() => {
    reducedRef.current = window.matchMedia(REDUCED_QUERY).matches;
    const abort = new AbortController();
    abortRef.current = abort;
    generationRef.current += 1;
    armInterval();
    return () => {
      generationRef.current += 1;
      clearCarousel();
      abort.abort();
    };
  }, [armInterval]);

  useEffect(() => {
    if (!looping) {
      clearCarousel();
      return clearCarousel;
    }
    armInterval();
    return clearCarousel;
  }, [looping, armInterval]);

  return { slotA, slotB };
};
