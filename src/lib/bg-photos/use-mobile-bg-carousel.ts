import { useEffect, useRef, useState } from "react";

import { MOBILE_BG_FALLBACK_URL, MOBILE_BG_INTERVAL_MS } from "@/lib/bg-photos/constants";
import { fetchGalleryBannerUrls, getCachedGalleryBannerUrls } from "@/lib/bg-photos/images";
import { pickNextPhotoIndex, preloadPhoto, toBgPhotoUrl } from "@/lib/bg-photos/photo-utils";
import { takePreparedMobileBg } from "@/lib/bg-photos/prepare-mobile-bg";

import type { BgPhotoSlot } from "@/lib/bg-photos/bg-photos.types";

const emptySlot = (): BgPhotoSlot => ({ url: "", visible: false });

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

type UseMobileBgCarouselOptions = {
  /** 是否循环；false 时停在当前图，不再设 interval */
  looping: boolean;
};

/**
 * 仅应在手机端且背景开启时挂载本 hook（由父组件条件渲染保证）。
 */
export const useMobileBgCarousel = ({ looping }: UseMobileBgCarouselOptions) => {
  const preparedRef = useRef<ReturnType<typeof takePreparedMobileBg> | undefined>(undefined);
  if (preparedRef.current === undefined) {
    preparedRef.current = takePreparedMobileBg();
  }
  const prepared = preparedRef.current;

  const [slotA, setSlotA] = useState<BgPhotoSlot>(() =>
    prepared ? { url: prepared.url, visible: true } : { url: MOBILE_BG_FALLBACK_URL, visible: true },
  );
  const [slotB, setSlotB] = useState<BgPhotoSlot>(emptySlot);

  const urlsRef = useRef<string[]>([]);
  const lastIndexRef = useRef(prepared?.index ?? -1);
  const generationRef = useRef(0);
  const loopingRef = useRef(looping);
  const activeIsARef = useRef(true);
  const intervalRef = useRef(0);
  const hadPreparedRef = useRef(!!prepared);

  loopingRef.current = looping;

  useEffect(() => {
    const reducedMotion = window.matchMedia(REDUCED_QUERY).matches;
    const abort = new AbortController();
    generationRef.current += 1;
    const gen = generationRef.current;

    const clearCarousel = () => {
      window.clearInterval(intervalRef.current);
      intervalRef.current = 0;
    };

    const crossfade = async () => {
      const urls = urlsRef.current;
      if (urls.length <= 1 || !loopingRef.current) return;

      const runGen = generationRef.current;
      const idx = pickNextPhotoIndex(urls.length, lastIndexRef.current);
      const nextUrl = urls[idx];
      if (!nextUrl) return;

      await preloadPhoto(nextUrl, abort.signal);
      if (abort.signal.aborted || runGen !== generationRef.current || !loopingRef.current) return;

      lastIndexRef.current = idx;

      if (activeIsARef.current) {
        setSlotB({ url: nextUrl, visible: false });
        requestAnimationFrame(() => {
          if (abort.signal.aborted || runGen !== generationRef.current) return;
          setSlotA((prev) => ({ ...prev, visible: false }));
          setSlotB({ url: nextUrl, visible: true });
          activeIsARef.current = false;
        });
        return;
      }

      setSlotA({ url: nextUrl, visible: false });
      requestAnimationFrame(() => {
        if (abort.signal.aborted || runGen !== generationRef.current) return;
        setSlotB((prev) => ({ ...prev, visible: false }));
        setSlotA({ url: nextUrl, visible: true });
        activeIsARef.current = true;
      });
    };

    const armInterval = () => {
      clearCarousel();
      if (reducedMotion || urlsRef.current.length <= 1 || !loopingRef.current) return;
      intervalRef.current = window.setInterval(() => {
        void crossfade();
      }, MOBILE_BG_INTERVAL_MS);
    };

    const startCarousel = (photoUrls: string[], forceNew: boolean) => {
      if (gen !== generationRef.current) return;

      urlsRef.current = photoUrls;
      if (!photoUrls.length) return;

      if (forceNew) {
        const idx = pickNextPhotoIndex(photoUrls.length, -1);
        const url = photoUrls[idx] ?? photoUrls[0];
        lastIndexRef.current = idx;
        setSlotA({ url, visible: true });
        setSlotB(emptySlot());
        activeIsARef.current = true;
      } else if (lastIndexRef.current < 0) {
        lastIndexRef.current = 0;
      }

      armInterval();
    };

    const forceNew = !hadPreparedRef.current;
    const cached = getCachedGalleryBannerUrls();
    if (cached?.length) {
      startCarousel(cached.map(toBgPhotoUrl), forceNew);
    } else {
      void fetchGalleryBannerUrls(abort.signal)
        .then((list) => {
          if (abort.signal.aborted || gen !== generationRef.current) return;
          startCarousel(list.map(toBgPhotoUrl), forceNew);
        })
        .catch(() => {
          /* 保留 fallback */
        });
    }

    return () => {
      generationRef.current += 1;
      clearCarousel();
      abort.abort();
    };
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(REDUCED_QUERY).matches;
    const clearCarousel = () => {
      window.clearInterval(intervalRef.current);
      intervalRef.current = 0;
    };

    if (!looping || reducedMotion || urlsRef.current.length <= 1) {
      clearCarousel();
      return clearCarousel;
    }

    if (intervalRef.current) return clearCarousel;

    const gen = generationRef.current;
    const crossfade = async () => {
      const urls = urlsRef.current;
      if (urls.length <= 1 || !loopingRef.current) return;

      const runGen = generationRef.current;
      const idx = pickNextPhotoIndex(urls.length, lastIndexRef.current);
      const nextUrl = urls[idx];
      if (!nextUrl) return;

      await preloadPhoto(nextUrl);
      if (runGen !== generationRef.current || !loopingRef.current) return;

      lastIndexRef.current = idx;

      if (activeIsARef.current) {
        setSlotB({ url: nextUrl, visible: false });
        requestAnimationFrame(() => {
          if (runGen !== generationRef.current) return;
          setSlotA((prev) => ({ ...prev, visible: false }));
          setSlotB({ url: nextUrl, visible: true });
          activeIsARef.current = false;
        });
        return;
      }

      setSlotA({ url: nextUrl, visible: false });
      requestAnimationFrame(() => {
        if (runGen !== generationRef.current) return;
        setSlotB((prev) => ({ ...prev, visible: false }));
        setSlotA({ url: nextUrl, visible: true });
        activeIsARef.current = true;
      });
    };

    intervalRef.current = window.setInterval(() => {
      if (gen !== generationRef.current) return;
      void crossfade();
    }, MOBILE_BG_INTERVAL_MS);

    return clearCarousel;
  }, [looping]);

  return { slotA, slotB };
};
