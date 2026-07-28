import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./Lightbox.module.css";

import type { LightboxProps } from "./Lightbox.types";

const SPARKS = Array.from({ length: 8 }, (_, index) => index);
const CLOSE_ANIMATION_MS = 220;

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
        <button type="button" className={styles.close} aria-label="关闭" onClick={requestClose}>
          ×
        </button>
        <div className={styles.frame}>
          <div className={styles.orbit} aria-hidden>
            {SPARKS.map((index) => (
              <span key={index} className={styles.spark} />
            ))}
          </div>
          <img className={styles.image} src={src} alt={alt} />
        </div>
      </div>
    </div>,
    document.body,
  );
};
