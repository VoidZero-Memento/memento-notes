import { useCallback, useEffect, useRef, useState } from "react";

import { readPreviewRect } from "@/lib/image-preview/flip";
import { useKeepAliveActive } from "@/lib/keep-alive/keep-alive";

import { ImagePreview } from "./ImagePreview";

import styles from "./MarkdownImage.module.css";

import type { ImagePreviewRect } from "@/lib/image-preview/flip";

type MarkdownImageProps = {
  src: string;
  alt?: string;
};

export const MarkdownImage = ({ src, alt = "" }: MarkdownImageProps) => {
  const alive = useKeepAliveActive();
  const originRef = useRef<HTMLImageElement>(null);
  const [open, setOpen] = useState(false);
  const [covered, setCovered] = useState(false);
  const [origin, setOrigin] = useState<ImagePreviewRect | null>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  const getOrigin = useCallback(() => {
    const node = originRef.current;
    return node ? readPreviewRect(node) : { height: 0, left: 0, top: 0, width: 0 };
  }, []);

  useEffect(() => {
    if (!alive) {
      setOpen(false);
      setCovered(false);
      setOrigin(null);
    }
  }, [alive]);

  return (
    <>
      <button
        type="button"
        className={`${styles.trigger}${covered ? ` ${styles.triggerPreviewing}` : ""}`}
        aria-label={alt ? `查看大图：${alt}` : "查看大图"}
        onClick={() => {
          const node = originRef.current;
          if (!node) return;
          setOrigin(readPreviewRect(node));
          setNaturalWidth(node.naturalWidth);
          setNaturalHeight(node.naturalHeight);
          setOpen(true);
        }}
      >
        <img ref={originRef} className={styles.image} src={src} alt={alt} loading="lazy" decoding="async" />
      </button>
      {open && alive && origin ? (
        <ImagePreview
          src={src}
          alt={alt}
          origin={origin}
          naturalWidth={naturalWidth}
          naturalHeight={naturalHeight}
          getOrigin={getOrigin}
          onCover={() => setCovered(true)}
          onClose={() => {
            setOpen(false);
            setCovered(false);
            setOrigin(null);
          }}
        />
      ) : null}
    </>
  );
};
