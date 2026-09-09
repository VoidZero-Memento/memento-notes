import { toImmersiveBgUrl } from "@/lib/bg-photos/photo-utils";
import { HALL_BG_FADE_MS } from "@/lib/gallery/constants";
import { useHallDesktop } from "@/lib/gallery/use-hall-desktop";

import { GalleryFrost } from "@/components/gallery/GalleryFrost";
import { useImmersiveFrost } from "@/components/theme/use-immersive-frost";

import styles from "./GalleryHallBackdrop.module.css";

import type { CSSProperties } from "react";
import type { HallBackdropSlot } from "@/lib/gallery/hall.types";

type GalleryHallBackdropProps = {
  paused: boolean;
  slotA: HallBackdropSlot;
  slotB: HallBackdropSlot;
};

type BackdropSlotProps = {
  desktop: boolean;
  sharp: boolean;
  slot: HallBackdropSlot;
};

const BackdropSlot = ({ desktop, sharp, slot }: BackdropSlotProps) => {
  const src = desktop ? slot.desktopUrl : slot.url;
  const sharpSrc = sharp && slot.originUrl ? toImmersiveBgUrl(slot.originUrl) : "";
  return (
    <div className={`${styles.slot}${slot.shown ? ` ${styles.slotShow}` : ""}`}>
      {src ? <img className={styles.img} src={src} alt="" decoding="async" draggable={false} /> : null}
      <div className={styles.veil} />
      {sharpSrc ? <img className={`${styles.img} ${styles.imgSharp}`} src={sharpSrc} alt="" decoding="async" draggable={false} /> : null}
    </div>
  );
};

export const GalleryHallBackdrop = ({ paused, slotA, slotB }: GalleryHallBackdropProps) => {
  const desktop = useHallDesktop();
  const { frostOff, sharpOn } = useImmersiveFrost();

  return (
    <div
      className={`${styles.root}${paused ? ` ${styles.paused}` : ""}${frostOff ? ` ${styles.immersive}` : ""}`}
      style={{ "--hall-bg-fade-ms": `${HALL_BG_FADE_MS}ms` } as CSSProperties}
      aria-hidden
    >
      <BackdropSlot desktop={desktop} sharp={sharpOn} slot={slotA} />
      <BackdropSlot desktop={desktop} sharp={sharpOn} slot={slotB} />
      <GalleryFrost off={frostOff} />
    </div>
  );
};
