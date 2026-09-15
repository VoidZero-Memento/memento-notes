import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  IMAGE_PREVIEW_FLIP_IDENTITY,
  IMAGE_PREVIEW_FLIP_MS,
  fitPreviewRect,
  openPreviewTransform,
  playPreviewFade,
  playPreviewFlip,
  previewScaleOf,
  readViewportSize,
  snapPreviewToRect,
} from "@/lib/image-preview/flip";
import { useImageZoom } from "@/lib/image-preview/use-image-zoom";

import styles from "./ImagePreview.module.css";

import type { ImagePreviewRect } from "@/lib/image-preview/flip";

type ImagePreviewProps = {
  alt: string;
  getOrigin: () => ImagePreviewRect;
  naturalHeight: number;
  naturalWidth: number;
  onClose: () => void;
  onCover: () => void;
  origin: ImagePreviewRect;
  src: string;
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const ImagePreview = ({
  alt,
  getOrigin,
  naturalHeight,
  naturalWidth,
  onClose,
  onCover,
  origin,
  src,
}: ImagePreviewProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const onCloseRef = useRef(onClose);
  const onCoverRef = useRef(onCover);
  const closingRef = useRef(false);
  const finishedRef = useRef(false);
  const [settled, setSettled] = useState(false);
  const [closing, setClosing] = useState(false);
  const [placed, setPlaced] = useState<ImagePreviewRect | null>(null);
  const originRef = useRef(origin);
  const naturalRef = useRef({ height: naturalHeight, width: naturalWidth });
  originRef.current = origin;
  naturalRef.current = { height: naturalHeight, width: naturalWidth };
  onCloseRef.current = onClose;
  onCoverRef.current = onCover;
  const { consumeOverlayClick, resetZoom } = useImageZoom({
    enabled: settled && !closing,
    imageRef,
    overlayRef,
  });

  const finishClose = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onCloseRef.current();
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const dim = dimRef.current;
    if (!stage) return;

    const originBox = originRef.current;
    const natural = naturalRef.current;
    const viewport = readViewportSize();
    const scale = previewScaleOf(originBox, natural, viewport);
    const target = fitPreviewRect(originBox, scale, viewport);
    const fly = openPreviewTransform(originBox, scale, viewport);

    if (prefersReducedMotion()) {
      snapPreviewToRect(stage, target);
      if (dim) dim.style.opacity = "1";
      onCoverRef.current();
      setPlaced(target);
      setSettled(true);
      return;
    }

    let alive = true;
    let opened = false;
    let timer = 0;
    let flip: Animation | null = null;
    const raf = requestAnimationFrame(() => {
      if (!alive) return;
      onCoverRef.current();
      if (dim) playPreviewFade(dim, 0, 1);
      flip = playPreviewFlip(stage, IMAGE_PREVIEW_FLIP_IDENTITY, fly);
      const finishOpen = () => {
        if (!alive || opened || closingRef.current) return;
        opened = true;
        snapPreviewToRect(stage, target);
        setPlaced(target);
        setSettled(true);
      };
      flip.addEventListener("finish", finishOpen);
      timer = window.setTimeout(finishOpen, IMAGE_PREVIEW_FLIP_MS + 40);
    });

    return () => {
      alive = false;
      flip?.cancel();
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    resetZoom();
    setSettled(false);
    setPlaced(null);
    setClosing(true);
  }, [resetZoom]);

  useLayoutEffect(() => {
    if (!closing) return;
    const stage = stageRef.current;
    const dim = dimRef.current;
    if (!stage || prefersReducedMotion()) {
      finishClose();
      return;
    }

    const nextOrigin = getOrigin();
    const viewport = readViewportSize();
    const natural = { height: naturalHeight, width: naturalWidth };
    const fly = openPreviewTransform(nextOrigin, previewScaleOf(nextOrigin, natural, viewport), viewport);
    stage.style.left = `${nextOrigin.left}px`;
    stage.style.top = `${nextOrigin.top}px`;
    stage.style.width = `${nextOrigin.width}px`;
    stage.style.height = `${nextOrigin.height}px`;
    if (dim) playPreviewFade(dim, 1, 0);
    const animation = playPreviewFlip(stage, fly, IMAGE_PREVIEW_FLIP_IDENTITY);
    animation.addEventListener("finish", finishClose);
    const timer = window.setTimeout(finishClose, IMAGE_PREVIEW_FLIP_MS + 80);
    return () => {
      animation.cancel();
      window.clearTimeout(timer);
    };
  }, [closing, finishClose, getOrigin, naturalHeight, naturalWidth]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [requestClose]);

  const box = placed ?? origin;

  return createPortal(
    <div
      ref={overlayRef}
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-label={alt || "图片预览"}
      onClick={() => {
        if (!consumeOverlayClick() && settled) return;
        requestClose();
      }}
    >
      <div className={styles.dim} ref={dimRef} />
      <div
        className={`${styles.stage}${settled && !closing ? ` ${styles.stageReady}` : ""}`}
        ref={stageRef}
        style={{ height: box.height, left: box.left, top: box.top, width: box.width }}
        onClick={(event) => event.stopPropagation()}
      >
        <img ref={imageRef} className={styles.full} src={src} alt={alt} draggable={false} />
      </div>
    </div>,
    document.body,
  );
};
