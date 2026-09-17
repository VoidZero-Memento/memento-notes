import { useCallback, useEffect, useRef, useState } from "react";

import { sleep } from "@/lib/bg-photos/photo-utils";
import { useOssFolder } from "@/lib/bg-photos/useOssFolder";
import { GALLERY_AUTO_INTERVAL_MS } from "@/lib/gallery/constants";
import { PAINT_WAIT_MS, createPaintGate, fadeLockMs } from "@/lib/gallery/gallery-paint-gate";
import { afterPaint, emptySlot, loadShot, nextShotIndex, prefetchShots, upcomingShotIndexes } from "@/lib/gallery/load-shot";
import { startGalleryStage } from "@/lib/gallery/start-gallery-stage";
import { useGalleryBackdrop } from "@/lib/gallery/use-gallery-backdrop";
import { useKeepAliveActive } from "@/lib/keep-alive/keep-alive";
import { useSidebarBgLoop } from "@/lib/prefs/useSidebarBgLoop";

import type { OssImageMeta } from "@/lib/bg-photos/bg-photos.types";
import type { GalleryPreparedShot, GallerySlot, GalleryStageStatus } from "@/lib/gallery/gallery.types";

export const useGalleryStage = () => {
  const alive = useKeepAliveActive();
  const { folder } = useOssFolder();
  const { looping } = useSidebarBgLoop();
  const [status, setStatus] = useState<GalleryStageStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [slotA, setSlotA] = useState<GallerySlot>(emptySlot);
  const [slotB, setSlotB] = useState<GallerySlot>(emptySlot);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const backdrop = useGalleryBackdrop();
  const backdropRef = useRef(backdrop);
  backdropRef.current = backdrop;

  const photosRef = useRef<OssImageMeta[]>([]);
  const lastIndexRef = useRef(-1);
  const activeIsARef = useRef(true);
  const generationRef = useRef(0);
  const busyRef = useRef(false);
  const fadeTimerRef = useRef(0);
  const incomingRef = useRef<GalleryPreparedShot | null>(null);
  const prepareTaskRef = useRef<Promise<GalleryPreparedShot | null> | null>(null);
  const slotARef = useRef(slotA);
  const slotBRef = useRef(slotB);
  const paintGateRef = useRef(createPaintGate());
  const bootPendingRef = useRef<{ url: string; gen: number } | null>(null);

  slotARef.current = slotA;
  slotBRef.current = slotB;

  const commitIndex = useCallback((idx: number) => {
    lastIndexRef.current = idx;
    setIndex(idx);
  }, []);

  const fillInactive = (slot: GallerySlot) => {
    if (activeIsARef.current) setSlotB(slot);
    else setSlotA(slot);
  };

  const queueNext = useCallback((excludeIdx: number, gen: number, signal?: AbortSignal) => {
    const photos = photosRef.current;
    const idxs = upcomingShotIndexes(excludeIdx, photos.length);
    if (!idxs.length) return;
    prefetchShots(photos, idxs);
    if (incomingRef.current || prepareTaskRef.current) return;

    const task = loadShot(photos, idxs[0], signal).then((shot) => {
      const claimed = prepareTaskRef.current === task;
      if (claimed) prepareTaskRef.current = null;
      if (!shot || gen !== generationRef.current) return null;
      if (!claimed) return shot;
      incomingRef.current = shot;
      fillInactive({ url: shot.url, motion: "enter", size: shot.size });
      backdropRef.current.arm(shot.backdropUrl);
      return shot;
    });
    prepareTaskRef.current = task;
  }, []);

  const takePrepared = useCallback(async (gen: number) => {
    const ready = incomingRef.current;
    if (ready) {
      incomingRef.current = null;
      prepareTaskRef.current = null;
      return ready;
    }
    const pending = prepareTaskRef.current;
    prepareTaskRef.current = null;
    if (pending) {
      const shot = await pending;
      incomingRef.current = null;
      if (shot && gen === generationRef.current) return shot;
    }
    const photos = photosRef.current;
    const shot = await loadShot(photos, nextShotIndex(lastIndexRef.current, photos.length));
    if (shot && gen === generationRef.current) return shot;
    return null;
  }, []);

  const armUnlock = useCallback(
    (runGen: number) => {
      window.clearTimeout(fadeTimerRef.current);
      void afterPaint(() => {
        if (runGen !== generationRef.current) return;
        fadeTimerRef.current = window.setTimeout(() => {
          if (runGen !== generationRef.current) return;
          busyRef.current = false;
          setBusy(false);
          queueNext(lastIndexRef.current, runGen);
        }, fadeLockMs());
      });
    },
    [queueNext],
  );

  const playShot = useCallback(
    (shot: GalleryPreparedShot, runGen: number) => {
      const show = (prev: GallerySlot): GallerySlot =>
        prev.url === shot.url ? { ...prev, motion: "show" } : { url: shot.url, motion: "show", size: shot.size };

      if (activeIsARef.current) {
        setSlotA((prev) => (prev.url ? { ...prev, motion: "leave" } : prev));
        setSlotB(show);
        activeIsARef.current = false;
      } else {
        setSlotB((prev) => (prev.url ? { ...prev, motion: "leave" } : prev));
        setSlotA(show);
        activeIsARef.current = true;
      }

      incomingRef.current = null;
      setBusy(true);
      commitIndex(shot.idx);
      backdropRef.current.play();
      armUnlock(runGen);
    },
    [armUnlock, commitIndex],
  );

  const onSlotPainted = useCallback(
    (url: string) => {
      paintGateRef.current.mark(url);
      const boot = bootPendingRef.current;
      if (!boot || boot.url !== url) return;
      bootPendingRef.current = null;
      const runGen = boot.gen;
      void afterPaint(() => {
        if (runGen !== generationRef.current) return;
        setSlotA((prev) => (prev.url === url ? { ...prev, motion: "show" } : prev));
        backdropRef.current.reveal();
        setStatus("ready");
        busyRef.current = true;
        setBusy(true);
        armUnlock(runGen);
        queueNext(lastIndexRef.current, runGen);
      });
    },
    [armUnlock, queueNext],
  );

  const onSlotPaintedRef = useRef(onSlotPainted);
  onSlotPaintedRef.current = onSlotPainted;

  const advance = useCallback(() => {
    if (busyRef.current || status !== "ready") return false;
    const photos = photosRef.current;
    if (photos.length <= 1) return false;

    const runGen = generationRef.current;
    const idle = activeIsARef.current ? slotBRef.current : slotARef.current;
    const prepared = incomingRef.current;
    const buffered =
      !!prepared && idle.url === prepared.url && idle.motion === "enter" &&
      paintGateRef.current.has(prepared.url) && paintGateRef.current.has(prepared.backdropUrl);

    busyRef.current = true;
    if (buffered) {
      playShot(prepared, runGen);
      return true;
    }

    const run = async () => {
      let shot = prepared ?? (await takePrepared(runGen));
      if (!shot || runGen !== generationRef.current) {
        busyRef.current = false;
        setBusy(false);
        return;
      }
      if (idle.url !== shot.url || idle.motion !== "enter") {
        incomingRef.current = shot;
        fillInactive({ url: shot.url, motion: "enter", size: shot.size });
        backdropRef.current.arm(shot.backdropUrl);
        await Promise.race([
          Promise.all([paintGateRef.current.wait(shot.url), paintGateRef.current.wait(shot.backdropUrl)]),
          sleep(PAINT_WAIT_MS),
        ]);
        if (runGen !== generationRef.current) return;
        await afterPaint();
        if (runGen !== generationRef.current) return;
      }
      playShot(shot, runGen);
    };

    void run();
    return true;
  }, [playShot, status, takePrepared]);

  const boot = useCallback(
    (signal: AbortSignal) => {
      generationRef.current += 1;
      const gen = generationRef.current;
      busyRef.current = false;
      incomingRef.current = null;
      prepareTaskRef.current = null;
      bootPendingRef.current = null;
      paintGateRef.current.reset();
      window.clearTimeout(fadeTimerRef.current);
      setBusy(false);
      setStatus("loading");
      setError(null);
      backdropRef.current.reset();
      setSlotA(emptySlot());
      setSlotB(emptySlot());
      activeIsARef.current = true;
      void folder;
      void startGalleryStage(signal, gen, generationRef).then((result) => {
        if (!result || gen !== generationRef.current) return;
        if ("error" in result) {
          setStatus("error");
          setError(result.error);
          return;
        }

        photosRef.current = result.photos;
        setTotal(result.photos.length);
        commitIndex(result.shot.idx);
        backdropRef.current.boot(result.shot.backdropUrl);
        setSlotA({ url: result.shot.url, motion: "enter", size: result.shot.size });
        setSlotB(emptySlot());
        activeIsARef.current = true;
        bootPendingRef.current = { url: result.shot.url, gen };
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = window.setTimeout(() => {
          onSlotPaintedRef.current(result.shot.url);
        }, PAINT_WAIT_MS);
      });
    },
    [commitIndex, folder],
  );

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
    backdropA: backdrop.slotA,
    backdropB: backdrop.slotB,
    backdropShowA: backdrop.showA,
    backdropShowB: backdrop.showB,
    backdropFrontIsB: backdrop.frontIsB,
    index,
    total,
    busy,
    advance,
    onSlotPainted,
    retry,
  };
};
