export const IMAGE_PREVIEW_FLIP_MS = 280;
export const IMAGE_PREVIEW_FLIP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
export const IMAGE_PREVIEW_FLIP_IDENTITY = "scale(1) translate3d(0px, 0px, 0px)";
export const IMAGE_PREVIEW_MARGIN = 24;

export type ImagePreviewRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export type ImagePreviewSize = {
  height: number;
  width: number;
};

export type PreviewAnimation = {
  addEventListener: (type: "finish", listener: () => void) => void;
  cancel: () => void;
};

export const isIosTouch = () => {
  if (typeof navigator === "undefined") return false;
  if (/iPhone|iPod|iPad/i.test(navigator.userAgent)) return true;
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return (
    typeof CSS !== "undefined" &&
    CSS.supports("-webkit-touch-callout", "none") &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
};

export const readPreviewRect = (node: HTMLElement): ImagePreviewRect => {
  const box = node.getBoundingClientRect();
  return { height: box.height, left: box.left, top: box.top, width: box.width };
};

export const readViewportSize = (): ImagePreviewSize => {
  const viewport = window.visualViewport;
  if (viewport && isIosTouch()) return { height: viewport.height, width: viewport.width };
  return {
    height: document.documentElement.clientHeight,
    width: document.documentElement.clientWidth,
  };
};

export const previewScaleOf = (
  origin: ImagePreviewRect,
  natural: ImagePreviewSize,
  viewport: ImagePreviewSize,
  margin = IMAGE_PREVIEW_MARGIN,
) => {
  const viewportWidth = Math.max(1, viewport.width - margin * 2);
  const viewportHeight = Math.max(1, viewport.height - margin * 2);
  const naturalWidth = natural.width || origin.width;
  const naturalHeight = natural.height || origin.height;
  const scaleX = Math.min(Math.max(origin.width, naturalWidth), viewportWidth) / Math.max(1, origin.width);
  const scaleY = Math.min(Math.max(origin.height, naturalHeight), viewportHeight) / Math.max(1, origin.height);
  return Math.min(scaleX, scaleY);
};

export const openPreviewTransform = (
  origin: ImagePreviewRect,
  scale: number,
  viewport: ImagePreviewSize,
  margin = IMAGE_PREVIEW_MARGIN,
) => {
  const viewportWidth = viewport.width - margin * 2;
  const viewportHeight = viewport.height - margin * 2;
  const translateX = (-origin.left + (viewportWidth - origin.width) / 2 + margin) / scale;
  const translateY = (-origin.top + (viewportHeight - origin.height) / 2 + margin) / scale;
  return `scale(${scale}) translate3d(${translateX}px, ${translateY}px, 0px)`;
};

export const fitPreviewRect = (
  origin: ImagePreviewRect,
  scale: number,
  viewport: ImagePreviewSize,
): ImagePreviewRect => {
  const width = origin.width * scale;
  const height = origin.height * scale;
  return {
    height,
    left: (viewport.width - width) / 2,
    top: (viewport.height - height) / 2,
    width,
  };
};

const applyRect = (node: HTMLElement, rect: ImagePreviewRect) => {
  node.style.left = `${rect.left}px`;
  node.style.top = `${rect.top}px`;
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
};

const applyTransform = (node: HTMLElement, value: string) => {
  node.style.transform = value;
  node.style.setProperty("-webkit-transform", value);
};

const clearMotion = (node: HTMLElement) => {
  for (const item of node.getAnimations()) item.cancel();
  node.style.transition = "none";
  node.style.setProperty("-webkit-transition", "none");
};

export const snapPreviewToRect = (node: HTMLElement, rect: ImagePreviewRect) => {
  clearMotion(node);
  node.style.transformOrigin = "50% 50%";
  applyTransform(node, IMAGE_PREVIEW_FLIP_IDENTITY);
  applyRect(node, rect);
};

const wrapWaapi = (animation: Animation): PreviewAnimation => ({
  cancel: () => animation.cancel(),
  addEventListener: (_type, listener) => {
    animation.addEventListener("finish", listener);
  },
});

export const fittedPreviewRect = (origin: ImagePreviewRect, natural: ImagePreviewSize, viewport = readViewportSize()) =>
  fitPreviewRect(origin, previewScaleOf(origin, natural, viewport), viewport);

export const playPreviewFlip = (node: HTMLElement, from: string, to: string): PreviewAnimation => {
  clearMotion(node);
  node.style.transformOrigin = "50% 50%";
  applyTransform(node, from);
  void node.getBoundingClientRect();
  return wrapWaapi(
    node.animate([{ transform: from }, { transform: to }], {
      duration: IMAGE_PREVIEW_FLIP_MS,
      easing: IMAGE_PREVIEW_FLIP_EASING,
      fill: "forwards",
    }),
  );
};

export const playPreviewFade = (node: HTMLElement, from: number, to: number): PreviewAnimation => {
  clearMotion(node);
  node.style.opacity = String(from);
  return wrapWaapi(
    node.animate([{ opacity: from }, { opacity: to }], {
      duration: IMAGE_PREVIEW_FLIP_MS,
      easing: "linear",
      fill: "forwards",
    }),
  );
};
