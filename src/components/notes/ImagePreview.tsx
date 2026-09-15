import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  IMAGE_PREVIEW_FLIP_IDENTITY,
  IMAGE_PREVIEW_FLIP_MS,
  fittedPreviewRect,
  isIosTouch,
  openPreviewTransform,
  playPreviewFade,
  playPreviewFlip,
  previewScaleOf,
  readViewportSize,
  snapPreviewToRect,
} from "@/lib/image-preview/flip";
import { useImageZoom } from "@/lib/image-preview/use-image-zoom";

import styles from "./ImagePreview.module.css";

import type { CSSProperties } from "react";
import type { ImagePreviewRect, PreviewAnimation } from "@/lib/image-preview/flip";

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

const afterFirstPaint = (fn: () => void) => {
  const raf = requestAnimationFrame(fn);
  return () => cancelAnimationFrame(raf);
};

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
  const iosTouch = isIosTouch();
  const [settled, setSettled] = useState(false);
  const [closing, setClosing] = useState(false);
  const [placed, setPlaced] = useState<ImagePreviewRect | null>(() =>
    iosTouch ? fittedPreviewRect(origin, { height: naturalHeight, width: naturalWidth }) : null,
  );
  const originRef = useRef(origin);
  const naturalRef = useRef({ height: naturalHeight, width: naturalWidth });
  const ignoreCloseUntilRef = useRef(0);
  originRef.current = origin;
  naturalRef.current = { height: naturalHeight, width: naturalWidth };
  onCloseRef.current = onClose;
  onCoverRef.current = onCover;
  const previewBox = placed ?? origin;
  const fitScale =
    iosTouch && naturalWidth > 0 && naturalHeight > 0
      ? Math.min(previewBox.width / naturalWidth, previewBox.height / naturalHeight)
      : undefined;
  const { consumeOverlayClick, resetZoom } = useImageZoom({
    enabled: settled && !closing,
    fitScale,
    imageRef,
    naturalHeight: fitScale != null ? naturalHeight : undefined,
    naturalWidth: fitScale != null ? naturalWidth : undefined,
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
    const target = fittedPreviewRect(originBox, natural, viewport);
    const fly = openPreviewTransform(originBox, previewScaleOf(originBox, natural, viewport), viewport);
    ignoreCloseUntilRef.current = performance.now() + 380;

    if (prefersReducedMotion() || iosTouch) {
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
    let flip: PreviewAnimation | null = null;
    let fade: PreviewAnimation | null = null;
    const cancelPaint = afterFirstPaint(() => {
      if (!alive) return;
      onCoverRef.current();
      if (dim) fade = playPreviewFade(dim, 0, 1);
      flip = playPreviewFlip(stage, IMAGE_PREVIEW_FLIP_IDENTITY, fly);
      const finishOpen = () => {
        if (!alive || opened || closingRef.current) return;
        opened = true;
        snapPreviewToRect(stage, target);
        setPlaced(target);
        setSettled(true);
      };
      flip.addEventListener("finish", finishOpen);
      timer = window.setTimeout(finishOpen, IMAGE_PREVIEW_FLIP_MS + 80);
    });

    return () => {
      alive = false;
      flip?.cancel();
      fade?.cancel();
      window.clearTimeout(timer);
      cancelPaint();
    };
  }, [iosTouch]);

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
    if (!stage || prefersReducedMotion() || iosTouch) {
      finishClose();
      return;
    }

    const nextOrigin = getOrigin();
    const dest = nextOrigin.width > 0 ? nextOrigin : originRef.current;
    const viewport = readViewportSize();
    const natural = { height: naturalHeight, width: naturalWidth };
    let fade: PreviewAnimation | null = null;
    if (dim) fade = playPreviewFade(dim, 1, 0);
    stage.style.left = `${dest.left}px`;
    stage.style.top = `${dest.top}px`;
    stage.style.width = `${dest.width}px`;
    stage.style.height = `${dest.height}px`;
    const animation = playPreviewFlip(
      stage,
      openPreviewTransform(dest, previewScaleOf(dest, natural, viewport), viewport),
      IMAGE_PREVIEW_FLIP_IDENTITY,
    );
    animation.addEventListener("finish", finishClose);
    const timer = window.setTimeout(finishClose, IMAGE_PREVIEW_FLIP_MS + 80);
    return () => {
      animation.cancel();
      fade?.cancel();
      window.clearTimeout(timer);
    };
  }, [closing, finishClose, getOrigin, iosTouch, naturalHeight, naturalWidth]);

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

  return createPortal(
    <div
      ref={overlayRef}
      className={`${styles.root}${iosTouch ? ` ${styles.touch}` : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={alt || "图片预览"}
      onClick={() => {
        if (closing || !settled || performance.now() < ignoreCloseUntilRef.current) return;
        if (!consumeOverlayClick()) return;
        requestClose();
      }}
    >
      <div className={styles.dim} ref={dimRef} />
      <div
        className={`${styles.stage}${settled && !closing ? ` ${styles.stageReady}` : ""}`}
        ref={stageRef}
        style={{ height: previewBox.height, left: previewBox.left, top: previewBox.top, width: previewBox.width }}
        onClick={(event) => event.stopPropagation()}
      >
        <img
          ref={imageRef}
          className={styles.full}
          src={src}
          alt={alt}
          width={Math.max(1, Math.round(iosTouch ? naturalWidth : origin.width))}
          height={Math.max(1, Math.round(iosTouch ? naturalHeight : origin.height))}
          draggable={false}
          style={
            iosTouch
              ? ({
                  "--preview-fit": String(fitScale ?? 1),
                  height: naturalHeight,
                  marginLeft: -naturalWidth / 2,
                  marginTop: -naturalHeight / 2,
                  width: naturalWidth,
                } as CSSProperties)
              : undefined
          }
        />
      </div>
    </div>,
    document.body,
  );
};
