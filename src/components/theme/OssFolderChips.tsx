import { OSS_FOLDER_IDS, OSS_FOLDER_LABELS } from "@/lib/bg-photos/oss-folder";
import { useOssFolder } from "@/lib/bg-photos/useOssFolder";
import { toast } from "@/lib/toast/toast";

import styles from "./OssFolderChips.module.css";

import type { OssFolderId } from "@/lib/bg-photos/oss-folder.types";

type OssFolderChipsProps = {
  disabled?: boolean;
  onPicked?: () => void;
};

export const OssFolderChips = ({ disabled = false, onPicked }: OssFolderChipsProps) => {
  const { folder, setFolder } = useOssFolder();

  const handleSelect = (id: OssFolderId) => {
    if (disabled) return;
    if (id !== folder) {
      setFolder(id);
      toast.success(`已切换至「${OSS_FOLDER_LABELS[id]}」`);
    }
    onPicked?.();
  };

  return (
    <div className={styles.root} role="radiogroup" aria-label="图集">
      {OSS_FOLDER_IDS.map((id) => {
        const selected = id === folder;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`${styles.chip}${selected ? ` ${styles.chipSelected}` : ""}`}
            disabled={disabled}
            onClick={() => handleSelect(id)}
          >
            {OSS_FOLDER_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
};
