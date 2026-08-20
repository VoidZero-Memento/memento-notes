import { HALL_BG_FADE_MS } from "@/lib/gallery/constants";
import { useHallDesktop } from "@/lib/gallery/use-hall-desktop";

import styles from "./GalleryHallBackdrop.module.css";

import type { CSSProperties } from "react";
import type { HallBackdropSlot } from "@/lib/gallery/hall.types";

type GalleryHallBackdropProps = {
  paused: boolean;
  slotA: HallBackdropSlot;
  slotB: HallBackdropSlot;
};

const BackdropSlot = ({ desktop, slot }: { desktop: boolean; slot: HallBackdropSlot }) => {
  const src = desktop ? slot.desktopUrl : slot.url;
  return (
    <div className={`${styles.slot}${slot.shown ? ` ${styles.slotShow}` : ""}`}>
      {src ? <img className={styles.img} src={src} alt="" decoding="async" draggable={false} /> : null}
    </div>
  );
};

export const GalleryHallBackdrop = ({ paused, slotA, slotB }: GalleryHallBackdropProps) => {
  const desktop = useHallDesktop();

  return (
    <div
      className={`${styles.root}${paused ? ` ${styles.paused}` : ""}`}
      style={{ "--hall-bg-fade-ms": `${HALL_BG_FADE_MS}ms` } as CSSProperties}
      aria-hidden
    >
      <BackdropSlot desktop={desktop} slot={slotA} />
      <BackdropSlot desktop={desktop} slot={slotB} />
      <div className={styles.frost} />
      <div className={styles.veil} />
    </div>
  );
};
