import { useCallback, useEffect, useRef, useState } from "react";

import { fetchAllOssImages, getCachedAllOssImages } from "@/lib/bg-photos/images";
import { pickNextPhotoIndex, toSatPhotoUrl } from "@/lib/bg-photos/photo-utils";
import { GALLERY_FADE_MS } from "@/lib/gallery/constants";
import { afterPaint, emptySize, emptySlot, loadShot } from "@/lib/gallery/load-shot";

import type { OssImageMeta } from "@/lib/bg-photos/bg-photos.types";
import type { GalleryNaturalSize, GalleryPreparedShot, GallerySlot, GalleryStageStatus } from "@/lib/gallery/gallery.types";

export const useGalleryStage = () => {
  const [status, setStatus] = useState<GalleryStageStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [slotA, setSlotA] = useState<GallerySlot>(emptySlot);
  const [slotB, setSlotB] = useState<GallerySlot>(emptySlot);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [naturalSize, setNaturalSize] = useState<GalleryNaturalSize>(emptySize);
  const [backdropA, setBackdropA] = useState("");
  const [backdropB, setBackdropB] = useState("");
  const [backdropShowB, setBackdropShowB] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasShuffled, setHasShuffled] = useState(false);
  const [orbitTick, setOrbitTick] = useState(0);

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
      afterPaint(() => {
        setBackdropShowB(false);
        backdropIsBRef.current = false;
      });
      return;
    }
    setBackdropB(url);
    afterPaint(() => {
      setBackdropShowB(true);
      backdropIsBRef.current = true;
    });
  }, []);

  const queueNext = useCallback((excludeIdx: number, gen: number, signal?: AbortSignal) => {
    const photos = photosRef.current;
    if (photos.length <= 1) return;
    const idx = pickNextPhotoIndex(photos.length, excludeIdx);
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
    const idx = pickNextPhotoIndex(photos.length, lastIndexRef.current);
    const shot = await loadShot(photos, idx);
    if (shot && gen === generationRef.current) return shot;
    return null;
  }, []);

  const settleLeaving = useCallback(() => {
    setSlotA((prev) => (prev.motion === "leave" ? emptySlot() : prev));
    setSlotB((prev) => (prev.motion === "leave" ? emptySlot() : prev));
  }, []);

  const playShot = useCallback((shot: GalleryPreparedShot, runGen: number, onReveal?: () => void) => {
    const finishSwap = () => {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = window.setTimeout(() => {
        if (runGen !== generationRef.current) return;
        settleLeaving();
        busyRef.current = false;
        setBusy(false);
      }, GALLERY_FADE_MS);
    };

    const reveal = () => {
      if (runGen !== generationRef.current) return;
      commitIndex(shot.idx);
      swapBackdrop(shot.backdrop);
      setNaturalSize(shot.size);
      onReveal?.();
    };

    if (activeIsARef.current) {
      setSlotB({ url: shot.url, motion: "enter" });
      afterPaint(() => {
        if (runGen !== generationRef.current) return;
        setSlotA((prev) => ({ ...prev, motion: "leave" }));
        setSlotB({ url: shot.url, motion: "show" });
        activeIsARef.current = false;
        reveal();
        finishSwap();
        queueNext(shot.idx, runGen);
      });
      return;
    }

    setSlotA({ url: shot.url, motion: "enter" });
    afterPaint(() => {
      if (runGen !== generationRef.current) return;
      setSlotB((prev) => ({ ...prev, motion: "leave" }));
      setSlotA({ url: shot.url, motion: "show" });
      activeIsARef.current = true;
      reveal();
      finishSwap();
      queueNext(shot.idx, runGen);
    });
  }, [commitIndex, queueNext, settleLeaving, swapBackdrop]);

  const shuffle = useCallback(() => {
    if (busyRef.current || status !== "ready") return;

    const photos = photosRef.current;
    if (photos.length <= 1) return;

    const runGen = generationRef.current;
    busyRef.current = true;
    setBusy(true);
    setHasShuffled(true);
    setOrbitTick((n) => n + 1);

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

  const adoptIndex = useCallback((idx: number, onReveal?: () => void) => {
    if (busyRef.current || status !== "ready") return;
    if (idx === lastIndexRef.current) return;

    const photos = photosRef.current;
    if (!photos[idx]) return;

    const runGen = generationRef.current;
    busyRef.current = true;
    setBusy(true);
    setHasShuffled(true);

    const run = async () => {
      const readyShot = preparedRef.current?.idx === idx ? preparedRef.current : null;
      if (readyShot) {
        preparedRef.current = null;
        prepareTaskRef.current = null;
      }
      const shot = readyShot ?? (await loadShot(photos, idx));
      if (!shot || runGen !== generationRef.current) {
        busyRef.current = false;
        setBusy(false);
        return;
      }
      playShot(shot, runGen, onReveal);
    };

    void run();
  }, [playShot, status]);

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
    setHasShuffled(false);
    setNaturalSize(emptySize());
    setBackdropA("");
    setBackdropB("");
    setBackdropShowB(false);
    backdropIsBRef.current = false;

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
      const shot = await loadShot(photos, idx, signal);
      if (!shot || signal.aborted || gen !== generationRef.current) return;

      commitIndex(shot.idx);
      setBackdropA(shot.backdrop);
      setNaturalSize(shot.size);
      setSlotA({ url: shot.url, motion: "enter" });
      setSlotB(emptySlot());
      activeIsARef.current = true;
      setStatus("ready");
      afterPaint(() => {
        if (gen !== generationRef.current) return;
        setSlotA({ url: shot.url, motion: "show" });
      });
      window.clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = window.setTimeout(() => {
        if (gen !== generationRef.current) return;
        queueNext(shot.idx, gen, signal);
      }, 720);
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
    hasShuffled,
    orbitTick,
    heroSatUrl: photosRef.current[index] ? toSatPhotoUrl(photosRef.current[index].url) : "",
    shuffle,
    adoptIndex,
    settleLeaving,
    retry,
  };
};
