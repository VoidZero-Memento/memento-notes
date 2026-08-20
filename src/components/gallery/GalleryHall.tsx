import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { HALL_DESKTOP_FRAME_PAD, HALL_PAD } from "@/lib/gallery/constants";
import { readOriginRect } from "@/lib/gallery/hall-photo";
import { useHallBackdrop } from "@/lib/gallery/use-hall-backdrop";
import { useHallCatalog } from "@/lib/gallery/use-hall-catalog";
import { useHallMasonry } from "@/lib/gallery/use-hall-masonry";
import { useKeepAliveActive } from "@/lib/keep-alive/keep-alive";

import { GalleryHallBackdrop } from "@/components/gallery/GalleryHallBackdrop";
import { GalleryMasonry } from "@/components/gallery/GalleryMasonry";
import { GalleryViewer } from "@/components/gallery/GalleryViewer";

import styles from "./GalleryHall.module.css";

import type { CSSProperties } from "react";
import type { GalleryLocationState } from "@/lib/gallery/gallery.types";
import type { HallPhoto, HallSelection } from "@/lib/gallery/hall.types";

const FrameMark = () => (
  <div className={styles.mark} aria-hidden>
    <span className={`${styles.corner} ${styles.cornerTl}`} />
    <span className={`${styles.corner} ${styles.cornerTr}`} />
    <span className={`${styles.corner} ${styles.cornerBl}`} />
    <span className={`${styles.corner} ${styles.cornerBr}`} />
  </div>
);

export const GalleryHall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const alive = useKeepAliveActive();
  const { error, photos, status } = useHallCatalog();
  const [selection, setSelection] = useState<HallSelection | null>(null);
  const paused = !alive || selection !== null;
  const { height, onScroll, scrollerRef, visible } = useHallMasonry(photos, paused);
  const { slotA, slotB } = useHallBackdrop(photos, !paused);

  const handleBack = useCallback(() => {
    if (selection) {
      setSelection(null);
      return;
    }
    const from = (location.state as GalleryLocationState | null)?.from;
    if (from && from !== location.pathname) {
      navigate(from);
      return;
    }
    navigate("/", { replace: true });
  }, [location.pathname, location.state, navigate, selection]);

  const handleOpen = useCallback((photo: HallPhoto, node: HTMLElement) => {
    setSelection({ origin: readOriginRect(node), photo });
  }, []);

  const statusLabel = status === "error" ? (error ?? "UNABLE TO LOAD") : status === "loading" ? "LOADING" : null;

  return (
    <div className={styles.root}>
      <GalleryHallBackdrop paused={paused} slotA={slotA} slotB={slotB} />
      <div className={styles.well}>
        <div className={styles.vitrine} style={{ "--hall-desktop-frame-pad": `${HALL_DESKTOP_FRAME_PAD}px`, "--hall-frame-pad": `${HALL_PAD}px` } as CSSProperties}>
          <div className={styles.rim} aria-hidden>
            <span className={styles.rimFlow} />
          </div>
          <FrameMark />
          <GalleryMasonry
            ghostId={selection?.photo.id ?? null}
            height={height}
            onOpen={handleOpen}
            onScroll={onScroll}
            paused={paused}
            photos={photos}
            scrollerRef={scrollerRef}
            visible={visible}
          />
        </div>
      </div>
      {selection ? <GalleryViewer selection={selection} onClose={() => setSelection(null)} /> : null}
      {statusLabel ? (
        <div className={styles.status}>
          <p className={styles.statusLabel}>{statusLabel}</p>
        </div>
      ) : null}
      <button type="button" className={styles.back} aria-label="返回笔记" onClick={handleBack}>
        <svg className={styles.backIcon} viewBox="0 0 16 16" aria-hidden>
          <path
            d="M10.5 3.5 5.5 8l5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};
