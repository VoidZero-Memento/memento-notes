import { useCallback, useEffect, useRef, useState } from "react";

import { fetchAllOssImages, getCachedAllOssImages } from "@/lib/bg-photos/images";
import { pickNextPhotoIndex } from "@/lib/bg-photos/photo-utils";
import { GALLERY_AUTO_INTERVAL_MS, GALLERY_FADE_MS } from "@/lib/gallery/constants";
import { emptySize, emptySlot, loadShot } from "@/lib/gallery/load-shot";
import { useKeepAliveActive } from "@/lib/keep-alive/keep-alive";
import { useSidebarBgLoop } from "@/lib/prefs/useSidebarBgLoop";

import type { OssImageMeta } from "@/lib/bg-photos/bg-photos.types";
import type { GalleryNaturalSize, GalleryPreparedShot, GallerySlot, GalleryStageStatus } from "@/lib/gallery/gallery.types";

const nextIndex = (current: number, length: number) => {
  if (length <= 0) return -1;
  if (length === 1) return 0;
  return (current + 1) % length;
};

export const useGalleryStage = () => {
  const alive = useKeepAliveActive();
  const { looping } = useSidebarBgLoop();
  const [status, setStatus] = useState<GalleryStageStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [slotA, setSlotA] = useState<GallerySlot>(emptySlot);
  const [slotB, setSlotB] = useState<GallerySlot>(emptySlot);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [backdropA, setBackdropA] = useState("");
  const [backdropB, setBackdropB] = useState("");
  const [backdropShowB, setBackdropShowB] = useState(false);
  const [busy, setBusy] = useState(false);
  const [naturalSize, setNaturalSize] = useState<GalleryNaturalSize>(emptySize);

  const photosRef = useRef<OssImageMeta[]>([]);
  const lastIndexRef = useRef(-1);
  const activeIsARef = useRef(true);
  const backdropIsBRef = useRef(false);
  const generationRef = useRef(0);
  const busyRef = useRef(false);
  const fadeTimerRef = useRef(0);
  const prefetchTimerRef = useRef(0);
  const preparedRef = useRef<GalleryPreparedShot | null>(null);
  const prepareTaskRef = useRef<Promise<GalleryPreparedShot | null> | null>(null);

  const commitIndex = useCallback((idx: number) => {
    lastIndexRef.current = idx;
    setIndex(idx);
  }, []);

  const swapBackdrop = useCallback((url: string) => {
    if (backdropIsBRef.current) {
      setBackdropA(url);
      setBackdropShowB(false);
      backdropIsBRef.current = false;
      return;
    }
    setBackdropB(url);
    setBackdropShowB(true);
    backdropIsBRef.current = true;
  }, []);

  const queueNext = useCallback((excludeIdx: number, gen: number, signal?: AbortSignal) => {
    const photos = photosRef.current;
    if (photos.length <= 1) return;
    const idx = nextIndex(excludeIdx, photos.length);
    const task = loadShot(photos, idx, signal).then((shot) => {
      if (!shot || gen !== generationRef.current) return null;
      preparedRef.current = shot;
      return shot;
    });
    prepareTaskRef.current = task;
  }, []);

  const takePrepared = useCallback(async (gen: number) => {
    const ready = preparedRef.current;
    if (ready) {
      preparedRef.current = null;
      prepareTaskRef.current = null;
      return ready;
    }
    const pending = prepareTaskRef.current;
    prepareTaskRef.current = null;
    if (pending) {
      const shot = await pending;
      preparedRef.current = null;
      if (shot && gen === generationRef.current) return shot;
    }
    const photos = photosRef.current;
    const idx = nextIndex(lastIndexRef.current, photos.length);
    const shot = await loadShot(photos, idx);
    if (shot && gen === generationRef.current) return shot;
    return null;
  }, []);

  const settleLeaving = useCallback(() => {
    setSlotA((prev) => (prev.motion === "leave" ? emptySlot() : prev));
    setSlotB((prev) => (prev.motion === "leave" ? emptySlot() : prev));
  }, []);

  const playShot = useCallback((shot: GalleryPreparedShot, runGen: number) => {
    window.clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = window.setTimeout(() => {
      if (runGen !== generationRef.current) return;
      settleLeaving();
      busyRef.current = false;
      setBusy(false);
    }, GALLERY_FADE_MS);

    if (activeIsARef.current) {
      setSlotA((prev) => (prev.url ? { ...prev, motion: "leave" } : prev));
      setSlotB({ url: shot.url, motion: "show" });
      activeIsARef.current = false;
    } else {
      setSlotB((prev) => (prev.url ? { ...prev, motion: "leave" } : prev));
      setSlotA({ url: shot.url, motion: "show" });
      activeIsARef.current = true;
    }

    commitIndex(shot.idx);
    setNaturalSize(shot.size);
    swapBackdrop(shot.url);
    queueNext(shot.idx, runGen);
  }, [commitIndex, queueNext, settleLeaving, swapBackdrop]);

  const advance = useCallback(() => {
    if (busyRef.current || status !== "ready") return;
    const photos = photosRef.current;
    if (photos.length <= 1) return;

    const runGen = generationRef.current;
    busyRef.current = true;
    setBusy(true);

    const run = async () => {
      const shot = await takePrepared(runGen);
      if (!shot || runGen !== generationRef.current) {
        busyRef.current = false;
        setBusy(false);
        return;
      }
      playShot(shot, runGen);
    };

    void run();
  }, [playShot, status, takePrepared]);

  const boot = useCallback((signal: AbortSignal) => {
    generationRef.current += 1;
    const gen = generationRef.current;
    busyRef.current = false;
    preparedRef.current = null;
    prepareTaskRef.current = null;
    window.clearTimeout(prefetchTimerRef.current);
    setBusy(false);
    setStatus("loading");
    setError(null);
    setBackdropA("");
    setBackdropB("");
    setBackdropShowB(false);
    backdropIsBRef.current = false;
    setNaturalSize(emptySize());

    const startWith = async (photos: OssImageMeta[]) => {
      if (signal.aborted || gen !== generationRef.current) return;
      if (!photos.length) {
        setStatus("error");
        setError("展台暂无图片");
        return;
      }

      photosRef.current = photos;
      setTotal(photos.length);

      const idx = pickNextPhotoIndex(photos.length, -1);
      const shot = await loadShot(photos, idx, signal);
      if (!shot || signal.aborted || gen !== generationRef.current) return;

      commitIndex(shot.idx);
      setNaturalSize(shot.size);
      setBackdropA(shot.url);
      setSlotA({ url: shot.url, motion: "show" });
      setSlotB(emptySlot());
      activeIsARef.current = true;
      setStatus("ready");
      window.clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = window.setTimeout(() => {
        if (gen !== generationRef.current) return;
        queueNext(shot.idx, gen, signal);
      }, 240);
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
        setError(err instanceof Error ? err.message : "展台加载失败");
      });
  }, [commitIndex, queueNext]);

  useEffect(() => {
    const abort = new AbortController();
    boot(abort.signal);
    return () => {
      generationRef.current += 1;
      abort.abort();
      window.clearTimeout(fadeTimerRef.current);
      window.clearTimeout(prefetchTimerRef.current);
    };
  }, [boot]);

  const retry = useCallback(() => {
    window.clearTimeout(fadeTimerRef.current);
    boot(new AbortController().signal);
  }, [boot]);

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    if (!alive || !looping || status !== "ready") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      advanceRef.current();
    }, GALLERY_AUTO_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [alive, index, looping, status]);

  return {
    status,
    error,
    slotA,
    slotB,
    backdropA,
    backdropB,
    backdropShowB,
    index,
    total,
    naturalSize,
    busy,
    advance,
    settleLeaving,
    retry,
  };
};
