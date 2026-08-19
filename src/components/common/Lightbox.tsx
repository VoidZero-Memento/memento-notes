import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./Lightbox.module.css";

import type { LightboxProps } from "./Lightbox.types";

const CLOSE_ANIMATION_MS = 380;
const INNER_TICKS = Array.from({ length: 32 }, (_, index) => index);

export const Lightbox = ({ src, alt, onClose, children }: LightboxProps) => {
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
          <div className={styles.halo} aria-hidden />
          <div className={styles.innerOrbit} aria-hidden>
            {INNER_TICKS.map((index) => (
              <span
                key={index}
                className={index % 4 === 0 ? styles.tickLong : styles.tickDot}
                style={{ ["--tick-angle" as string]: `${(360 / INNER_TICKS.length) * index}deg` }}
              />
            ))}
          </div>
          <div className={styles.outerRing} aria-hidden />
          <div className={styles.planetTrack} aria-hidden>
            <span className={styles.planet} />
          </div>
          <div className={styles.imageWrap}>
            <span className={styles.glowRing} aria-hidden />
            <img className={styles.image} src={src} alt={alt} />
          </div>
        </div>
      </div>
      {children}
    </div>,
    document.body,
  );
};
