import { useCallback, useEffect, useRef, useState } from "react";

import { MOBILE_BG_FADE_MS, MOBILE_BG_FALLBACK_URL, MOBILE_BG_INTERVAL_MS } from "@/lib/bg-photos/constants";
import { fetchGalleryBannerUrls, getCachedGalleryBannerUrls } from "@/lib/bg-photos/images";
import { pickNextPhotoIndex, preloadPhoto, toBgPhotoUrl, toImmersiveBgUrl } from "@/lib/bg-photos/photo-utils";
import { takePreparedMobileBg } from "@/lib/bg-photos/prepare-mobile-bg";
import { runBgCrossfade } from "@/lib/bg-photos/run-bg-crossfade";
import { useOssFolder } from "@/lib/bg-photos/useOssFolder";

import type { BgPhotoSlot } from "@/lib/bg-photos/bg-photos.types";
import type { BgCrossfadeRefs } from "@/lib/bg-photos/run-bg-crossfade";

const emptySlot = (): BgPhotoSlot => ({ url: "", visible: false });

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

type UseMobileBgCarouselOptions = {
  /** 是否循环；false 时停在当前图，不再设 interval */
  looping: boolean;
  /** 沉浸看图时预拉高清层，避免切图后原图弹出 */
  preloadSharp?: boolean;
};

/**
 * 仅应在手机端且背景开启时挂载本 hook（由父组件条件渲染保证）。
 */
export const useMobileBgCarousel = ({ looping, preloadSharp = false }: UseMobileBgCarouselOptions) => {
  const { folder } = useOssFolder();
  const preparedRef = useRef<ReturnType<typeof takePreparedMobileBg> | undefined>(undefined);
  if (preparedRef.current === undefined) {
    preparedRef.current = takePreparedMobileBg();
  }
  const prepared = preparedRef.current;

  const [slotA, setSlotA] = useState<BgPhotoSlot>(() =>
    prepared ? { url: prepared.url, visible: true } : emptySlot(),
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
  const folderRef = useRef(folder);
  const reducedRef = useRef(false);
  const preloadSharpRef = useRef(preloadSharp);

  loopingRef.current = looping;
  preloadSharpRef.current = preloadSharp;

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
      void runBgCrossfade(fadeRefsRef.current, true, abortRef.current?.signal, {
        fadeMs: reducedRef.current ? 0 : MOBILE_BG_FADE_MS,
        extraPreload: preloadSharpRef.current ? toImmersiveBgUrl : undefined,
      });
    }, MOBILE_BG_INTERVAL_MS);
  }, []);

  const advance = useCallback(() => {
    void runBgCrossfade(fadeRefsRef.current, false, abortRef.current?.signal, {
      sequential: true,
      fadeMs: reducedRef.current ? 0 : MOBILE_BG_FADE_MS,
      extraPreload: preloadSharpRef.current ? toImmersiveBgUrl : undefined,
    }).then((ok) => {
      if (ok && loopingRef.current) armInterval();
    });
  }, [armInterval]);

  useEffect(() => {
    reducedRef.current = window.matchMedia(REDUCED_QUERY).matches;
    const abort = new AbortController();
    abortRef.current = abort;
    generationRef.current += 1;
    const gen = generationRef.current;
    const folderChanged = folderRef.current !== folder;
    folderRef.current = folder;
    const reveal = folderChanged || !hadPreparedRef.current;

    const startCarousel = (photoUrls: string[], shouldReveal: boolean) => {
      if (gen !== generationRef.current) return;
      const urls = photoUrls.length ? photoUrls : [MOBILE_BG_FALLBACK_URL];
      urlsRef.current = urls;

      if (!shouldReveal) {
        if (lastIndexRef.current < 0) lastIndexRef.current = 0;
        armInterval();
        return;
      }

      if (folderChanged) {
        lastIndexRef.current = -1;
        void runBgCrossfade(fadeRefsRef.current, false, abort.signal, {
          allowSingle: true,
          fadeMs: reducedRef.current ? 0 : MOBILE_BG_FADE_MS,
        }).then(() => {
          if (gen !== generationRef.current) return;
          armInterval();
        });
        return;
      }

      const idx = pickNextPhotoIndex(urls.length, -1);
      const url = urls[idx] ?? urls[0];
      if (!url) return;
      void preloadPhoto(url, abort.signal).then(() => {
        if (gen !== generationRef.current || abort.signal.aborted) return;
        lastIndexRef.current = idx;
        setSlotA({ url, visible: true });
        setSlotB(emptySlot());
        activeIsARef.current = true;
        armInterval();
      });
    };
    const cached = getCachedGalleryBannerUrls();
    if (cached?.length) {
      startCarousel(cached.map(toBgPhotoUrl), reveal);
    } else {
      void fetchGalleryBannerUrls(abort.signal)
        .then((list) => {
          if (abort.signal.aborted || gen !== generationRef.current) return;
          startCarousel(list.map(toBgPhotoUrl), reveal);
        })
        .catch(() => {
          if (abort.signal.aborted || gen !== generationRef.current) return;
          startCarousel([], reveal);
        });
    }

    return () => {
      generationRef.current += 1;
      clearCarousel();
      abort.abort();
    };
  }, [armInterval, folder]);

  useEffect(() => {
    if (!looping) {
      clearCarousel();
      return clearCarousel;
    }
    armInterval();
    return clearCarousel;
  }, [looping, armInterval]);

  const ready = (!!slotA.url && slotA.visible) || (!!slotB.url && slotB.visible);

  return { slotA, slotB, advance, ready, skipBoot: !!prepared };
};
