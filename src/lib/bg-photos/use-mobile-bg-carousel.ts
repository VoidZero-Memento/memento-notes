import { useCallback, useEffect, useRef, useState } from "react";

import { MOBILE_BG_FALLBACK_URL, MOBILE_BG_INTERVAL_MS } from "@/lib/bg-photos/constants";
import { fetchGalleryBannerUrls, getCachedGalleryBannerUrls } from "@/lib/bg-photos/images";
import { pickNextPhotoIndex, toBgPhotoUrl } from "@/lib/bg-photos/photo-utils";
import { takePreparedMobileBg } from "@/lib/bg-photos/prepare-mobile-bg";
import { runBgCrossfade } from "@/lib/bg-photos/run-bg-crossfade";

import type { BgPhotoSlot } from "@/lib/bg-photos/bg-photos.types";
import type { BgCrossfadeRefs } from "@/lib/bg-photos/run-bg-crossfade";

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
  const busyRef = useRef(false);
  const intervalRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const hadPreparedRef = useRef(!!prepared);
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
    if (reducedRef.current || urlsRef.current.length <= 1 || !loopingRef.current) return;
    intervalRef.current = window.setInterval(() => {
      void runBgCrossfade(fadeRefsRef.current, true, abortRef.current?.signal);
    }, MOBILE_BG_INTERVAL_MS);
  }, []);

  const advance = useCallback(() => {
    void runBgCrossfade(fadeRefsRef.current, false, abortRef.current?.signal).then((ok) => {
      if (ok && loopingRef.current) armInterval();
    });
  }, [armInterval]);

  useEffect(() => {
    reducedRef.current = window.matchMedia(REDUCED_QUERY).matches;
    const abort = new AbortController();
    abortRef.current = abort;
    generationRef.current += 1;
    const gen = generationRef.current;

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
  }, [armInterval]);

  useEffect(() => {
    if (!looping) {
      clearCarousel();
      return clearCarousel;
    }
    armInterval();
    return clearCarousel;
  }, [looping, armInterval]);

  return { slotA, slotB, advance };
};
