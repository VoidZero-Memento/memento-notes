import { useCallback, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { waitImgElementPainted } from "@/lib/bg-photos/photo-utils";
import { GALLERY_BACKDROP_MS, GALLERY_FADE_MS, GALLERY_MAT_GAP } from "@/lib/gallery/constants";
import { fitFrameSize } from "@/lib/gallery/fit-frame";
import { useGalleryArtBox } from "@/lib/gallery/use-gallery-art-box";
import { useGalleryChrome } from "@/lib/gallery/use-gallery-chrome";
import { useGalleryStage } from "@/lib/gallery/use-gallery-stage";

import { ImmersiveLayer } from "@/components/theme/ImmersiveLayer";

import styles from "./GalleryStage.module.css";

import type { CSSProperties, MouseEvent, SyntheticEvent } from "react";
import type { GalleryLocationState, GallerySlot, GallerySlotMotion } from "@/lib/gallery/gallery.types";

const slotClass = (motion: GallerySlotMotion) => {
  if (motion === "leave") return `${styles.card} ${styles.cardLeave}`;
  if (motion === "enter") return `${styles.card} ${styles.cardEnter}`;
  return `${styles.card} ${styles.cardShow}`;
};

const preventMenu = (event: SyntheticEvent) => event.preventDefault();

type ShotCardProps = {
  slot: GallerySlot;
  maxBox: { width: number; height: number };
  onPainted: (url: string) => void;
};

const ShotCard = ({ slot, maxBox, onPainted }: ShotCardProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const fitted = slot.url
    ? fitFrameSize(slot.size.width, slot.size.height, maxBox.width, maxBox.height)
    : { width: 0, height: 0 };

  useLayoutEffect(() => {
    if (!slot.url || fitted.width < 1) return;
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      onPainted(slot.url);
      return;
    }
    let cancelled = false;
    void waitImgElementPainted(img).then(() => {
      if (!cancelled) onPainted(slot.url);
    });
    return () => {
      cancelled = true;
    };
  }, [fitted.height, fitted.width, onPainted, slot.url]);

  if (!slot.url || fitted.width < 1) return null;

  return (
    <div
      className={slotClass(slot.motion)}
      style={{
        width: fitted.width + GALLERY_MAT_GAP * 2,
        height: fitted.height + GALLERY_MAT_GAP * 2,
      }}
    >
      <div className={styles.rim} aria-hidden>
        <span className={styles.rimFlow} />
      </div>
      <FrameMark />
      <div className={styles.stage}>
        <img
          key={slot.url}
          ref={imgRef}
          className={styles.photo}
          src={slot.url}
          alt=""
          decoding="async"
          loading="eager"
          draggable={false}
        />
      </div>
    </div>
  );
};

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
  front: boolean;
  onPainted: (url: string) => void;
};

const AmbientLayer = ({ src, shown, front, onPainted }: AmbientLayerProps) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    if (!src) return;
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      onPainted(src);
      return;
    }
    let cancelled = false;
    void waitImgElementPainted(img).then(() => {
      if (!cancelled) onPainted(src);
    });
    return () => {
      cancelled = true;
    };
  }, [onPainted, src]);

  const cls = src
    ? `${styles.ambient} ${shown ? (front ? styles.ambientFront : styles.ambientShow) : styles.ambientHold}`
    : styles.ambient;

  return (
    <div className={cls} aria-hidden>
      {src ? (
        <img
          ref={imgRef}
          className={styles.ambientImg}
          src={src}
          alt=""
          decoding="async"
          loading="eager"
          draggable={false}
        />
      ) : null}
    </div>
  );
};

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
    backdropShowA,
    backdropShowB,
    backdropFrontIsB,
    busy,
    advance,
    onSlotPainted,
    retry,
  } = useGalleryStage();
  const { canvasRef, maxBox } = useGalleryArtBox();
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
    "--gallery-mat": `${GALLERY_MAT_GAP}px`,
  } as CSSProperties;

  const handleTap = () => {
    if (status === "error") {
      retry();
      return;
    }
    if (status !== "ready") return;
    if (!advance()) return;
    dismissHint();
    pulseChrome();
  };

  const statusLabel = status === "error" ? (error ?? "UNABLE TO LOAD") : status === "loading" ? "LOADING" : null;

  return (
    <ImmersiveLayer
      enabled={false}
      className={`${styles.root}${status === "ready" ? ` ${styles.rootReady}` : ""}${busy ? ` ${styles.rootBusy}` : ""}`}
      style={fadeVars}
      role="presentation"
      aria-label={status === "ready" ? "点击查看下一张" : undefined}
      onContextMenu={preventMenu}
      onClick={handleTap}
      background={
        <div className={styles.ambientStack} aria-hidden>
          <AmbientLayer
            src={backdropA}
            shown={status === "ready" && backdropShowA}
            front={!backdropFrontIsB}
            onPainted={onSlotPainted}
          />
          <AmbientLayer
            src={backdropB}
            shown={status === "ready" && backdropShowB}
            front={backdropFrontIsB}
            onPainted={onSlotPainted}
          />
          <div className={styles.ambientVeil} />
        </div>
      }
    >
      <div className={styles.well}>
        <div className={styles.canvas} ref={canvasRef}>
          {maxBox.width > 0 ? (
            <>
              <ShotCard slot={slotA} maxBox={maxBox} onPainted={onSlotPainted} />
              <ShotCard slot={slotB} maxBox={maxBox} onPainted={onSlotPainted} />
            </>
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
    </ImmersiveLayer>
  );
};
