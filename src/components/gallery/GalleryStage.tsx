import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { GALLERY_BACKDROP_MS, GALLERY_FADE_MS } from "@/lib/gallery/constants";
import { DESKTOP_HEART_SPOTS, MOBILE_HEART_SPOTS } from "@/lib/gallery/heart-layout";
import { useGalleryLayout } from "@/lib/gallery/use-gallery-layout";
import { useGallerySatellites } from "@/lib/gallery/use-gallery-satellites";
import { useGalleryStage } from "@/lib/gallery/use-gallery-stage";
import { EmptyState } from "@/components/common/EmptyState";
import { Lightbox } from "@/components/common/Lightbox";
import { GalleryChrome } from "@/components/gallery/GalleryChrome";
import { GallerySatellites } from "@/components/gallery/GallerySatellites";
import { LoadingState } from "@/components/notes/LoadingState";

import fx from "./GalleryFx.module.css";
import styles from "./GalleryStage.module.css";

import type { CSSProperties, PointerEvent, SyntheticEvent, TransitionEvent } from "react";
import type { GalleryLocationState, GallerySatellite, GallerySlotMotion } from "@/lib/gallery/gallery.types";

const slotClass = (motion: GallerySlotMotion) =>
  `${styles.slot} ${motion === "enter" ? styles.slotEnter : motion === "show" ? styles.slotShow : styles.slotLeave}`;

const preventMenu = (event: SyntheticEvent) => event.preventDefault();

export const GalleryStage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pressed, setPressed] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");
  const {
    status,
    error,
    slotA,
    slotB,
    backdropA,
    backdropB,
    backdropShowB,
    index,
    naturalSize,
    busy,
    hasShuffled,
    orbitTick,
    heroSatUrl,
    shuffle,
    adoptIndex,
    settleLeaving,
    retry,
  } = useGalleryStage();
  const { wellRef, compact, chromePad, frame, fxPaused } = useGalleryLayout(status, naturalSize);

  const satCount = compact ? MOBILE_HEART_SPOTS.length : DESKTOP_HEART_SPOTS.length;
  const { satellites, shown, swapSatellite } = useGallerySatellites(satCount, index, status === "ready", orbitTick);

  const handleBack = useCallback(() => {
    const from = (location.state as GalleryLocationState | null)?.from;
    if (from && from !== location.pathname) {
      navigate(from);
      return;
    }
    navigate("/", { replace: true });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || previewSrc) return;
      handleBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleBack, previewSrc]);

  const fadeVars = {
    "--gallery-fade-ms": `${GALLERY_FADE_MS}ms`,
    "--gallery-backdrop-ms": `${GALLERY_BACKDROP_MS}ms`,
    "--gallery-chrome-pad": `${chromePad}px`,
    "--frame-w": `${frame.width}px`,
    "--frame-h": `${frame.height}px`,
  } as CSSProperties;

  const heroUrl = slotA.motion === "leave" ? slotB.url : slotA.url || slotB.url;

  const handleSatSwap = useCallback(
    (slotIndex: number, sat: GallerySatellite) => {
      if (busy || previewSrc || sat.idx === index) return;
      const outgoing: GallerySatellite = {
        key: `from-hero-${index}-${sat.idx}`,
        idx: index,
        url: heroSatUrl,
      };
      adoptIndex(sat.idx, () => swapSatellite(slotIndex, outgoing));
    },
    [adoptIndex, busy, heroSatUrl, index, previewSrc, swapSatellite],
  );

  const handleSlotTransitionEnd = (event: TransitionEvent<HTMLImageElement>) => {
    if (event.propertyName !== "opacity") return;
    if (!event.currentTarget.classList.contains(styles.slotLeave)) return;
    settleLeaving();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || busy || previewSrc || status !== "ready") return;
    setPressed(true);
  };

  return (
    <div
      className={`${styles.root}${status === "ready" ? ` ${styles.rootReady}` : ""}${busy ? ` ${styles.rootBusy}` : ""}`}
      style={fadeVars}
      data-gallery-pause={busy || fxPaused ? "" : undefined}
      onContextMenu={preventMenu}
      onClick={status === "ready" && !previewSrc && !busy ? shuffle : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {backdropA ? (
        <div className={`${styles.backdrop}${backdropShowB ? "" : ` ${styles.backdropShow}`}`} aria-hidden>
          <div className={styles.backdropImg} style={{ backgroundImage: `url("${backdropA}")` }} />
        </div>
      ) : null}
      {backdropB ? (
        <div className={`${styles.backdrop}${backdropShowB ? ` ${styles.backdropShow}` : ""}`} aria-hidden>
          <div className={styles.backdropImg} style={{ backgroundImage: `url("${backdropB}")` }} />
        </div>
      ) : null}
      <div className={fx.aurora} aria-hidden />
      <div className={fx.stars} aria-hidden />
      <div className={fx.vignette} aria-hidden />

      <GallerySatellites satellites={satellites} shown={shown} compact={compact} onSwap={handleSatSwap} />

      <div className={styles.content}>
        {status === "loading" ? (
          <div className={styles.panel}>
            <LoadingState label="加载画廊" />
          </div>
        ) : null}

        {status === "error" ? (
          <div className={styles.panel}>
            <EmptyState
              variant="error"
              title="无法打开画廊"
              description={error ?? "图片清单加载失败"}
              actions={[
                { label: "重试", onClick: retry },
                { label: "返回笔记", onClick: handleBack, variant: "secondary" },
              ]}
            />
          </div>
        ) : null}

        {status === "ready" ? (
          <div className={`${styles.stage}${busy ? ` ${styles.stageBusy}` : ""}`}>
            <span className={fx.floorGlow} aria-hidden />
            <div className={`${styles.board}${pressed ? ` ${styles.boardPressed}` : ""}`} ref={wellRef}>
              {frame.width > 0 ? (
                <div className={styles.vessel}>
                  <GalleryChrome />
                  <div className={styles.frame}>
                    {slotA.url ? (
                      <img
                        className={slotClass(slotA.motion)}
                        src={slotA.url}
                        alt=""
                        decoding="async"
                        fetchPriority={slotA.motion === "leave" ? "low" : "high"}
                        draggable={false}
                        onTransitionEnd={handleSlotTransitionEnd}
                      />
                    ) : null}
                    {slotB.url ? (
                      <img
                        className={slotClass(slotB.motion)}
                        src={slotB.url}
                        alt=""
                        decoding="async"
                        fetchPriority={slotB.motion === "leave" ? "low" : "high"}
                        draggable={false}
                        onTransitionEnd={handleSlotTransitionEnd}
                      />
                    ) : null}
                    <button
                      type="button"
                      className={styles.hit}
                      aria-label="放大图片"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (heroUrl) setPreviewSrc(heroUrl);
                        setPressed(false);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.hud}>
        <button
          type="button"
          className={styles.back}
          aria-label="返回笔记"
          onClick={(event) => {
            event.stopPropagation();
            handleBack();
          }}
        >
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
        {status === "ready" ? (
          <p className={`${styles.hint}${hasShuffled ? ` ${styles.hintGone}` : ""}`}>
            点击中间放大 · 点击小图互换 · 点击背景切换
          </p>
        ) : (
          <span />
        )}
      </div>

      {previewSrc ? <Lightbox src={previewSrc} alt="" onClose={() => setPreviewSrc("")} /> : null}
    </div>
  );
};
