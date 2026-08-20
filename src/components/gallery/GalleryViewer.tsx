import { useCallback, useEffect, useRef, useState } from "react";

import { HALL_FLIP_MS } from "@/lib/gallery/constants";
import { fitViewerRect, invertOf } from "@/lib/gallery/hall-photo";
import { useHallDesktop } from "@/lib/gallery/use-hall-desktop";

import styles from "./GalleryViewer.module.css";

import type { CSSProperties } from "react";
import type { HallRect, HallSelection } from "@/lib/gallery/hall.types";

type GalleryViewerProps = {
  onClose: () => void;
  selection: HallSelection;
};

export const GalleryViewer = ({ onClose, selection }: GalleryViewerProps) => {
  const { origin, photo } = selection;
  const desktop = useHallDesktop();
  const targetRef = useRef<HallRect | null>(null);
  if (!targetRef.current) targetRef.current = fitViewerRect(photo, desktop);
  const target = targetRef.current;

  const [open, setOpen] = useState(false);
  const [settled, setSettled] = useState(false);
  const [src, setSrc] = useState(photo.thumbUrl);
  const closingRef = useRef(false);
  const timeoutRef = useRef(0);
  const settleRef = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const invert = invertOf(origin, target);

  const finishClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setSettled(false);
    setOpen(false);
    timeoutRef.current = window.setTimeout(() => onCloseRef.current(), HALL_FLIP_MS);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOpen(true);
        settleRef.current = window.setTimeout(() => setSettled(true), reduced ? 0 : HALL_FLIP_MS);
      });
    });

    const warm = new Image();
    const onReady = () => setSrc(photo.viewerUrl);
    warm.addEventListener("load", onReady);
    warm.src = photo.viewerUrl;
    if (warm.complete && warm.naturalWidth > 0) onReady();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeoutRef.current);
      window.clearTimeout(settleRef.current);
      warm.removeEventListener("load", onReady);
      window.removeEventListener("keydown", onKey);
    };
  }, [finishClose, photo.viewerUrl]);

  const vars = { "--hall-flip-ms": `${HALL_FLIP_MS}ms` } as CSSProperties;

  return (
    <div className={styles.root} style={vars} role="dialog" aria-modal aria-label="照片">
      <div className={`${styles.dim}${open ? ` ${styles.dimOn}` : ""}`} aria-hidden>
        {desktop ? (
          <img className={styles.fill} src={photo.desktopBackdropUrl} alt="" decoding="async" draggable={false} />
        ) : null}
      </div>
      <button type="button" className={styles.hit} aria-label="关闭" onClick={finishClose} />
      <div
        className={`${styles.stage}${settled ? ` ${styles.shown}` : ""}`}
        style={{
          height: target.height,
          left: target.left,
          top: target.top,
          transform: open ? "translate(0px, 0px) scale(1)" : invert,
          width: target.width,
        }}
      >
        <img className={styles.photo} src={src} alt="" decoding="async" draggable={false} />
      </div>
    </div>
  );
};
