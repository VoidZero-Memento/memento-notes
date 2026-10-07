import styles from "./PcBgCarousel.module.css";

import type { PcWallSlot, PcWallTile } from "@/lib/bg-photos/bg-photos.types";
import type { CSSProperties } from "react";

type WallSlotProps = {
  slot: PcWallSlot;
};

type PcBgWallTileProps = {
  tile: PcWallTile;
  /** 第几格（从左到右，0 起） */
  index: number;
};

const PHASE_CLASS = {
  wait: "",
  front: ` ${styles.slotFront}`,
  gone: ` ${styles.slotGone}`,
} as const;

const WallSlot = ({ slot }: WallSlotProps) => (
  <div className={`${styles.slot}${PHASE_CLASS[slot.phase]}`}>
    {slot.url ? <img className={styles.img} src={slot.url} alt="" decoding="async" draggable={false} /> : null}
  </div>
);

/**
 * 图墙单格：A/B 两层，一层是上层牌，另一层是已就位的底层新图；倒牌时上层牌倒下、露出底层。
 * 位置与交界渐隐全由 CSS 变量算出（见 PcBgCarousel.module.css），DOM 后一格盖住前一格。
 */
export const PcBgWallTile = ({ tile, index }: PcBgWallTileProps) => (
  <div data-pc-wall-tile="" className={styles.tile} style={{ "--pc-wall-i": index } as CSSProperties}>
    <WallSlot slot={tile.a} />
    <WallSlot slot={tile.b} />
  </div>
);
