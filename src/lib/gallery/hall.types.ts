export type HallNaturalSize = {
  width: number;
  height: number;
};

export type HallPhoto = {
  backdropUrl: string;
  desktopBackdropUrl: string;
  height: number;
  id: string;
  thumbUrl: string;
  url: string;
  viewerUrl: string;
  width: number;
};

export type HallBox = {
  height: number;
  id: string;
  index: number;
  width: number;
  x: number;
  y: number;
};

export type HallMasonryOptions = {
  columns?: number;
  gap?: number;
  maxWidth?: number;
  pad?: number;
};

export type HallRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export type HallSelection = {
  origin: HallRect;
  photo: HallPhoto;
};

export type HallBackdropSlot = {
  desktopUrl: string;
  shown: boolean;
  url: string;
};
