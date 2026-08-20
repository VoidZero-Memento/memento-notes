import { useState } from "react";

import { useSidebarBg } from "@/lib/prefs/useSidebarBg";
import { Lightbox } from "@/components/common/Lightbox";
import { GalleryLink } from "@/components/gallery/GalleryLink";

import styles from "./NotesShell.module.css";

type OwnerFooterProps = {
  login: string;
  avatarUrl?: string;
};

export const OwnerFooter = ({ login, avatarUrl }: OwnerFooterProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const { enabled: bgEnabled } = useSidebarBg();

  return (
    <div className={styles.ownerIdentity}>
      {avatarUrl ? (
        <button
          type="button"
          className={styles.ownerAvatarButton}
          aria-label={`查看 ${login} 的头像`}
          title={login}
          onClick={() => setPreviewOpen(true)}
        >
          <img className={styles.ownerAvatar} src={avatarUrl} alt="" width={28} height={28} />
        </button>
      ) : (
        <span className={styles.ownerAvatarFallback} aria-hidden>
          {login.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className={styles.ownerName} title={login}>
        {login}
      </span>
      {previewOpen && avatarUrl ? (
        <Lightbox src={avatarUrl} alt={login} onClose={() => setPreviewOpen(false)}>
          {bgEnabled ? <GalleryLink /> : null}
        </Lightbox>
      ) : null}
    </div>
  );
};
