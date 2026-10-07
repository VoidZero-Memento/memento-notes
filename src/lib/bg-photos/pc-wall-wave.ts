import { PC_WALL_FLIP_MS, PC_WALL_PRELOAD_TIMEOUT_MS, PC_WALL_STAGGER_MS, PC_WALL_WAVE_GAP_MS } from "@/lib/bg-photos/constants";
import { pickWaveBatch } from "@/lib/bg-photos/pc-wall-layout";
import { preloadPhoto, sleep } from "@/lib/bg-photos/photo-utils";

import type { PcWallSlot, PcWallState, PcWallTile } from "@/lib/bg-photos/bg-photos.types";
import type { Dispatch, SetStateAction } from "react";

/** 倒下结束后再留一点余量才交接/清旧槽，避免缓动尾巴被截 */
const CLEAR_PAD_MS = 60;

const emptySlot = (): PcWallSlot => ({ url: "", phase: "wait" });

/** 倒牌结束的交接：倒下的清空释放内存；底层新图升为上层牌 */
const settleSlot = (slot: PcWallSlot): PcWallSlot => {
  if (slot.phase === "gone") return emptySlot();
  return slot.url ? { ...slot, phase: "front" } : slot;
};

const nextFrames = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/** 整轮新图预载+解码；任一张失败或超时都算失败（跳过这一轮） */
const preloadAll = (urls: string[], signal: AbortSignal): Promise<boolean> =>
  new Promise((resolve) => {
    const id = window.setTimeout(() => resolve(false), PC_WALL_PRELOAD_TIMEOUT_MS);
    void Promise.all(urls.map((url) => preloadPhoto(url, signal))).then((sizes) => {
      window.clearTimeout(id);
      resolve(sizes.every((size) => size.width > 0));
    });
  });

type RunWaveOptions = {
  /** 已预载好的整轮新图下标（换图集时用）；缺省则现挑现载 */
  preset?: number[];
  /** 自动轮播触发：要求仍在 looping */
  requireLooping: boolean;
};

/**
 * 多米诺波浪：整排从左到右，相邻格错开 STAGGER 依次倒牌（旧图绕底边向后倒下，露出底层新图），
 * 一轮结束后停顿 WAVE_GAP 再开下一轮。
 * 状态都在 PcWallState 里，换图集/卸载靠 gen 与 abort 作废。
 */
export const createPcWallWave = (
  state: PcWallState,
  setTiles: Dispatch<SetStateAction<PcWallTile[]>>,
  onIdle: () => void,
) => {
  let loopRunning = false;

  const stale = (g: number) => g !== state.gen || state.abort.signal.aborted;

  const runWave = async ({ preset, requireLooping }: RunWaveOptions): Promise<boolean> => {
    if (!state.booted || state.syncing || state.waving) return false;
    if (!preset && state.urls.length <= 1) return false;
    if (requireLooping && !state.looping) return false;
    const n = preset ? preset.length : state.shown.length;
    if (!n) return false;

    const g = state.gen;
    const { signal } = state.abort;
    const reduced = state.reduced;
    state.waving = true;
    try {
      const prev = state.shown.slice(0, n);
      const next = preset ?? pickWaveBatch(state.urls.length, prev);
      const nextUrls = next.map((idx) => state.urls[idx] ?? "");
      if (!preset) {
        const ok = await preloadAll(nextUrls, signal);
        if (!ok || stale(g) || (requireLooping && !state.looping)) return false;
      }

      // 阶段 1：新图写进各格底层槽（wait，静止，被上层牌盖住），等两帧让 <img> 挂载并渲染好
      const wasA = prev.map((_, t) => state.active[t] ?? true);
      setTiles((tiles) =>
        tiles.map((tile, t) => {
          if (t >= n) return tile;
          const incoming: PcWallSlot = { url: nextUrls[t] ?? "", phase: "wait" };
          return wasA[t] ? { ...tile, b: incoming } : { ...tile, a: incoming };
        }),
      );
      await nextFrames();
      if (stale(g)) return false;

      // 阶段 2：从左到右按错开时间让上层旧牌倒下（gone），露出底层新图；每格倒下时才写 shown / active
      const stagger = reduced ? 0 : PC_WALL_STAGGER_MS;
      const startAt = performance.now();
      for (let t = 0; t < n; t += 1) {
        const wait = startAt + t * stagger - performance.now();
        if (wait > 0) await sleep(wait, signal);
        if (stale(g)) return false;
        if (t >= state.shown.length || t >= state.active.length) continue;
        state.active[t] = !wasA[t];
        state.shown[t] = next[t] ?? state.shown[t] ?? 0;
        setTiles((tiles) =>
          tiles.map((tile, i) => {
            if (i !== t) return tile;
            return wasA[t] ? { ...tile, a: { ...tile.a, phase: "gone" } } : { ...tile, b: { ...tile.b, phase: "gone" } };
          }),
        );
      }

      // 阶段 3：整轮倒完（含最后一格倒下时长）后统一交接：倒下的旧槽清空，底层新图升为上层牌
      // （wait→front 两相位样式一致，无视觉变化）；此时下一轮尚未开始（waving 仍为 true）
      if (!reduced) await sleep(PC_WALL_FLIP_MS + CLEAR_PAD_MS, signal);
      if (stale(g)) return false;
      setTiles((tiles) =>
        tiles.map((tile) =>
          tile.a.phase === "gone" || tile.b.phase === "gone" ? { a: settleSlot(tile.a), b: settleSlot(tile.b) } : tile,
        ),
      );
      return true;
    } finally {
      if (g === state.gen) {
        state.waving = false;
        onIdle();
      }
    }
  };

  const loop = async (g: number): Promise<void> => {
    while (!stale(g) && state.looping && !state.reduced) {
      await sleep(PC_WALL_WAVE_GAP_MS, state.abort.signal);
      if (stale(g) || !state.looping) break;
      await runWave({ requireLooping: true });
    }
    if (g === state.gen) loopRunning = false;
  };

  /** looping 打开且图墙就绪时启动循环；已在跑则不重复 */
  const arm = () => {
    if (loopRunning || !state.looping || state.reduced || !state.booted || state.urls.length <= 1) return;
    loopRunning = true;
    void loop(state.gen);
  };

  return {
    runWave,
    arm,
    /** 换图集 / 卸载后重置循环标记，让新一代能重新 arm */
    reset: () => {
      loopRunning = false;
    },
  };
};
