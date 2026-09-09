import { useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import { MOBILE_BG_FADE_MS } from "@/lib/bg-photos/constants";
import { waitImgElementPainted } from "@/lib/bg-photos/photo-utils";
import { usePcBgCarousel } from "@/lib/bg-photos/use-pc-bg-carousel";

import { useImmersiveFrost } from "@/components/theme/use-immersive-frost";

import styles from "./PcBgCarousel.module.css";

import type { CSSProperties, Ref } from "react";

export type PcBgCarouselHandle = {
  advance: () => void;
};

type PcBgCarouselProps = {
  looping: boolean;
  immersive?: boolean;
  onReady?: () => void;
  ref?: Ref<PcBgCarouselHandle>;
};

type CarouselSlotProps = {
  url: string;
  visible: boolean;
  onPainted?: () => void;
};

const CarouselSlot = ({ url, visible, onPainted }: CarouselSlotProps) => {
  const coverRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    if (!visible) return;
    const img = coverRef.current;
    if (!img) return;
    let cancelled = false;
    void waitImgElementPainted(img).then(() => {
      if (!cancelled) onPainted?.();
    });
    return () => {
      cancelled = true;
    };
  }, [onPainted, url, visible]);

  return (
    <div className={`${styles.slot}${visible ? ` ${styles.slotVisible}` : ""}`}>
      <img ref={coverRef} className={styles.cover} src={url} alt="" decoding="async" />
    </div>
  );
};

/** PC 正文底：写死两张图交叉淡入，侧栏仍用 CSS 底图 */
export const PcBgCarousel = ({ looping, immersive, onReady, ref }: PcBgCarouselProps) => {
  const { frostOff } = useImmersiveFrost(immersive);
  const { slotA, slotB, advance } = usePcBgCarousel({ looping });
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const [painted, setPainted] = useState(false);
  const markPainted = useCallback(() => setPainted(true), []);
  useImperativeHandle(ref, () => ({ advance }), [advance]);
  useLayoutEffect(() => {
    if (!painted) return;
    onReadyRef.current?.();
  }, [painted]);

  const fadeVars = {
    "--pc-bg-fade-ms": `${MOBILE_BG_FADE_MS}ms`,
  } as CSSProperties;

  return (
    <div className={`${styles.root}${frostOff ? ` ${styles.immersive}` : ""}`} style={fadeVars} aria-hidden>
      {slotA.url ? (
        <CarouselSlot url={slotA.url} visible={slotA.visible} onPainted={markPainted} />
      ) : null}
      {slotB.url ? (
        <CarouselSlot url={slotB.url} visible={slotB.visible} onPainted={markPainted} />
      ) : null}
      <div className={styles.veil} />
    </div>
  );
};
