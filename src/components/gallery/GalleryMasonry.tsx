import { useMemo } from "react";

import { GalleryMasonryTile } from "@/components/gallery/GalleryMasonryTile";

import styles from "./GalleryMasonry.module.css";

import type { RefObject } from "react";
import type { HallBox, HallPhoto } from "@/lib/gallery/hall.types";

type GalleryMasonryProps = {
  ghostId: string | null;
  height: number;
  onOpen: (photo: HallPhoto, node: HTMLElement) => void;
  onScroll: () => void;
  paused: boolean;
  photos: HallPhoto[];
  scrollerRef: RefObject<HTMLDivElement | null>;
  visible: HallBox[];
};

export const GalleryMasonry = ({
  ghostId,
  height,
  onOpen,
  onScroll,
  paused,
  photos,
  scrollerRef,
  visible,
}: GalleryMasonryProps) => {
  const photoMap = useMemo(() => new Map(photos.map((photo) => [photo.id, photo])), [photos]);

  return (
    <div
      ref={scrollerRef}
      className={`${styles.scroller}${paused ? ` ${styles.paused}` : ""}`}
      onScroll={onScroll}
    >
      <div className={styles.space} style={{ height }}>
        {visible.map((box) => {
          const photo = photoMap.get(box.id);
          if (!photo) return null;
          return (
            <GalleryMasonryTile
              key={box.id}
              box={box}
              ghost={ghostId === photo.id}
              onOpen={onOpen}
              photo={photo}
              rootRef={scrollerRef}
            />
          );
        })}
      </div>
    </div>
  );
};
