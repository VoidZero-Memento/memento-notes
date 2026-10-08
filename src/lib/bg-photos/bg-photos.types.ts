import type { Dispatch, RefObject, SetStateAction } from "react";

export type OssImageMeta = {
  name: string;
  url: string;
  size: number;
};

export type BgPhotoSlot = {
  url: string;
  /** PC 并排竖图；缺省时按单张 `url` 渲染 */
  urls?: string[];
  visible: boolean;
  /** 每次“装入新图”递增；同一张图被再次装入同一个槽时，靠它区分是新一轮入场，而不是原来的离场状态 */
  token?: number;
};

/**
 * PC 图墙槽位相位：
 * wait=底层（静止，已就位的新图，被上层牌盖住；空槽也是 wait），
 * front=上层牌（朝前，0°），gone=倒下中/倒下后（rotateX 到头）
 */
export type PcWallSlotPhase = "wait" | "front" | "gone";

export type PcWallSlot = {
  url: string;
  phase: PcWallSlotPhase;
};

/** PC 图墙单格：A/B 两层，倒牌时上层牌倒下、露出底层新图，随后新图升为上层牌 */
export type PcWallTile = {
  a: PcWallSlot;
  b: PcWallSlot;
};

/** 图墙容器尺寸（CSS px） */
export type WallSize = {
  width: number;
  height: number;
};

/** 开启过渡期间预载的首图：index 对应清单下标 */
export type PcWallPrepared = { url: string; index: number } | null;

export type PcWallControllerDeps = {
  setTiles: Dispatch<SetStateAction<PcWallTile[]>>;
  setRatio: Dispatch<SetStateAction<number>>;
  ratioRef: RefObject<number>;
  sizeRef: RefObject<WallSize>;
};

/** 图墙内核与波浪调度共享的可变状态（非 React 状态） */
export type PcWallState = {
  /** 清单（PC 清晰 url） */
  urls: string[];
  /** 各格当前图在清单中的下标 */
  shown: number[];
  /** 各格当前朝前的是否为 A 槽 */
  active: boolean[];
  gen: number;
  abort: AbortController;
  booted: boolean;
  /** 列数增减进行中 */
  syncing: boolean;
  /** 一轮波浪进行中 */
  waving: boolean;
  looping: boolean;
  reduced: boolean;
};
