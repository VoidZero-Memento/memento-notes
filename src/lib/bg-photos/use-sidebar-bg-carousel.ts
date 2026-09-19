import { useCallback, useEffect, useRef, useState } from "react";

import { MOBILE_BG_FADE_MS, MOBILE_BG_FALLBACK_URL, SIDEBAR_BG_INTERVAL_MS } from "@/lib/bg-photos/constants";
import { fetchGalleryBannerUrls, getCachedGalleryBannerUrls } from "@/lib/bg-photos/images";
import { pickNextPhotoIndex, preloadPhoto, toBgPhotoUrl } from "@/lib/bg-photos/photo-utils";
import { runBgCrossfade } from "@/lib/bg-photos/run-bg-crossfade";
import { useOssFolder } from "@/lib/bg-photos/useOssFolder";

import type { BgPhotoSlot } from "@/lib/bg-photos/bg-photos.types";
import type { BgCrossfadeRefs } from "@/lib/bg-photos/run-bg-crossfade";

const emptySlot = (): BgPhotoSlot => ({ url: "", visible: false });

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

type UseSidebarBgCarouselOptions = {
  looping: boolean;
};

/** 侧栏 / 手机菜单独立底图：单张 cover、随机切。仅在对应 UI 挂载时启用。 */
export const useSidebarBgCarousel = ({ looping }: UseSidebarBgCarouselOptions) => {
  const { folder } = useOssFolder();
  const [slotA, setSlotA] = useState<BgPhotoSlot>(emptySlot);
  const [slotB, setSlotB] = useState<BgPhotoSlot>(emptySlot);

  const urlsRef = useRef<string[]>([]);
  const lastIndexRef = useRef(-1);
  const generationRef = useRef(0);
  const loopingRef = useRef(looping);
  const activeIsARef = useRef(true);
  const busyRef = useRef(false);
  const intervalRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const folderRef = useRef(folder);
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

  const fadeMs = () => (reducedRef.current ? 0 : MOBILE_BG_FADE_MS);

  const armInterval = useCallback(() => {
    window.clearInterval(intervalRef.current);
    intervalRef.current = 0;
    if (reducedRef.current || urlsRef.current.length <= 1 || !loopingRef.current) return;
    intervalRef.current = window.setInterval(() => {
      void runBgCrossfade(fadeRefsRef.current, true, abortRef.current?.signal, { fadeMs: fadeMs() });
    }, SIDEBAR_BG_INTERVAL_MS);
  }, []);

  useEffect(() => {
    reducedRef.current = window.matchMedia(REDUCED_QUERY).matches;
    const abort = new AbortController();
    abortRef.current = abort;
    generationRef.current += 1;
    const gen = generationRef.current;
    const folderChanged = folderRef.current !== folder;
    folderRef.current = folder;

    const startCarousel = (photoUrls: string[]) => {
      if (gen !== generationRef.current) return;
      const urls = photoUrls.length ? photoUrls : [toBgPhotoUrl(MOBILE_BG_FALLBACK_URL)];
      urlsRef.current = urls;

      if (folderChanged && lastIndexRef.current >= 0) {
        lastIndexRef.current = -1;
        void runBgCrossfade(fadeRefsRef.current, false, abort.signal, {
          allowSingle: true,
          fadeMs: fadeMs(),
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
      startCarousel(cached.map(toBgPhotoUrl));
    } else {
      void fetchGalleryBannerUrls(abort.signal)
        .then((list) => {
          if (abort.signal.aborted || gen !== generationRef.current) return;
          startCarousel(list.map(toBgPhotoUrl));
        })
        .catch(() => {
          if (abort.signal.aborted || gen !== generationRef.current) return;
          startCarousel([]);
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

  return { slotA, slotB };
};
