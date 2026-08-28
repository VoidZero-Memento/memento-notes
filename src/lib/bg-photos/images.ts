import { ossFolderJsonUrl } from "@/lib/bg-photos/constants";
import { getOssFolder } from "@/lib/bg-photos/oss-folder";

import type { OssImageMeta } from "@/lib/bg-photos/bg-photos.types";
import type { OssFolderId } from "@/lib/bg-photos/oss-folder.types";

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|avif)$/i;

const listCache = new Map<OssFolderId, OssImageMeta[]>();
const listInflight = new Map<OssFolderId, Promise<OssImageMeta[]>>();
const urlsCache = new Map<OssFolderId, string[]>();

const isImageMeta = (item: OssImageMeta): boolean => IMAGE_EXT_RE.test(item.name) || IMAGE_EXT_RE.test(item.url);

const toAllImages = (raw: OssImageMeta[]): OssImageMeta[] =>
  raw.filter(isImageMeta).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

const fetchImageList = async (folder: OssFolderId): Promise<OssImageMeta[]> => {
  const response = await fetch(ossFolderJsonUrl(folder));
  if (!response.ok) {
    throw new Error(`${folder}.json fetch failed: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`${folder}.json format invalid`);
  }
  return data.filter(
    (item): item is OssImageMeta =>
      !!item &&
      typeof item === "object" &&
      typeof (item as OssImageMeta).name === "string" &&
      typeof (item as OssImageMeta).url === "string",
  );
};

const loadImageList = async (folder: OssFolderId, signal?: AbortSignal): Promise<OssImageMeta[]> => {
  const cached = listCache.get(folder);
  if (cached) return cached;

  let inflight = listInflight.get(folder);
  if (!inflight) {
    inflight = fetchImageList(folder)
      .then((raw) => {
        const images = toAllImages(raw);
        listCache.set(folder, images);
        urlsCache.set(
          folder,
          images.map((item) => item.url),
        );
        return images;
      })
      .catch((err) => {
        listInflight.delete(folder);
        throw err;
      });
    listInflight.set(folder, inflight);
  }

  const list = await inflight;
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  return list;
};

/** 同步读取当前图集已缓存的 URL；未就绪返回 null */
export const getCachedGalleryBannerUrls = (): string[] | null => urlsCache.get(getOssFolder()) ?? null;

/** 同步读取当前图集已缓存的图片；未就绪返回 null */
export const getCachedAllOssImages = (): OssImageMeta[] | null => listCache.get(getOssFolder()) ?? null;

/** 当前图集全部图片 URL（内存按文件夹缓存） */
export const fetchGalleryBannerUrls = async (signal?: AbortSignal): Promise<string[]> => {
  const folder = getOssFolder();
  const cached = urlsCache.get(folder);
  if (cached) return cached;
  const list = await loadImageList(folder, signal);
  return urlsCache.get(folder) ?? list.map((item) => item.url);
};

/** 当前图集全部图片元数据（内存按文件夹缓存，按文件名排序） */
export const fetchAllOssImages = async (signal?: AbortSignal): Promise<OssImageMeta[]> => {
  const folder = getOssFolder();
  const cached = listCache.get(folder);
  if (cached) return cached;
  return loadImageList(folder, signal);
};
