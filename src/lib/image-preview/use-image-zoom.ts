import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { bindImageZoom } from "./bind-image-zoom";

import type { RefObject } from "react";

const GESTURE_CLICK_GUARD_MS = 400;

type UseImageZoomArgs = {
  enabled: boolean;
  fitScale?: number;
  imageRef: RefObject<HTMLImageElement | null>;
  naturalHeight?: number;
  naturalWidth?: number;
  overlayRef: RefObject<HTMLElement | null>;
};

export const useImageZoom = ({
  enabled,
  fitScale,
  imageRef,
  naturalHeight,
  naturalWidth,
  overlayRef,
}: UseImageZoomArgs) => {
  const lastGestureAtRef = useRef(0);
  const downTargetRef = useRef<EventTarget | null>(null);
  const resetZoomRef = useRef(() => {});

  const bind = useCallback(() => {
    const overlay = overlayRef.current;
    const image = imageRef.current;
    if (!overlay || !image) return;
    return bindImageZoom({
      downTargetRef,
      enabled,
      fitScale,
      image,
      lastGestureAtRef,
      naturalHeight,
      naturalWidth,
      overlay,
      resetZoomRef,
    });
  }, [enabled, fitScale, imageRef, naturalHeight, naturalWidth, overlayRef]);

  useLayoutEffect(() => {
    if (fitScale == null) return;
    return bind();
  }, [bind, fitScale]);

  useEffect(() => {
    if (fitScale != null) return;
    return bind();
  }, [bind, fitScale]);

  const consumeOverlayClick = useCallback(() => {
    if (performance.now() - lastGestureAtRef.current <= GESTURE_CLICK_GUARD_MS) return false;
    return downTargetRef.current !== imageRef.current;
  }, [imageRef]);

  const resetZoom = useCallback(() => resetZoomRef.current(), []);

  return { consumeOverlayClick, resetZoom };
};
