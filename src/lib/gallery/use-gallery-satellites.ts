import { useCallback, useEffect, useRef, useState } from "react";

import { getCachedAllOssImages } from "@/lib/bg-photos/images";
import { toSatPhotoUrl } from "@/lib/bg-photos/photo-utils";
import { prefetchShots } from "@/lib/gallery/load-shot";

import type { GallerySatellite } from "@/lib/gallery/gallery.types";

const SAT_FADE_MS = 420;
const SAT_ENTER_DELAY = 80;

const pickDistinct = (length: number, count: number, exclude: number): number[] => {
  const used = new Set<number>();
  if (exclude >= 0) used.add(exclude);
  const picks: number[] = [];
  const target = Math.min(count, Math.max(0, length - 1));
  let guard = 0;
  while (picks.length < target && guard < length * 8) {
    const i = Math.floor(Math.random() * length);
    if (!used.has(i)) {
      used.add(i);
      picks.push(i);
    }
    guard += 1;
  }
  return picks;
};

/** 环绕主图的卫星小图：背景切图时重掷，与主图对换时只替换被点的那张 */
export const useGallerySatellites = (count: number, excludeIdx: number, ready: boolean, orbitTick: number) => {
  const [satellites, setSatellites] = useState<GallerySatellite[]>([]);
  const [shown, setShown] = useState(false);
  const genRef = useRef(0);
  const hadRef = useRef(false);
  const timerRef = useRef(0);
  const excludeRef = useRef(excludeIdx);
  excludeRef.current = excludeIdx;

  useEffect(() => {
    const gen = (genRef.current += 1);
    window.clearTimeout(timerRef.current);

    const photos = getCachedAllOssImages();
    const usable = ready && count > 0 && !!photos && photos.length > 1;

    if (!usable) {
      setShown(false);
      if (hadRef.current) {
        timerRef.current = window.setTimeout(() => {
          if (gen !== genRef.current) return;
          setSatellites([]);
          hadRef.current = false;
        }, SAT_FADE_MS);
      } else {
        setSatellites([]);
      }
      return;
    }

    setShown(false);

    const build = () => {
      const list = photos as NonNullable<typeof photos>;
      const idxs = pickDistinct(list.length, count, excludeRef.current);
      const items = idxs.map((i) => ({
        key: `${gen}-${list[i].name}`,
        idx: i,
        url: toSatPhotoUrl(list[i].url),
      }));
      if (gen !== genRef.current) return;
      setSatellites(items);
      hadRef.current = items.length > 0;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (gen === genRef.current) setShown(true);
        });
      });
      prefetchShots(list, idxs);
    };

    timerRef.current = window.setTimeout(build, hadRef.current ? SAT_FADE_MS : SAT_ENTER_DELAY);

    return () => window.clearTimeout(timerRef.current);
  }, [count, orbitTick, ready]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const swapSatellite = useCallback((slotIndex: number, incoming: GallerySatellite) => {
    setSatellites((prev) => prev.map((sat, i) => (i === slotIndex ? incoming : sat)));
  }, []);

  return { satellites, shown, swapSatellite };
};
