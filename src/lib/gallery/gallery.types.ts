export type GalleryLocationState = {
  from?: string;
};

export type GalleryStageStatus = "loading" | "error" | "ready";

export type GalleryNaturalSize = {
  width: number;
  height: number;
};

export type GallerySlotMotion = "enter" | "show" | "leave";

export type GallerySlot = {
  url: string;
  motion: GallerySlotMotion;
  size: GalleryNaturalSize;
};

export type GalleryPreparedShot = {
  idx: number;
  url: string;
  backdropUrl: string;
  size: GalleryNaturalSize;
};
