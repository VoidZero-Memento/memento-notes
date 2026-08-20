import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { GALLERY_BACKDROP_MS, GALLERY_FADE_MS, GALLERY_MAT_GAP } from "@/lib/gallery/constants";
import { useGalleryArtBox } from "@/lib/gallery/use-gallery-art-box";
import { useGalleryChrome } from "@/lib/gallery/use-gallery-chrome";
import { useGalleryStage } from "@/lib/gallery/use-gallery-stage";

import styles from "./GalleryStage.module.css";

import type { AnimationEvent, CSSProperties, MouseEvent, SyntheticEvent } from "react";
import type { GalleryLocationState, GallerySlot, GallerySlotMotion } from "@/lib/gallery/gallery.types";

const slotClass = (motion: GallerySlotMotion) =>
  `${styles.slot} ${motion === "leave" ? styles.slotLeave : styles.slotShow}`;

const preventMenu = (event: SyntheticEvent) => event.preventDefault();

type ShotSlotProps = {
  slot: GallerySlot;
  onAnimationEnd: (event: AnimationEvent<HTMLDivElement>) => void;
};

const ShotSlot = ({ slot, onAnimationEnd }: ShotSlotProps) => (
  <div className={slot.url ? slotClass(slot.motion) : styles.slot} onAnimationEnd={onAnimationEnd}>
    {slot.url ? (
      <img
        className={styles.photo}
        src={slot.url}
        alt=""
        decoding="async"
        fetchPriority={slot.motion === "leave" ? "low" : "high"}
        draggable={false}
      />
    ) : null}
  </div>
);

const FrameMark = () => (
  <div className={styles.mark} aria-hidden>
    <span className={`${styles.corner} ${styles.cornerTl}`} />
    <span className={`${styles.corner} ${styles.cornerTr}`} />
    <span className={`${styles.corner} ${styles.cornerBl}`} />
    <span className={`${styles.corner} ${styles.cornerBr}`} />
  </div>
);

type AmbientLayerProps = {
  src: string;
  shown: boolean;
};

const AmbientLayer = ({ src, shown }: AmbientLayerProps) => (
  <div className={`${styles.ambient}${src && shown ? ` ${styles.ambientShow}` : ""}`} aria-hidden>
    {src ? <img className={styles.ambientImg} src={src} alt="" decoding="async" draggable={false} /> : null}
  </div>
);

export const GalleryStage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    status,
    error,
    slotA,
    slotB,
    backdropA,
    backdropB,
    backdropShowB,
    naturalSize,
    busy,
    advance,
    settleLeaving,
    retry,
  } = useGalleryStage();
  const { canvasRef, art } = useGalleryArtBox(naturalSize);
  const { chromeOn, hintOn, dismissHint, pulseChrome } = useGalleryChrome(status === "ready");

  const handleBack = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      const from = (location.state as GalleryLocationState | null)?.from;
      if (from && from !== location.pathname) {
        navigate(from);
        return;
      }
      navigate("/", { replace: true });
    },
    [location.pathname, location.state, navigate],
  );

  const fadeVars = {
    "--gallery-fade-ms": `${GALLERY_FADE_MS}ms`,
    "--gallery-backdrop-ms": `${GALLERY_BACKDROP_MS}ms`,
    "--art-w": `${art.width}px`,
    "--art-h": `${art.height}px`,
    "--gallery-mat": `${GALLERY_MAT_GAP}px`,
  } as CSSProperties;

  const handleSlotAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (!event.currentTarget.classList.contains(styles.slotLeave)) return;
    settleLeaving();
  };

  const handleTap = () => {
    if (status === "error") {
      retry();
      return;
    }
    if (status !== "ready" || busy) return;
    dismissHint();
    pulseChrome();
    advance();
  };

  const statusLabel = status === "error" ? (error ?? "UNABLE TO LOAD") : status === "loading" ? "LOADING" : null;

  return (
    <div
      className={`${styles.root}${status === "ready" ? ` ${styles.rootReady}` : ""}`}
      style={fadeVars}
      role="presentation"
      aria-label={status === "ready" ? "点击查看下一张" : undefined}
      onContextMenu={preventMenu}
      onClick={handleTap}
    >
      <AmbientLayer src={backdropA} shown={!backdropShowB} />
      <AmbientLayer src={backdropB} shown={backdropShowB} />

      <div className={styles.well}>
        <div className={styles.canvas} ref={canvasRef}>
          {art.width > 0 ? (
            <div className={styles.vessel}>
              <div className={styles.rim} aria-hidden>
                <span className={styles.rimFlow} />
              </div>
              <FrameMark />
              <div className={styles.stage}>
                <ShotSlot slot={slotA} onAnimationEnd={handleSlotAnimationEnd} />
                <ShotSlot slot={slotB} onAnimationEnd={handleSlotAnimationEnd} />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={`${styles.hud}${chromeOn && status === "ready" ? ` ${styles.hudOn}` : ""}`}>
        <p className={`${styles.hint}${hintOn ? ` ${styles.hintOn}` : ""}`}>TAP TO EXPLORE</p>
      </div>

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
