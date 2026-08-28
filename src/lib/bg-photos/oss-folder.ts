import type { OssFolderId } from "@/lib/bg-photos/oss-folder.types";

export const OSS_FOLDER_STORAGE_KEY = "memento-notes:oss-folder";

export const DEFAULT_OSS_FOLDER: OssFolderId = "fav";

export const OSS_FOLDER_IDS: readonly OssFolderId[] = [
  "all",
  "fav",
  "boots",
  "heels",
  "sneakers",
  "cutes",
  "misc",
  "xiamo",
];

export const OSS_FOLDER_LABELS: Record<OssFolderId, string> = {
  all: "合集",
  fav: "最爱",
  boots: "靴子",
  heels: "高跟鞋",
  sneakers: "运动鞋",
  cutes: "可爱",
  misc: "拾遗",
  xiamo: "夏沫",
};

const listeners = new Set<() => void>();

export const isOssFolderId = (value: string | null | undefined): value is OssFolderId =>
  value != null && (OSS_FOLDER_IDS as readonly string[]).includes(value);

export const parseOssFolderId = (value: string | null | undefined): OssFolderId =>
  isOssFolderId(value) ? value : DEFAULT_OSS_FOLDER;

export const readStoredOssFolder = (): OssFolderId => {
  try {
    return parseOssFolderId(window.localStorage.getItem(OSS_FOLDER_STORAGE_KEY));
  } catch {
    return DEFAULT_OSS_FOLDER;
  }
};

export const persistOssFolder = (next: OssFolderId): void => {
  try {
    window.localStorage.setItem(OSS_FOLDER_STORAGE_KEY, next);
  } catch {
    // 隐私模式等场景下写入可能失败，静默忽略
  }
};

let folder: OssFolderId = readStoredOssFolder();

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const getOssFolder = (): OssFolderId => folder;

export const subscribeOssFolder = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const setOssFolder = (next: OssFolderId): void => {
  if (next === folder) return;
  folder = next;
  persistOssFolder(next);
  emit();
};
