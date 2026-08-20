import { HALL_BG_FADE_MS } from "@/lib/gallery/constants";

import styles from "./GalleryHallBackdrop.module.css";

import type { CSSProperties } from "react";
import type { HallBackdropSlot } from "@/lib/gallery/hall.types";

type GalleryHallBackdropProps = {
  paused: boolean;
  slotA: HallBackdropSlot;
  slotB: HallBackdropSlot;
};

const BackdropSlot = ({ slot }: { slot: HallBackdropSlot }) => (
  <div className={`${styles.slot}${slot.shown ? ` ${styles.slotShow}` : ""}`}>
    {slot.url ? <img className={styles.img} src={slot.url} alt="" decoding="async" draggable={false} /> : null}
  </div>
);

export const GalleryHallBackdrop = ({ paused, slotA, slotB }: GalleryHallBackdropProps) => (
  <div
    className={`${styles.root}${paused ? ` ${styles.paused}` : ""}`}
    style={{ "--hall-bg-fade-ms": `${HALL_BG_FADE_MS}ms` } as CSSProperties}
    aria-hidden
  >
    <BackdropSlot slot={slotA} />
    <BackdropSlot slot={slotB} />
    <div className={styles.veil} />
  </div>
);
