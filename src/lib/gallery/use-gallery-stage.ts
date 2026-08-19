import { useCallback, useEffect, useRef, useState } from "react";

import { fetchAllOssImages, getCachedAllOssImages } from "@/lib/bg-photos/images";
import { pickNextPhotoIndex, preloadPhoto, toBgPhotoUrl, toGalleryPhotoUrl } from "@/lib/bg-photos/photo-utils";
import { GALLERY_FADE_MS } from "@/lib/gallery/constants";

import type { BgPhotoSlot, OssImageMeta } from "@/lib/bg-photos/bg-photos.types";
import type { GalleryStageStatus } from "@/lib/gallery/gallery.types";

const emptySlot = (): BgPhotoSlot => ({ url: "", visible: false });

const labelOf = (name: string): string => name.replace(/\.[^.]+$/, "");

export const useGalleryStage = () => {
  const [status, setStatus] = useState<GalleryStageStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [slotA, setSlotA] = useState<BgPhotoSlot>(emptySlot);
  const [slotB, setSlotB] = useState<BgPhotoSlot>(emptySlot);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [label, setLabel] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasShuffled, setHasShuffled] = useState(false);

  const photosRef = useRef<OssImageMeta[]>([]);
  const lastIndexRef = useRef(-1);
  const activeIsARef = useRef(true);
  const generationRef = useRef(0);
  const busyRef = useRef(false);
  const fadeTimerRef = useRef(0);

  const applyPhoto = useCallback((idx: number, meta: OssImageMeta) => {
    lastIndexRef.current = idx;
    setIndex(idx);
    setLabel(labelOf(meta.name));
    setBackdropUrl(toBgPhotoUrl(meta.url));
  }, []);

  const shuffle = useCallback(() => {
    if (busyRef.current || status !== "ready") return;

    const photos = photosRef.current;
    if (photos.length <= 1) return;

    const runGen = generationRef.current;
    const idx = pickNextPhotoIndex(photos.length, lastIndexRef.current);
    const meta = photos[idx];
    if (!meta) return;

    const nextUrl = toGalleryPhotoUrl(meta.url);
    busyRef.current = true;
    setBusy(true);
    setHasShuffled(true);

    const finishBusy = () => {
      if (runGen !== generationRef.current) return;
      busyRef.current = false;
      setBusy(false);
    };

    const reveal = () => {
      if (runGen !== generationRef.current) return;
      applyPhoto(idx, meta);
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = window.setTimeout(finishBusy, GALLERY_FADE_MS);
    };

    const run = async () => {
      await preloadPhoto(nextUrl);
      if (runGen !== generationRef.current) return;

      if (activeIsARef.current) {
        setSlotB({ url: nextUrl, visible: false });
        requestAnimationFrame(() => {
          if (runGen !== generationRef.current) return;
          setSlotA((prev) => ({ ...prev, visible: false }));
          setSlotB({ url: nextUrl, visible: true });
          activeIsARef.current = false;
          reveal();
        });
        return;
      }

      setSlotA({ url: nextUrl, visible: false });
      requestAnimationFrame(() => {
        if (runGen !== generationRef.current) return;
        setSlotB((prev) => ({ ...prev, visible: false }));
        setSlotA({ url: nextUrl, visible: true });
        activeIsARef.current = true;
        reveal();
      });
    };

    void run();
  }, [applyPhoto, status]);

  const boot = useCallback((signal: AbortSignal) => {
    generationRef.current += 1;
    const gen = generationRef.current;
    busyRef.current = false;
    setBusy(false);
    setStatus("loading");
    setError(null);
    setHasShuffled(false);

    const startWith = async (photos: OssImageMeta[]) => {
      if (signal.aborted || gen !== generationRef.current) return;
      if (!photos.length) {
        setStatus("error");
        setError("画廊暂无图片");
        return;
      }

      photosRef.current = photos;
      setTotal(photos.length);

      const idx = pickNextPhotoIndex(photos.length, -1);
      const meta = photos[idx] ?? photos[0];
      const url = toGalleryPhotoUrl(meta.url);
      await preloadPhoto(url, signal);
      if (signal.aborted || gen !== generationRef.current) return;

      applyPhoto(idx, meta);
      setSlotA({ url, visible: true });
      setSlotB(emptySlot());
      activeIsARef.current = true;
      setStatus("ready");
    };

    const cached = getCachedAllOssImages();
    if (cached?.length) {
      void startWith(cached);
      return;
    }

    void fetchAllOssImages(signal)
      .then((photos) => startWith(photos))
      .catch((err) => {
        if (signal.aborted || gen !== generationRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "画廊加载失败");
      });
  }, [applyPhoto]);

  useEffect(() => {
    const abort = new AbortController();
    boot(abort.signal);
    return () => {
      generationRef.current += 1;
      abort.abort();
      window.clearTimeout(fadeTimerRef.current);
    };
  }, [boot]);

  const retry = useCallback(() => {
    window.clearTimeout(fadeTimerRef.current);
    boot(new AbortController().signal);
  }, [boot]);

  return { status, error, slotA, slotB, backdropUrl, index, total, label, busy, hasShuffled, shuffle, retry };
};
