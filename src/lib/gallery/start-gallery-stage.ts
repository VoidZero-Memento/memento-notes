import { fetchAllOssImages, getCachedAllOssImages } from "@/lib/bg-photos/images";
import { pickNextPhotoIndex } from "@/lib/bg-photos/photo-utils";
import { loadShot } from "@/lib/gallery/load-shot";

import type { OssImageMeta } from "@/lib/bg-photos/bg-photos.types";
import type { GalleryPreparedShot } from "@/lib/gallery/gallery.types";

export type GalleryBootShot = {
  photos: OssImageMeta[];
  shot: GalleryPreparedShot;
};

export const startGalleryStage = async (
  signal: AbortSignal,
  gen: number,
  generationRef: { current: number },
): Promise<GalleryBootShot | { error: string } | null> => {
  const cached = getCachedAllOssImages();
  let photos: OssImageMeta[];
  try {
    photos = cached?.length ? cached : await fetchAllOssImages(signal);
  } catch (err) {
    if (signal.aborted || gen !== generationRef.current) return null;
    if (err instanceof DOMException && err.name === "AbortError") return null;
    return { error: err instanceof Error ? err.message : "展台加载失败" };
  }

  if (signal.aborted || gen !== generationRef.current) return null;
  if (!photos.length) return { error: "展台暂无图片" };

  const idx = pickNextPhotoIndex(photos.length, -1);
  const shot = await loadShot(photos, idx, signal);
  if (!shot || signal.aborted || gen !== generationRef.current) return null;
  return { photos, shot };
};
