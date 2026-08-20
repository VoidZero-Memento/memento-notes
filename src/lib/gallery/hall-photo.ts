import { toGalleryPhotoUrl, toHallBackdropUrl, toHallThumbUrl } from "@/lib/bg-photos/photo-utils";
import { HALL_VIEWER_PAD_X, HALL_VIEWER_PAD_Y } from "@/lib/gallery/constants";

import type { OssImageMeta } from "@/lib/bg-photos/bg-photos.types";
import type { HallNaturalSize, HallPhoto, HallRect } from "@/lib/gallery/hall.types";

export const hallSizeCacheKey = (meta: OssImageMeta) => `${meta.url}#${meta.size}`;

export const toHallPhoto = (meta: OssImageMeta, size: HallNaturalSize): HallPhoto => ({
  backdropUrl: toHallBackdropUrl(meta.url),
  height: size.height,
  id: meta.name,
  thumbUrl: toHallThumbUrl(meta.url),
  url: meta.url,
  viewerUrl: toGalleryPhotoUrl(meta.url),
  width: size.width,
});

export const readOriginRect = (node: HTMLElement): HallRect => {
  const box = node.getBoundingClientRect();
  return { height: box.height, left: box.left, top: box.top, width: box.width };
};

export const fitContainRect = (photo: HallPhoto, viewportW: number, viewportH: number): HallRect => {
  const maxW = Math.max(1, viewportW - HALL_VIEWER_PAD_X * 2);
  const maxH = Math.max(1, viewportH - HALL_VIEWER_PAD_Y * 2);
  const scale = Math.min(maxW / photo.width, maxH / photo.height);
  const width = photo.width * scale;
  const height = photo.height * scale;
  return {
    height,
    left: (viewportW - width) / 2,
    top: (viewportH - height) / 2,
    width,
  };
};
