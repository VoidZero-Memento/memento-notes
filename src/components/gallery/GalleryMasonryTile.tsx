import { useEffect, useRef } from "react";

import { HALL_ENTER_MS } from "@/lib/gallery/constants";

import styles from "./GalleryMasonry.module.css";

import type { CSSProperties, MouseEvent, RefObject } from "react";
import type { HallBox, HallPhoto } from "@/lib/gallery/hall.types";

type GalleryMasonryTileProps = {
  box: HallBox;
  ghost: boolean;
  onOpen: (photo: HallPhoto, node: HTMLElement) => void;
  photo: HallPhoto;
  rootRef: RefObject<HTMLDivElement | null>;
};

export const GalleryMasonryTile = ({ box, ghost, onOpen, photo, rootRef }: GalleryMasonryTileProps) => {
  const tileRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const node = tileRef.current;
    const root = rootRef.current;
    if (!node || !root) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) node.dataset.lit = "";
        else delete node.dataset.lit;
      },
      { root, rootMargin: "80px 0px", threshold: 0.05 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [rootRef]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onOpen(photo, event.currentTarget);
  };

  return (
    <button
      ref={tileRef}
      type="button"
      className={`${styles.tile}${ghost ? ` ${styles.ghost}` : ""}`}
      style={
        {
          "--hall-enter-ms": `${HALL_ENTER_MS}ms`,
          height: box.height,
          left: box.x,
          top: box.y,
          width: box.width,
        } as CSSProperties
      }
      aria-label="查看照片"
      onClick={handleClick}
    >
      <img className={styles.photo} src={photo.thumbUrl} alt="" decoding="async" loading="lazy" draggable={false} />
      <span className={styles.frame} aria-hidden />
    </button>
  );
};
