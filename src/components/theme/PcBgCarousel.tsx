import { useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import { MOBILE_BG_TRANSITION_MIN_MS, PC_WALL_FLIP_MS } from "@/lib/bg-photos/constants";
import { calcWallFeather } from "@/lib/bg-photos/pc-wall-layout";
import { waitImgElementPainted } from "@/lib/bg-photos/photo-utils";
import { usePcBgWall } from "@/lib/bg-photos/use-pc-bg-wall";

import { PC_IMMERSIVE_MS } from "@/components/theme/ImmersiveLayer";
import { PcBgWallTile } from "@/components/theme/PcBgWallTile";

import styles from "./PcBgCarousel.module.css";

import type { CSSProperties, Ref } from "react";

export type PcBgCarouselHandle = {
  /** 点击换图：忽略 clientX，整排从左到右立即来一轮倒牌波浪 */
  advance: (clientX?: number) => void;
};

type PcBgCarouselProps = {
  looping: boolean;
  immersive?: boolean;
  onReady?: () => void;
  ref?: Ref<PcBgCarouselHandle>;
};

/** PC 正文底：满屏图墙，N 列等分，相邻格交界处后一格边缘渐隐盖在前一格上（N 由视口与目标宽高比算出），无模糊/阴影底层。 */
export const PcBgCarousel = ({ looping, immersive, onReady, ref }: PcBgCarouselProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { tiles, size, advance, ready, skipBoot } = usePcBgWall({ looping, rootRef });
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const bootStartedRef = useRef(performance.now());
  const [painted, setPainted] = useState(false);
  useImperativeHandle(ref, () => ({ advance }), [advance]);

  // 首批 tile 全部解码上屏后才算 painted
  useLayoutEffect(() => {
    if (!ready || painted) return;
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    const imgs = Array.from(root.querySelectorAll("img"));
    void Promise.all(imgs.map((img) => waitImgElementPainted(img))).then(() => {
      if (!cancelled) setPainted(true);
    });
    return () => {
      cancelled = true;
    };
  }, [painted, ready]);

  useLayoutEffect(() => {
    if (!ready || !painted) return;
    if (skipBoot) {
      onReadyRef.current?.();
      return;
    }
    const remain = Math.max(0, MOBILE_BG_TRANSITION_MIN_MS - (performance.now() - bootStartedRef.current));
    const id = window.setTimeout(() => onReadyRef.current?.(), remain);
    return () => window.clearTimeout(id);
  }, [painted, ready, skipBoot]);

  // 交界柔化：按实际渲染的格数与视口宽算渐隐宽度，随 resize / 增减格更新（与 immersive 无关）
  const cols = Math.max(1, tiles.length);
  const fadeVars = {
    "--pc-wall-cols": cols,
    "--pc-wall-feather": `${calcWallFeather(size.width, cols)}px`,
    "--pc-wall-flip-ms": `${PC_WALL_FLIP_MS}ms`,
    "--immersive-ms": `${PC_IMMERSIVE_MS}ms`,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={`${styles.root}${immersive ? ` ${styles.immersive}` : ""}`}
      style={fadeVars}
      aria-hidden
    >
      <div className={styles.wall}>
        {tiles.map((tile, index) => (
          <PcBgWallTile key={index} index={index} tile={tile} />
        ))}
      </div>
      <div className={styles.veil} />
    </div>
  );
};
