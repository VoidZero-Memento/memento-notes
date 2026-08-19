import { IMAGES_JSON_URL } from "@/lib/bg-photos/constants";

import type { OssImageMeta } from "@/lib/bg-photos/bg-photos.types";

const GALLERY_NAME_RE = /^banner(\d+)\.(png|jpe?g|webp)$/i;
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|avif)$/i;

let imageListCache: OssImageMeta[] | null = null;
let imageListInflight: Promise<OssImageMeta[]> | null = null;
let bannerUrlsCache: string[] | null = null;
let allImagesCache: OssImageMeta[] | null = null;

const parseGalleryMeta = (item: OssImageMeta): { id: number; meta: OssImageMeta } | null => {
  const matched = item.name.match(GALLERY_NAME_RE);
  if (!matched) return null;
  return { id: Number(matched[1]), meta: item };
};

const isImageMeta = (item: OssImageMeta): boolean => IMAGE_EXT_RE.test(item.name) || IMAGE_EXT_RE.test(item.url);

const toAllImages = (raw: OssImageMeta[]): OssImageMeta[] =>
  raw.filter(isImageMeta).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

const fetchImageList = async (): Promise<OssImageMeta[]> => {
  const response = await fetch(IMAGES_JSON_URL);
  if (!response.ok) {
    throw new Error(`images.json fetch failed: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("images.json format invalid");
  }
  return data.filter(
    (item): item is OssImageMeta =>
      !!item &&
      typeof item === "object" &&
      typeof (item as OssImageMeta).name === "string" &&
      typeof (item as OssImageMeta).url === "string",
  );
};

const loadImageList = async (signal?: AbortSignal): Promise<OssImageMeta[]> => {
  if (imageListCache) return imageListCache;

  if (!imageListInflight) {
    imageListInflight = fetchImageList()
      .then((raw) => {
        imageListCache = raw;
        allImagesCache = toAllImages(raw);
        return raw;
      })
      .catch((err) => {
        imageListInflight = null;
        throw err;
      });
  }

  const list = await imageListInflight;
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  return list;
};

/** 同步读取已缓存的 banner URL；未就绪返回 null */
export const getCachedGalleryBannerUrls = (): string[] | null => bannerUrlsCache;

/** 同步读取已缓存的全部 OSS 图；未就绪返回 null */
export const getCachedAllOssImages = (): OssImageMeta[] | null => allImagesCache;

/** 只拉清单并过滤 bannerN.ext，返回远程画廊图 URL（内存缓存） */
export const fetchGalleryBannerUrls = async (signal?: AbortSignal): Promise<string[]> => {
  if (bannerUrlsCache) return bannerUrlsCache;

  const raw = await loadImageList(signal);
  const urls = raw
    .map(parseGalleryMeta)
    .filter((item): item is { id: number; meta: OssImageMeta } => item !== null)
    .sort((a, b) => a.id - b.id)
    .map(({ meta }) => meta.url);
  bannerUrlsCache = urls;
  return urls;
};

/** images.json 内全部图片元数据（内存缓存，按文件名排序） */
export const fetchAllOssImages = async (signal?: AbortSignal): Promise<OssImageMeta[]> => {
  if (allImagesCache) return allImagesCache;
  await loadImageList(signal);
  return allImagesCache ?? [];
};
