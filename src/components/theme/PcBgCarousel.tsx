import { useImperativeHandle, useLayoutEffect, useRef } from "react";

import { PC_PAGE_BG_URL } from "@/lib/bg-photos/constants";
import { waitImgElementPainted } from "@/lib/bg-photos/photo-utils";

import { PC_IMMERSIVE_MS } from "@/components/theme/ImmersiveLayer";

import styles from "./PcBgCarousel.module.css";

import type { CSSProperties, Ref } from "react";

export type PcBgCarouselHandle = {
  /** 只有一张底图，点击不再换图 */
  advance: (clientX?: number) => void;
};

type PcBgCarouselProps = {
  looping: boolean;
  immersive?: boolean;
  onReady?: () => void;
  ref?: Ref<PcBgCarouselHandle>;
};

/** PC 正文底：铺满视口。不走手机壁纸图墙。 */
export const PcBgCarousel = ({ immersive, onReady, ref }: PcBgCarouselProps) => {
  const portraitRef = useRef<HTMLImageElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  useImperativeHandle(ref, () => ({ advance: () => {} }), []);

  useLayoutEffect(() => {
    const img = portraitRef.current;
    if (!img) return;
    let cancelled = false;
    void waitImgElementPainted(img).then(() => {
      if (!cancelled) onReadyRef.current?.();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fadeVars = { "--immersive-ms": `${PC_IMMERSIVE_MS}ms` } as CSSProperties;

  return (
    <div className={`${styles.root}${immersive ? ` ${styles.immersive}` : ""}`} style={fadeVars} aria-hidden>
      <img className={styles.fill} src={PC_PAGE_BG_URL} alt="" decoding="async" draggable={false} />
      <img ref={portraitRef} className={styles.portrait} src={PC_PAGE_BG_URL} alt="" decoding="async" draggable={false} />
      <div className={styles.veil} />
    </div>
  );
};
