import {
  clampScale,
  clampScaleRange,
  clampTranslate,
  cssTransform,
  IMAGE_ZOOM_DOUBLE,
  IMAGE_ZOOM_IDENTITY,
  IMAGE_ZOOM_MAX,
  IMAGE_ZOOM_MIN,
  isPastMoveThreshold,
  pointerDistance,
  visualCenterOf,
  zoomAround,
} from "./image-zoom";

import type { ImageZoomPoint, ImageZoomTransform } from "./image-zoom.types";

const WHEEL_ZOOM_INTENSITY = 0.002;
const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_PX = 28;
const ZOOMED_SCALE = 1.02;

type BindImageZoomArgs = {
  downTargetRef: { current: EventTarget | null };
  enabled: boolean;
  fitScale?: number;
  image: HTMLImageElement;
  lastGestureAtRef: { current: number };
  naturalHeight?: number;
  naturalWidth?: number;
  overlay: HTMLElement;
  resetZoomRef: { current: () => void };
};

const clearImageZoomStyle = (image: HTMLImageElement) => {
  image.style.transition = "none";
  image.style.transform = "none";
  delete image.dataset.zoomed;
  delete image.dataset.panning;
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const midpoint = (a: ImageZoomPoint, b: ImageZoomPoint): ImageZoomPoint => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

const releaseCapture = (node: EventTarget | null, pointerId: number) => {
  if (!(node instanceof Element) || !node.hasPointerCapture(pointerId)) return;
  try {
    node.releasePointerCapture(pointerId);
  } catch {
    /* capture may already have been released */
  }
};

export const bindImageZoom = ({
  enabled,
  fitScale,
  image,
  lastGestureAtRef,
  downTargetRef,
  naturalHeight,
  naturalWidth,
  overlay,
  resetZoomRef,
}: BindImageZoomArgs) => {
  const naturalLayout = fitScale != null && !!naturalWidth && !!naturalHeight;
  if (!enabled) {
    if (naturalLayout) {
      image.style.transition = "none";
      image.style.transform = cssTransform({ scale: fitScale, x: 0, y: 0 });
      delete image.dataset.zoomed;
      delete image.dataset.panning;
      return;
    }
    clearImageZoomStyle(image);
    return;
  }
  const minScale = naturalLayout ? fitScale : IMAGE_ZOOM_MIN;
  const maxScale = naturalLayout ? fitScale * IMAGE_ZOOM_MAX : IMAGE_ZOOM_MAX;
  const limitScale = (value: number) =>
    naturalLayout ? clampScaleRange(value, minScale, maxScale) : clampScale(value);

  let transform: ImageZoomTransform = naturalLayout ? { scale: minScale, x: 0, y: 0 } : { ...IMAGE_ZOOM_IDENTITY };
  const pointers = new Map<number, ImageZoomPoint>();
  let pinch: { distance: number; mid: ImageZoomPoint } | null = null;
  let panLast: ImageZoomPoint | null = null;
  let skipPan = false;
  let gestureOrigin: ImageZoomPoint | null = null;
  let gestureMoved = false;
  let gesturePinched = false;
  let lastTapAt = 0;
  let lastTap: ImageZoomPoint | null = null;
  const captured = new Map<number, Element>();

  const viewportSize = () => ({ width: overlay.clientWidth, height: overlay.clientHeight });
  const imageSize = () =>
    naturalLayout
      ? { width: naturalWidth, height: naturalHeight }
      : { width: image.offsetWidth, height: image.offsetHeight };

  const apply = (smooth = false, panning = false) => {
    image.style.transition = smooth && !prefersReducedMotion() ? "transform 0.2s ease" : "none";
    image.style.transform = cssTransform(transform);
    image.dataset.zoomed = "";
    if (panning) image.dataset.panning = "";
    else delete image.dataset.panning;
  };

  const commit = (next: ImageZoomTransform, smooth = false, panning = false) => {
    transform = clampTranslate(next, imageSize(), viewportSize());
    apply(smooth, panning);
  };

  const zoomAt = (nextScale: number, focal: ImageZoomPoint, smooth = false) => {
    commit(zoomAround(transform, nextScale, focal, visualCenterOf(image.getBoundingClientRect()), limitScale), smooth);
  };

  const resetZoom = (smooth: boolean) => {
    transform = naturalLayout ? { scale: minScale, x: 0, y: 0 } : { ...IMAGE_ZOOM_IDENTITY };
    apply(smooth);
  };

  const markGesture = () => {
    lastGestureAtRef.current = performance.now();
  };

  const toggleDoubleTap = (focal: ImageZoomPoint) => {
    if (transform.scale > minScale * ZOOMED_SCALE) resetZoom(true);
    else zoomAt(minScale * IMAGE_ZOOM_DOUBLE, focal, true);
    lastTapAt = 0;
    lastTap = null;
    markGesture();
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const dy = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    zoomAt(limitScale(transform.scale * Math.exp(-dy * WHEEL_ZOOM_INTENSITY)), { x: event.clientX, y: event.clientY });
  };

  const capturePointer = (event: PointerEvent) => {
    const node = event.target instanceof Element ? event.target : overlay;
    try {
      node.setPointerCapture(event.pointerId);
      captured.set(event.pointerId, node);
    } catch {
      try {
        overlay.setPointerCapture(event.pointerId);
        captured.set(event.pointerId, overlay);
      } catch {
        /* window pointer listeners still receive moves */
      }
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    capturePointer(event);
    if (pointers.size === 1) {
      downTargetRef.current = event.target;
      gestureOrigin = { x: event.clientX, y: event.clientY };
      gestureMoved = false;
      gesturePinched = false;
      skipPan = false;
      panLast = { x: event.clientX, y: event.clientY };
      pinch = null;
    }
    if (pointers.size >= 2) {
      gesturePinched = true;
      skipPan = true;
      panLast = null;
      const [a, b] = [...pointers.values()];
      pinch = { distance: pointerDistance(a, b), mid: midpoint(a, b) };
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId)) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, point);
    if (gestureOrigin && !gestureMoved && isPastMoveThreshold(gestureOrigin, point)) gestureMoved = true;

    if (pointers.size >= 2 && pinch) {
      event.preventDefault();
      const [a, b] = [...pointers.values()];
      const distance = pointerDistance(a, b);
      const mid = midpoint(a, b);
      if (pinch.distance > 0) {
        zoomAt(transform.scale * (distance / pinch.distance), mid);
        commit({ ...transform, x: transform.x + mid.x - pinch.mid.x, y: transform.y + mid.y - pinch.mid.y });
      }
      pinch = { distance, mid };
      return;
    }

    if (skipPan || pointers.size !== 1 || !panLast) return;
    event.preventDefault();
    commit(
      { ...transform, x: transform.x + point.x - panLast.x, y: transform.y + point.y - panLast.y },
      false,
      true,
    );
    panLast = point;
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    releaseCapture(captured.get(event.pointerId) ?? overlay, event.pointerId);
    captured.delete(event.pointerId);

    if (pointers.size === 0) {
      if (gestureMoved || gesturePinched) markGesture();
      else if (downTargetRef.current === image || event.target === image) {
        const now = performance.now();
        const tap = { x: event.clientX, y: event.clientY };
        const isDouble =
          lastTap !== null && now - lastTapAt <= DOUBLE_TAP_MS && pointerDistance(lastTap, tap) <= DOUBLE_TAP_PX;
        if (isDouble) toggleDoubleTap(tap);
        else {
          lastTapAt = now;
          lastTap = tap;
        }
      }
      pinch = null;
      panLast = null;
      skipPan = false;
      apply(false, false);
      return;
    }

    if (pointers.size === 1) {
      pinch = null;
      skipPan = true;
      panLast = null;
    }
  };

  const preventGesture = (event: Event) => event.preventDefault();
  const preventDrag = (event: Event) => event.preventDefault();
  const clearTransition = () => {
    image.style.transition = "none";
  };

  apply();
  overlay.addEventListener("wheel", handleWheel, { passive: false });
  overlay.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointermove", handlePointerMove, { passive: false });
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);
  overlay.addEventListener("gesturestart", preventGesture);
  overlay.addEventListener("gesturechange", preventGesture);
  overlay.addEventListener("gestureend", preventGesture);
  image.addEventListener("dragstart", preventDrag);
  image.addEventListener("transitionend", clearTransition);

  resetZoomRef.current = () => resetZoom(false);

  return () => {
    resetZoomRef.current = () => {};
    clearImageZoomStyle(image);
    overlay.removeEventListener("wheel", handleWheel);
    overlay.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
    overlay.removeEventListener("gesturestart", preventGesture);
    overlay.removeEventListener("gesturechange", preventGesture);
    overlay.removeEventListener("gestureend", preventGesture);
    image.removeEventListener("dragstart", preventDrag);
    image.removeEventListener("transitionend", clearTransition);
  };
};
