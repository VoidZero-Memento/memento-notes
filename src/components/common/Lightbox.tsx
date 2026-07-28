import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./Lightbox.module.css";

import type { LightboxProps } from "./Lightbox.types";

const SPARKS = Array.from({ length: 8 }, (_, index) => index);
const WAVE_BAR_COUNT = 40;
const CLOSE_ANIMATION_MS = 220;
const WAVE_ACCENT_CLASS = [styles.waveAccent0, styles.waveAccent1, styles.waveAccent2] as const;

const WAVE_BARS = Array.from({ length: WAVE_BAR_COUNT }, (_, index) => {
  const phase = (index / WAVE_BAR_COUNT) * Math.PI * 2;
  const base = 0.4 + Math.abs(Math.sin(phase * 3)) * 0.4 + Math.abs(Math.sin(phase * 7 + 1.2)) * 0.2;
  const duration = 0.65 + ((index * 17) % 9) * 0.08;
  const delay = ((index * 13) % WAVE_BAR_COUNT) * 0.035;
  const accent = index % 3;

  return { base, duration, delay, accent };
});

export const Lightbox = ({ src, alt, onClose }: LightboxProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestClose = () => {
    if (closeTimerRef.current) return;
    setIsClosing(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimerRef.current = setTimeout(onClose, reduceMotion ? 0 : CLOSE_ANIMATION_MS);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const overlayClassName = `${styles.overlay}${isClosing ? ` ${styles.overlayClosing}` : ""}`;
  const contentClassName = `${styles.content}${isClosing ? ` ${styles.contentClosing}` : ""}`;

  return createPortal(
    <div className={overlayClassName} onClick={requestClose}>
      <div className={styles.backdropArt} style={{ backgroundImage: `url("${src}")` }} aria-hidden />
      <div className={styles.backdropScrim} aria-hidden />
      <div className={contentClassName} onClick={(event) => event.stopPropagation()}>
        <div className={styles.frame}>
          <div className={styles.orbit} aria-hidden>
            {SPARKS.map((index) => (
              <span key={index} className={styles.spark} />
            ))}
          </div>
          <div className={styles.waveRing} aria-hidden>
            {WAVE_BARS.map((bar, index) => (
              <span
                key={index}
                className={`${styles.waveSpoke} ${WAVE_ACCENT_CLASS[bar.accent]}`}
                style={{
                  ["--bar-angle" as string]: `${(360 / WAVE_BAR_COUNT) * index}deg`,
                  ["--bar-base" as string]: String(bar.base),
                  ["--bar-duration" as string]: `${bar.duration}s`,
                  ["--bar-delay" as string]: `${bar.delay}s`,
                }}
              />
            ))}
          </div>
          <img className={styles.image} src={src} alt={alt} />
        </div>
      </div>
    </div>,
    document.body,
  );
};
