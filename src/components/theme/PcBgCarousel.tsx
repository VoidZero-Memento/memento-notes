import { useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import { waitImgElementPainted } from "@/lib/bg-photos/photo-utils";
import { usePcBgCarousel } from "@/lib/bg-photos/use-pc-bg-carousel";

import { PC_IMMERSIVE_MS } from "@/components/theme/ImmersiveLayer";

import styles from "./PcBgCarousel.module.css";

import type { CSSProperties, Ref } from "react";

export type PcBgCarouselHandle = {
  advance: () => void;
};

type PcBgCarouselProps = {
  immersive?: boolean;
  onReady?: () => void;
  ref?: Ref<PcBgCarouselHandle>;
};

/** PC 正文底：单张 cover。清屏只淡 veil / 亮度，不换图。 */
export const PcBgCarousel = ({ immersive, onReady, ref }: PcBgCarouselProps) => {
  const { url } = usePcBgCarousel();
  const imgRef = useRef<HTMLImageElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const [painted, setPainted] = useState(false);

  useImperativeHandle(ref, () => ({ advance: () => {} }), []);

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    let cancelled = false;
    void waitImgElementPainted(img).then(() => {
      if (!cancelled) setPainted(true);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  useLayoutEffect(() => {
    if (!painted) return;
    onReadyRef.current?.();
  }, [painted]);

  const fadeVars = { "--immersive-ms": `${PC_IMMERSIVE_MS}ms` } as CSSProperties;

  return (
    <div className={`${styles.root}${immersive ? ` ${styles.immersive}` : ""}`} style={fadeVars} aria-hidden>
      <img ref={imgRef} className={styles.photo} src={url} alt="" decoding="async" />
      <div className={styles.veil} />
    </div>
  );
};
