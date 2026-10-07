import { MOBILE_BG_FALLBACK_URL } from "@/lib/bg-photos/constants";
import { fetchGalleryBannerUrls, getCachedGalleryBannerUrls } from "@/lib/bg-photos/images";
import { calcWallCols, pickRandomWallStart, pickWallAppend, pickWallBatch } from "@/lib/bg-photos/pc-wall-layout";
import { createPcWallWave } from "@/lib/bg-photos/pc-wall-wave";
import { preloadPhoto, toPcWallPhotoUrl } from "@/lib/bg-photos/photo-utils";

import type { PcWallControllerDeps, PcWallPrepared, PcWallState, PcWallTile } from "@/lib/bg-photos/bg-photos.types";

const newTile = (url: string): PcWallTile => ({
  a: { url, phase: "front" },
  b: { url: "", phase: "wait" },
});

const loadList = async (signal: AbortSignal): Promise<string[]> => {
  const cached = getCachedGalleryBannerUrls();
  if (cached?.length) return cached;
  try {
    return await fetchGalleryBannerUrls(signal);
  } catch {
    return [];
  }
};

/**
 * PC 图墙的命令式内核：清单、首批上墙、列数增减、换图集。
 * 换图的多米诺倒牌波浪在 pc-wall-wave.ts。React 侧只通过 setTiles 拿到每格 { a, b } 两槽。
 */
export const createPcWallController = ({ setTiles, ratioRef, sizeRef }: PcWallControllerDeps) => {
  const state: PcWallState = {
    urls: [],
    shown: [],
    active: [],
    gen: 0,
    abort: new AbortController(),
    booted: false,
    syncing: false,
    waving: false,
    looping: false,
    reduced: false,
  };

  const getCols = () => calcWallCols(sizeRef.current.width, sizeRef.current.height, ratioRef.current);
  const stale = (g: number) => g !== state.gen || state.abort.signal.aborted;

  /** 视口变化后让格数跟上 getCols：多退少补，新格直接上图不倒牌；波浪进行中先不动，波浪结束后补 */
  const syncCols = async (): Promise<void> => {
    if (!state.booted || state.syncing || state.waving) return;
    state.syncing = true;
    const g = state.gen;
    try {
      while (!stale(g)) {
        const want = getCols();
        const have = state.shown.length;
        if (want === have) break;
        if (want < have) {
          state.shown = state.shown.slice(0, want);
          state.active = state.active.slice(0, want);
          setTiles((prev) => prev.slice(0, want));
          continue;
        }
        const picks = pickWallAppend(state.urls.length, state.shown, want - have);
        state.shown.push(...picks);
        state.active.push(...picks.map(() => true));
        const added = picks.map((idx) => state.urls[idx] ?? "");
        await Promise.all(added.map((url) => preloadPhoto(url, state.abort.signal)));
        if (stale(g)) break;
        setTiles((prev) => [...prev.slice(0, have), ...added.map(newTile)]);
      }
    } finally {
      if (g === state.gen) state.syncing = false;
    }
  };

  const wave = createPcWallWave(state, setTiles, () => {
    void syncCols();
  });

  /** 拉清单 → 首图 → 首批各格预载 → 一次性上墙；已有图墙（换图集）则整排波浪倒牌换成新图 */
  const load = async (prepared: PcWallPrepared): Promise<void> => {
    state.gen += 1;
    const g = state.gen;
    state.abort.abort();
    state.abort = new AbortController();
    const { signal } = state.abort;
    wave.reset();
    state.booted = false;
    state.syncing = false;
    state.waving = false;

    const raw = await loadList(signal);
    if (stale(g)) return;
    state.urls = (raw.length ? raw : [MOBILE_BG_FALLBACK_URL]).map(toPcWallPhotoUrl);
    const { urls } = state;

    // prepared.url 是手机低清 url，同一张图改用清单下标换成 PC 清晰 url
    const firstIdx =
      prepared && prepared.index >= 0 && prepared.index < urls.length
        ? prepared.index
        : pickRandomWallStart(urls.length);
    await preloadPhoto(urls[firstIdx] ?? "", signal);
    if (stale(g)) return;

    const batch = pickWallBatch(urls.length, getCols(), firstIdx);
    await Promise.all(batch.slice(1).map((i) => preloadPhoto(urls[i] ?? "", signal)));
    if (stale(g)) return;

    const prevLen = state.shown.length;
    if (prevLen === 0) {
      state.shown = batch;
      state.active = batch.map(() => true);
      state.booted = true;
      setTiles(batch.map((i) => newTile(urls[i] ?? "")));
    } else {
      // 换图集：多出的格直接上图、多余的格去掉，其余各格用波浪倒牌换成新图（新图已预载）
      const keep = Math.min(prevLen, batch.length);
      state.shown = [...state.shown.slice(0, keep), ...batch.slice(keep)];
      state.active = batch.map((_, t) => (t < keep ? (state.active[t] ?? true) : true));
      state.booted = true;
      const extra = batch.slice(keep).map((i) => newTile(urls[i] ?? ""));
      setTiles((prev) => [...prev.slice(0, keep), ...extra]);
      void wave.runWave({ preset: batch.slice(0, keep), requireLooping: false });
    }
    wave.arm();
    void syncCols();
  };

  /** 点击（清屏状态）：立即触发一整轮波浪；上一轮未结束则忽略 */
  const advance = () => {
    void wave.runWave({ requireLooping: false });
  };

  return {
    load,
    advance,
    syncCols,
    setLooping: (next: boolean) => {
      state.looping = next;
      wave.arm();
    },
    setReduced: (next: boolean) => {
      state.reduced = next;
    },
    dispose: () => {
      state.gen += 1;
      state.abort.abort();
      wave.reset();
      state.booted = false;
      state.waving = false;
    },
  };
};

export type PcWallController = ReturnType<typeof createPcWallController>;
