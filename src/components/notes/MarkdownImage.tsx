import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useKeepAliveActive } from "@/lib/keep-alive/keep-alive";

import styles from "./MarkdownImage.module.css";

type MarkdownImageProps = {
  src: string;
  alt?: string;
};

export const MarkdownImage = ({ src, alt = "" }: MarkdownImageProps) => {
  const alive = useKeepAliveActive();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!alive) {
      setOpen(false);
      return;
    }
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [alive, open]);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label={alt ? `查看大图：${alt}` : "查看大图"}
        onClick={() => setOpen(true)}
      >
        <img className={styles.image} src={src} alt={alt} loading="lazy" decoding="async" />
      </button>
      {open && alive
        ? createPortal(
            <div
              className={styles.overlay}
              role="dialog"
              aria-modal="true"
              aria-label={alt || "图片预览"}
              onClick={() => setOpen(false)}
            >
              <img
                className={styles.full}
                src={src}
                alt={alt}
                onClick={(event) => event.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
