import { useCallback, useEffect, useRef, useState } from "react";

import { createPcWallController } from "@/lib/bg-photos/pc-wall-controller";
import { calcWallCols, PC_WALL_DEFAULT_RATIO } from "@/lib/bg-photos/pc-wall-layout";
import { takePreparedMobileBg } from "@/lib/bg-photos/prepare-mobile-bg";
import { usePcWallViewport } from "@/lib/bg-photos/use-pc-wall-viewport";
import { useOssFolder } from "@/lib/bg-photos/useOssFolder";

import type { PcWallTile } from "@/lib/bg-photos/bg-photos.types";
import type { RefObject } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

type UsePcBgWallOptions = {
  /** false 时不再自动开新一轮波浪（进行中的一轮会翻完） */
  looping: boolean;
  /** 图墙根节点：量容器尺寸 */
  rootRef: RefObject<HTMLElement | null>;
};

/**
 * PC 图墙：按视口与目标宽高比算列数，每格独立 A/B 槽；
 * 换图是整排从左到右的多米诺倒牌波浪（定时循环 / 点击立即一轮）。仅在 PC 背景层挂载时调用，不影响手机轮播。
 */
export const usePcBgWall = ({ looping, rootRef }: UsePcBgWallOptions) => {
  const { folder } = useOssFolder();
  const preparedRef = useRef<ReturnType<typeof takePreparedMobileBg> | undefined>(undefined);
  if (preparedRef.current === undefined) {
    preparedRef.current = takePreparedMobileBg();
  }
  const prepared = preparedRef.current;
  const folderRef = useRef(folder);

  const [tiles, setTiles] = useState<PcWallTile[]>([]);
  const [ratio, setRatio] = useState(PC_WALL_DEFAULT_RATIO);
  const ratioRef = useRef(ratio);
  const { size, sizeRef } = usePcWallViewport(rootRef);
  const cols = calcWallCols(size.width, size.height, ratio);

  const [controller] = useState(() => createPcWallController({ setTiles, setRatio, ratioRef, sizeRef }));

  useEffect(() => {
    const folderChanged = folderRef.current !== folder;
    folderRef.current = folder;
    controller.setReduced(window.matchMedia(REDUCED_QUERY).matches);
    void controller.load(folderChanged ? null : prepared);
    return () => controller.dispose();
  }, [controller, folder, prepared]);

  useEffect(() => {
    controller.setLooping(looping);
  }, [controller, looping]);

  useEffect(() => {
    void controller.syncCols();
  }, [controller, cols]);

  /** 点击换图：整排从左到右立即来一轮波浪，与点击位置无关 */
  const advance = useCallback(() => controller.advance(), [controller]);

  const ready = tiles.some((tile) => (!!tile.a.url && tile.a.phase === "front") || (!!tile.b.url && tile.b.phase === "front"));

  return { tiles, size, advance, ready, skipBoot: !!prepared };
};
