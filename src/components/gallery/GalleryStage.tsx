import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { GALLERY_FADE_MS } from "@/lib/gallery/constants";
import { useGalleryStage } from "@/lib/gallery/use-gallery-stage";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/notes/LoadingState";

import fx from "./GalleryFx.module.css";
import styles from "./GalleryStage.module.css";

import type { CSSProperties } from "react";
import type { GalleryLocationState } from "@/lib/gallery/gallery.types";

const ORBIT_TICKS = Array.from({ length: 24 }, (_, index) => index);

const padIndex = (value: number) => String(value).padStart(3, "0");

export const GalleryStage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, slotA, slotB, backdropUrl, index, total, label, busy, hasShuffled, shuffle, retry } =
    useGalleryStage();

  const handleBack = useCallback(() => {
    const from = (location.state as GalleryLocationState | null)?.from;
    if (from && from !== location.pathname) {
      navigate(from);
      return;
    }
    navigate("/", { replace: true });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleBack();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack]);

  const fadeVars = { "--gallery-fade-ms": `${GALLERY_FADE_MS}ms` } as CSSProperties;
  const counter = `${padIndex(index + 1)} / ${padIndex(total)}`;

  return (
    <div className={styles.root} style={fadeVars}>
      {backdropUrl ? (
        <div className={styles.backdrop} style={{ backgroundImage: `url("${backdropUrl}")` }} aria-hidden />
      ) : null}
      <div className={fx.aurora} aria-hidden />
      <div className={fx.stars} aria-hidden />
      <div className={fx.scrim} aria-hidden />
      <div className={fx.scanlines} aria-hidden />
      <div className={fx.noise} aria-hidden />

      <div className={styles.content}>
        {status === "loading" ? <LoadingState label="加载画廊" /> : null}

        {status === "error" ? (
          <EmptyState
            variant="error"
            title="无法打开画廊"
            description={error ?? "图片清单加载失败"}
            actions={[
              { label: "重试", onClick: retry },
              { label: "返回笔记", onClick: handleBack, variant: "secondary" },
            ]}
          />
        ) : null}

        {status === "ready" ? (
          <button
            type="button"
            className={`${styles.stage}${busy ? ` ${styles.stageBusy}` : ""}`}
            aria-label="随机切换图片"
            onClick={shuffle}
          >
            <div className={fx.halo} aria-hidden />
            <div className={fx.orbit} aria-hidden>
              {ORBIT_TICKS.map((tick) => (
                <span
                  key={tick}
                  className={tick % 4 === 0 ? fx.tickLong : fx.tickDot}
                  style={{ ["--tick-angle" as string]: `${(360 / ORBIT_TICKS.length) * tick}deg` }}
                />
              ))}
            </div>
            <div className={fx.ring} aria-hidden />
            <div className={fx.planetTrack} aria-hidden>
              <span className={fx.planet} />
            </div>
            <div className={`${styles.frame}${busy ? ` ${styles.frameFlash}` : ""}`}>
              <span className={`${fx.corner} ${fx.cornerTl}`} aria-hidden />
              <span className={`${fx.corner} ${fx.cornerTr}`} aria-hidden />
              <span className={`${fx.corner} ${fx.cornerBl}`} aria-hidden />
              <span className={`${fx.corner} ${fx.cornerBr}`} aria-hidden />
              <span className={fx.scanBeam} aria-hidden />
              {slotA.url ? (
                <img
                  className={`${styles.slot}${slotA.visible ? ` ${styles.slotVisible}` : ""}`}
                  src={slotA.url}
                  alt=""
                  decoding="async"
                  draggable={false}
                />
              ) : null}
              {slotB.url ? (
                <img
                  className={`${styles.slot}${slotB.visible ? ` ${styles.slotVisible}` : ""}`}
                  src={slotB.url}
                  alt=""
                  decoding="async"
                  draggable={false}
                />
              ) : null}
            </div>
          </button>
        ) : null}
      </div>

      <div className={styles.hud}>
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
          <span>返回</span>
        </button>
        {status === "ready" ? (
          <div className={styles.meta}>
            <span className={styles.counter}>{counter}</span>
            {label ? <span className={styles.label}>{label}</span> : null}
          </div>
        ) : (
          <span />
        )}
        {status === "ready" ? (
          <p className={`${styles.hint}${hasShuffled ? ` ${styles.hintGone}` : ""}`}>点击画面切换</p>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
};
