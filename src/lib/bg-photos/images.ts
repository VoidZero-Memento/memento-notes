import { IMAGES_JSON_URL } from "@/lib/bg-photos/constants";

import type { OssImageMeta } from "@/lib/bg-photos/bg-photos.types";

const GALLERY_NAME_RE = /^banner(\d+)\.(png|jpe?g|webp)$/i;

let bannerUrlsCache: string[] | null = null;
let bannerUrlsInflight: Promise<string[]> | null = null;

const parseGalleryMeta = (item: OssImageMeta): { id: number; meta: OssImageMeta } | null => {
  const matched = item.name.match(GALLERY_NAME_RE);
  if (!matched) return null;
  return { id: Number(matched[1]), meta: item };
};

const fetchImageList = async (signal?: AbortSignal): Promise<OssImageMeta[]> => {
  const response = await fetch(IMAGES_JSON_URL, { signal });
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

/** 同步读取已缓存的 banner URL；未就绪返回 null */
export const getCachedGalleryBannerUrls = (): string[] | null => bannerUrlsCache;

/** 只拉清单并过滤 bannerN.ext，返回远程画廊图 URL（内存缓存） */
export const fetchGalleryBannerUrls = async (signal?: AbortSignal): Promise<string[]> => {
  if (bannerUrlsCache) return bannerUrlsCache;

  if (!bannerUrlsInflight) {
    bannerUrlsInflight = fetchImageList()
      .then((raw) => {
        const urls = raw
          .map(parseGalleryMeta)
          .filter((item): item is { id: number; meta: OssImageMeta } => item !== null)
          .sort((a, b) => a.id - b.id)
          .map(({ meta }) => meta.url);
        bannerUrlsCache = urls;
        return urls;
      })
      .catch((err) => {
        bannerUrlsInflight = null;
        throw err;
      });
  }

  const urls = await bannerUrlsInflight;
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  return urls;
};
