export type GalleryLocationState = {
  from?: string;
};

export type GalleryStageStatus = "loading" | "error" | "ready";

export type GallerySlotMotion = "enter" | "show" | "leave";

export type GallerySlot = {
  url: string;
  motion: GallerySlotMotion;
};

export type GalleryNaturalSize = {
  width: number;
  height: number;
};

export type GalleryPreparedShot = {
  idx: number;
  url: string;
  backdrop: string;
  size: GalleryNaturalSize;
};

export type GallerySatellite = {
  key: string;
  idx: number;
  url: string;
};
