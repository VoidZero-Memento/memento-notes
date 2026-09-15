import type { ImageZoomPoint, ImageZoomSize, ImageZoomTransform } from "./image-zoom.types";

export const IMAGE_ZOOM_MIN = 1;
export const IMAGE_ZOOM_MAX = 5;
export const IMAGE_ZOOM_DOUBLE = 2.5;
export const IMAGE_ZOOM_IDENTITY: ImageZoomTransform = { scale: 1, x: 0, y: 0 };

const MOVE_THRESHOLD_PX = 10;

export const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const clampScale = (scale: number) => clampNumber(scale, IMAGE_ZOOM_MIN, IMAGE_ZOOM_MAX);

export const clampScaleRange = (value: number, min: number, max: number) => clampNumber(value, min, max);

export const pointerDistance = (a: ImageZoomPoint, b: ImageZoomPoint) => Math.hypot(a.x - b.x, a.y - b.y);

export const isPastMoveThreshold = (origin: ImageZoomPoint, next: ImageZoomPoint) =>
  pointerDistance(origin, next) > MOVE_THRESHOLD_PX;

export const visualCenterOf = (rect: DOMRect): ImageZoomPoint => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

export const zoomAround = (
  transform: ImageZoomTransform,
  nextScale: number,
  focal: ImageZoomPoint,
  center: ImageZoomPoint,
  scaleLimit: (value: number) => number = clampScale,
): ImageZoomTransform => {
  const scale = scaleLimit(nextScale);
  if (scale === transform.scale) return { scale, x: transform.x, y: transform.y };
  const ratio = scale / transform.scale;
  return {
    scale,
    x: transform.x + (focal.x - center.x) * (1 - ratio),
    y: transform.y + (focal.y - center.y) * (1 - ratio),
  };
};

const panLimit = (scaled: number, viewport: number) => {
  const overflow = (scaled - viewport) / 2;
  return overflow > 0 ? overflow : viewport * 0.4;
};

export const clampTranslate = (
  transform: ImageZoomTransform,
  imageSize: ImageZoomSize,
  viewportSize: ImageZoomSize,
): ImageZoomTransform => {
  const maxX = panLimit(imageSize.width * transform.scale, viewportSize.width);
  const maxY = panLimit(imageSize.height * transform.scale, viewportSize.height);
  return {
    scale: transform.scale,
    x: clampNumber(transform.x, -maxX, maxX),
    y: clampNumber(transform.y, -maxY, maxY),
  };
};

export const cssTransform = ({ x, y, scale }: ImageZoomTransform) =>
  `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
