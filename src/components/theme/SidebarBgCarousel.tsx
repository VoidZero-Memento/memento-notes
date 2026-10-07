import { useEffect, useRef, useState } from "react";

import { MOBILE_BG_FADE_MS } from "@/lib/bg-photos/constants";
import { toSidebarBackdropUrl } from "@/lib/bg-photos/photo-utils";
import { useSidebarBgCarousel } from "@/lib/bg-photos/use-sidebar-bg-carousel";

import styles from "./SidebarBgCarousel.module.css";

import type { CSSProperties } from "react";

type SidebarBgCarouselProps = {
  looping: boolean;
};

type CarouselSlotProps = {
  url: string;
  visible: boolean;
};

/** 宽高比 >= 该值（接近方图 / 横图）时竖向留白太多，回退 cover */
const COVER_FALLBACK_RATIO = 0.75;

const CarouselSlot = ({ url, visible }: CarouselSlotProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [ratio, setRatio] = useState<number | null>(null);

  const syncRatio = () => {
    const img = imgRef.current;
    if (!img?.naturalWidth || !img.naturalHeight) return;
    setRatio(img.naturalWidth / img.naturalHeight);
  };

  useEffect(() => {
    if (imgRef.current?.complete) syncRatio();
  }, [url]);

  const isCover = ratio !== null && ratio >= COVER_FALLBACK_RATIO;
  const photoClass = ratio === null ? styles.photoPending : isCover ? styles.photoCover : styles.photoContain;
  const slotStyle = ratio === null ? undefined : ({ "--photo-ratio": ratio } as CSSProperties);

  return (
    <div className={`${styles.slot}${visible ? ` ${styles.slotVisible}` : ""}`} style={slotStyle}>
      {isCover ? null : <img className={styles.backdrop} src={toSidebarBackdropUrl(url)} alt="" decoding="async" />}
      <img ref={imgRef} className={photoClass} src={url} alt="" decoding="async" onLoad={syncRatio} />
    </div>
  );
};

/** 侧栏 / 手机菜单独立底图轮播：竖图尽量完整（最多裁掉两侧少量）+ 模糊底图补余下留白，方 / 横图回退 cover */
export const SidebarBgCarousel = ({ looping }: SidebarBgCarouselProps) => {
  const { slotA, slotB } = useSidebarBgCarousel({ looping });
  const fadeVars = {
    "--sidebar-bg-fade-ms": `${MOBILE_BG_FADE_MS}ms`,
  } as CSSProperties;

  return (
    <div className={styles.root} style={fadeVars} aria-hidden>
      {slotA.url ? <CarouselSlot url={slotA.url} visible={slotA.visible} /> : null}
      {slotB.url ? <CarouselSlot url={slotB.url} visible={slotB.visible} /> : null}
    </div>
  );
};
