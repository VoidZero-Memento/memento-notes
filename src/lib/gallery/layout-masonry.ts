import { HALL_COLUMNS, HALL_GAP, HALL_MAX_WIDTH, HALL_PAD } from "@/lib/gallery/constants";

import type { HallBox, HallPhoto } from "@/lib/gallery/hall.types";

export type HallMasonryLayout = {
  boxes: HallBox[];
  height: number;
  innerWidth: number;
};

export const layoutMasonry = (photos: HallPhoto[], containerWidth: number): HallMasonryLayout => {
  if (containerWidth <= 0 || photos.length === 0) {
    return { boxes: [], height: 0, innerWidth: 0 };
  }

  const usable = Math.min(containerWidth, HALL_MAX_WIDTH);
  const offsetX = (containerWidth - usable) / 2;
  const innerWidth = Math.max(1, usable - HALL_PAD * 2);
  const columnWidth = Math.max(1, (innerWidth - HALL_GAP * (HALL_COLUMNS - 1)) / HALL_COLUMNS);
  const xs = Array.from({ length: HALL_COLUMNS }, (_, col) => offsetX + HALL_PAD + col * (columnWidth + HALL_GAP));
  const colHeights = Array.from({ length: HALL_COLUMNS }, () => HALL_PAD);
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
      x: xs[col] ?? HALL_PAD,
      y: colHeights[col] ?? HALL_PAD,
    });
    colHeights[col] = (colHeights[col] ?? HALL_PAD) + height + HALL_GAP;
  }

  const tallest = colHeights.reduce((max, h) => (h > max ? h : max), HALL_PAD);
  const height = photos.length === 0 ? 0 : tallest - HALL_GAP + HALL_PAD;
  return { boxes, height, innerWidth };
};
