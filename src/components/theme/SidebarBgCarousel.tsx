import { useEffect, useRef, useState } from "react";

import { MOBILE_BG_FADE_MS } from "@/lib/bg-photos/constants";
import { toSidebarBackdropUrl } from "@/lib/bg-photos/photo-utils";
import { useSidebarBgCarousel } from "@/lib/bg-photos/use-sidebar-bg-carousel";
import { useSidebarBgEffect } from "@/lib/prefs/useSidebarBgEffect";

import styles from "./SidebarBgCarousel.module.css";

import type { CSSProperties } from "react";

type SidebarBgCarouselProps = {
  looping: boolean;
};

type CarouselSlotProps = {
  url: string;
  visible: boolean;
  token?: number;
};

/** 宽高比 >= 该值（接近方图 / 横图）时竖向留白太多，回退 cover */
const COVER_FALLBACK_RATIO = 0.75;

const CarouselSlot = ({ url, visible, token }: CarouselSlotProps) => {
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

  // 记录该槽是否已展示过：展示过再变不可见 = 离场；装入新图（token 变化）则重置为待入场。
  // 不能只用 url 判断：随机到该槽上一张图时 url 不变，会被误判成离场态，导致反向（向左）入场
  const key = `${token ?? ""}|${url}`;
  const lastKeyRef = useRef(key);
  const shownRef = useRef(false);
  if (lastKeyRef.current !== key) {
    lastKeyRef.current = key;
    shownRef.current = false;
  }
  if (visible) shownRef.current = true;
  const phaseClass = visible ? styles.slotVisible : shownRef.current ? styles.slotLeaving : styles.slotWaiting;

  const isCover = ratio !== null && ratio >= COVER_FALLBACK_RATIO;
  const photoClass = ratio === null ? styles.photoPending : isCover ? styles.photoCover : styles.photo;
  const slotStyle = ratio === null ? undefined : ({ "--photo-ratio": ratio } as CSSProperties);

  return (
    <div className={`${styles.slot} ${phaseClass}`} style={slotStyle}>
      {/* 前景图固定 key：ratio 就绪后只改 class，不卸载重建，避免原图二次解码造成抖动 */}
      {ratio === null || isCover ? null : (
        <img key="backdrop" className={styles.backdrop} src={toSidebarBackdropUrl(url)} alt="" decoding="async" />
      )}
      <img key="photo" ref={imgRef} className={photoClass} src={url} alt="" decoding="async" onLoad={syncRatio} />
    </div>
  );
};

/** 侧栏 / 手机菜单独立底图轮播：竖图先尽量放大铺满（左右裁切有上限），铺不满的上部用磨砂补齐，方 / 横图回退 cover */
export const SidebarBgCarousel = ({ looping }: SidebarBgCarouselProps) => {
  const { slotA, slotB } = useSidebarBgCarousel({ looping });
  const { effect } = useSidebarBgEffect();
  const fadeVars = {
    "--sidebar-bg-fade-ms": `${MOBILE_BG_FADE_MS}ms`,
  } as CSSProperties;

  return (
    <div className={styles.root} style={fadeVars} data-effect={effect} aria-hidden>
      {slotA.url ? <CarouselSlot url={slotA.url} visible={slotA.visible} token={slotA.token} /> : null}
      {slotB.url ? <CarouselSlot url={slotB.url} visible={slotB.visible} token={slotB.token} /> : null}
    </div>
  );
};
