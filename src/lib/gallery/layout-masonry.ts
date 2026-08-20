import { HALL_COLUMNS, HALL_GAP, HALL_MAX_WIDTH, HALL_PAD } from "@/lib/gallery/constants";

import type { HallBox, HallMasonryOptions, HallPhoto } from "@/lib/gallery/hall.types";

export type HallMasonryLayout = {
  boxes: HallBox[];
  height: number;
  innerWidth: number;
};

export const layoutMasonry = (
  photos: HallPhoto[],
  containerWidth: number,
  options: HallMasonryOptions = {},
): HallMasonryLayout => {
  if (containerWidth <= 0 || photos.length === 0) {
    return { boxes: [], height: 0, innerWidth: 0 };
  }

  const columns = options.columns ?? HALL_COLUMNS;
  const gap = options.gap ?? HALL_GAP;
  const maxWidth = options.maxWidth ?? HALL_MAX_WIDTH;
  const pad = options.pad ?? HALL_PAD;
  const usable = Math.min(containerWidth, maxWidth);
  const offsetX = (containerWidth - usable) / 2;
  const innerWidth = Math.max(1, usable - pad * 2);
  const columnWidth = Math.max(1, (innerWidth - gap * (columns - 1)) / columns);
  const xs = Array.from({ length: columns }, (_, col) => offsetX + pad + col * (columnWidth + gap));
  const colHeights = Array.from({ length: columns }, () => pad);
  const boxes: HallBox[] = [];

  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index];
    if (!photo) continue;
    const ratio = photo.height / photo.width;
    const height = columnWidth * ratio;
    let col = 0;
    for (let i = 1; i < colHeights.length; i += 1) {
      if (colHeights[i] < colHeights[col]) col = i;
    }
    boxes.push({
      height,
      id: photo.id,
      index,
      width: columnWidth,
      x: xs[col] ?? pad,
      y: colHeights[col] ?? pad,
    });
    colHeights[col] = (colHeights[col] ?? pad) + height + gap;
  }

  const tallest = colHeights.reduce((max, h) => (h > max ? h : max), pad);
  const height = photos.length === 0 ? 0 : tallest - gap + pad;
  return { boxes, height, innerWidth };
};
