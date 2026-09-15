export const IMAGE_PREVIEW_FLIP_MS = 280;
export const IMAGE_PREVIEW_FLIP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
export const IMAGE_PREVIEW_FLIP_IDENTITY = "scale(1) translate3d(0px, 0px, 0)";
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

export const readPreviewRect = (node: HTMLElement): ImagePreviewRect => {
  const box = node.getBoundingClientRect();
  return { height: box.height, left: box.left, top: box.top, width: box.width };
};

export const readViewportSize = (): ImagePreviewSize => ({
  height: document.documentElement.clientHeight,
  width: document.documentElement.clientWidth,
});

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
  return `scale(${scale}) translate3d(${translateX}px, ${translateY}px, 0)`;
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

export const snapPreviewToRect = (node: HTMLElement, rect: ImagePreviewRect) => {
  for (const item of node.getAnimations()) item.cancel();
  node.style.transformOrigin = "50% 50%";
  node.style.transform = IMAGE_PREVIEW_FLIP_IDENTITY;
  node.style.left = `${rect.left}px`;
  node.style.top = `${rect.top}px`;
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
};

export const playPreviewFlip = (node: HTMLElement, from: string, to: string) => {
  for (const item of node.getAnimations()) item.cancel();
  node.style.transformOrigin = "50% 50%";
  return node.animate([{ transform: from }, { transform: to }], {
    duration: IMAGE_PREVIEW_FLIP_MS,
    easing: IMAGE_PREVIEW_FLIP_EASING,
    fill: "forwards",
  });
};

export const playPreviewFade = (node: HTMLElement, from: number, to: number) => {
  for (const item of node.getAnimations()) item.cancel();
  node.style.opacity = String(from);
  return node.animate([{ opacity: from }, { opacity: to }], {
    duration: IMAGE_PREVIEW_FLIP_MS,
    easing: "linear",
    fill: "forwards",
  });
};
