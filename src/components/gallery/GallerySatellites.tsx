import { memo } from "react";

import { getCachedAllOssImages } from "@/lib/bg-photos/images";
import { DESKTOP_HEART_SPOTS, HEART_PATH, MOBILE_HEART_SPOTS } from "@/lib/gallery/heart-layout";
import { prefetchShot } from "@/lib/gallery/load-shot";

import styles from "./GallerySatellites.module.css";

import type { CSSProperties, MouseEvent, PointerEvent, ReactNode } from "react";
import type { GallerySatellite } from "@/lib/gallery/gallery.types";
import type { HeartSpot } from "@/lib/gallery/heart-layout";

type GallerySatellitesProps = {
  satellites: GallerySatellite[];
  shown: boolean;
  compact: boolean;
  onSwap: (slotIndex: number, sat: GallerySatellite) => void;
};

const warmShot = (idx: number) => {
  const photos = getCachedAllOssImages();
  if (photos) prefetchShot(photos, idx);
};

const satStyle = (spot: HeartSpot, index: number, base: number): CSSProperties =>
  ({
    left: `${spot.x}%`,
    top: `${spot.y}%`,
    "--sat-delay": `${spot.delay}s`,
    "--sat-dur": `${spot.dur}s`,
    "--sat-tilt": `${spot.tilt}deg`,
    "--sat-index": index,
    "--sat-max": `${base * spot.s}px`,
  }) as CSSProperties;

export const GallerySatellites = memo(({ satellites, shown, compact, onSwap }: GallerySatellitesProps) => {
  const spots = compact ? MOBILE_HEART_SPOTS : DESKTOP_HEART_SPOTS;

  if (!satellites.length) return null;

  const base = compact ? 42 : 104;
  const shownClass = shown ? ` ${styles.layerShown}` : "";
  const itemsClass = `${styles.layer}${compact ? ` ${styles.layerCompact}` : ""}${shownClass}`;
  const traceClass = `${styles.traceLayer}${compact ? ` ${styles.traceCompact}` : ""}${shownClass}`;

  const handleSwap = (slotIndex: number, sat: GallerySatellite) => (event: MouseEvent) => {
    event.stopPropagation();
    onSwap(slotIndex, sat);
  };

  const handleWarm = (idx: number) => (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    warmShot(idx);
  };

  const items = satellites.map((sat, i) => {
    const spot = spots[i] ?? spots[spots.length - 1];
    return (
      <button
        key={`sat-slot-${i}`}
        type="button"
        className={styles.item}
        style={satStyle(spot, i, base)}
        aria-label="与中间图片互换"
        onClick={handleSwap(i, sat)}
        onPointerEnter={() => warmShot(sat.idx)}
        onPointerDown={handleWarm(sat.idx)}
      >
        <img
          className={styles.photo}
          src={sat.url}
          alt=""
          decoding="async"
          fetchPriority="low"
          draggable={false}
        />
      </button>
    );
  });

  const wrapOrbit = (node: ReactNode) => <div className={styles.orbit}>{node}</div>;

  return (
    <>
      <div className={traceClass} aria-hidden>
        {wrapOrbit(
          <svg className={styles.trace} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="gallery-heart-stroke" x1="12%" y1="8%" x2="88%" y2="92%">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="50%" stopColor="var(--accent-2)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <path d={HEART_PATH} />
          </svg>,
        )}
      </div>
      <div className={itemsClass}>{compact ? items : wrapOrbit(items)}</div>
    </>
  );
});
