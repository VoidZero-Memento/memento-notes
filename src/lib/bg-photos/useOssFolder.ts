import { useCallback, useSyncExternalStore } from "react";

import { DEFAULT_OSS_FOLDER, getOssFolder, setOssFolder, subscribeOssFolder } from "@/lib/bg-photos/oss-folder";

import type { OssFolderId } from "@/lib/bg-photos/oss-folder.types";

export const useOssFolder = () => {
  const folder = useSyncExternalStore(subscribeOssFolder, getOssFolder, () => DEFAULT_OSS_FOLDER);

  const setFolder = useCallback((next: OssFolderId) => {
    setOssFolder(next);
  }, []);

  return { folder, setFolder };
};
