import { useEffect, useState } from "react";

import { fetchAllOssImages } from "@/lib/bg-photos/images";
import { HALL_PROBE_CONCURRENCY } from "@/lib/gallery/constants";
import { hallSizeCacheKey, toHallPhoto } from "@/lib/gallery/hall-photo";
import { peekHallSize, probeHallSize, rememberHallSize } from "@/lib/gallery/probe-hall-size";

import type { OssImageMeta } from "@/lib/bg-photos/bg-photos.types";
import type { HallNaturalSize, HallPhoto } from "@/lib/gallery/hall.types";

type HallCatalogState = {
  error: string | null;
  photos: HallPhoto[];
  status: "loading" | "error" | "ready";
};

const empty: HallCatalogState = { error: null, photos: [], status: "loading" };

const publishReady = (
  metas: OssImageMeta[],
  sizes: Map<string, HallNaturalSize>,
  failed: Set<string>,
): HallPhoto[] => {
  const photos: HallPhoto[] = [];
  for (const meta of metas) {
    const key = hallSizeCacheKey(meta);
    if (failed.has(key)) continue;
    const size = sizes.get(key);
    if (!size) break;
    photos.push(toHallPhoto(meta, size));
  }
  return photos;
};

export const useHallCatalog = () => {
  const [state, setState] = useState<HallCatalogState>(empty);

  useEffect(() => {
    const abort = new AbortController();
    let cancelled = false;
    let frame = 0;

    const run = async () => {
      try {
        const metas = await fetchAllOssImages(abort.signal);
        if (cancelled || abort.signal.aborted) return;

        const sizes = new Map<string, HallNaturalSize>();
        const failed = new Set<string>();
        const pending: OssImageMeta[] = [];
        for (const meta of metas) {
          const cached = peekHallSize(hallSizeCacheKey(meta));
          if (cached) sizes.set(hallSizeCacheKey(meta), cached);
          else pending.push(meta);
        }

        const publish = () => publishReady(metas, sizes, failed);

        const push = () => {
          if (cancelled || frame) return;
          frame = window.requestAnimationFrame(() => {
            frame = 0;
            if (cancelled) return;
            const photos = publish();
            setState({ error: null, photos, status: photos.length > 0 ? "ready" : "loading" });
          });
        };

        push();

        let cursor = 0;
        const workers = Array.from({ length: Math.min(HALL_PROBE_CONCURRENCY, pending.length) }, async () => {
          while (!cancelled && !abort.signal.aborted) {
            const index = cursor;
            cursor += 1;
            const meta = pending[index];
            if (!meta) return;
            const key = hallSizeCacheKey(meta);
            const size = await probeHallSize(meta.url, abort.signal);
            if (cancelled || abort.signal.aborted) return;
            if (!size) {
              failed.add(key);
              push();
              continue;
            }
            rememberHallSize(key, size);
            sizes.set(key, size);
            push();
          }
        });

        await Promise.all(workers);
        if (cancelled || abort.signal.aborted) return;
        window.cancelAnimationFrame(frame);

        const photos = publish();
        if (photos.length === 0) {
          setState({ error: "UNABLE TO LOAD", photos: [], status: "error" });
          return;
        }
        setState({ error: null, photos, status: "ready" });
      } catch (err) {
        if (cancelled || abort.signal.aborted) return;
        const message = err instanceof Error ? err.message : "UNABLE TO LOAD";
        setState({ error: message, photos: [], status: "error" });
      }
    };

    void run();
    return () => {
      cancelled = true;
      abort.abort();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return state;
};
