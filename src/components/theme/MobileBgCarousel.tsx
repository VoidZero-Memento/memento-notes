import { useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import { MOBILE_BG_FADE_MS, MOBILE_BG_TRANSITION_MIN_MS } from "@/lib/bg-photos/constants";
import { toImmersiveBgUrl, waitImgElementPainted } from "@/lib/bg-photos/photo-utils";
import { useMobileBgCarousel } from "@/lib/bg-photos/use-mobile-bg-carousel";

import { useImmersiveFrost } from "@/components/theme/use-immersive-frost";

import styles from "./MobileBgCarousel.module.css";

import type { CSSProperties, Ref } from "react";

export type MobileBgCarouselHandle = {
  advance: () => void;
};

type MobileBgCarouselProps = {
  looping: boolean;
  immersive?: boolean;
  onReady?: () => void;
  ref?: Ref<MobileBgCarouselHandle>;
};

type CarouselSlotProps = {
  sharp: boolean;
  url: string;
  visible: boolean;
  onPainted?: () => void;
};

const CarouselSlot = ({ sharp, url, visible, onPainted }: CarouselSlotProps) => {
  const coverRef = useRef<HTMLImageElement>(null);
  const [sharpUrl, setSharpUrl] = useState("");
  if (sharp && sharpUrl !== url) setSharpUrl(url);
  const showSharp = sharpUrl === url;

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
      <div className={styles.veil} />
      {showSharp ? <img className={styles.coverSharp} src={toImmersiveBgUrl(url)} alt="" decoding="async" /> : null}
      <img className={styles.portrait} src={url} alt="" decoding="async" />
    </div>
  );
};

/** 背景轮播层：手机铺满；PC 为两侧磨砂 + 中间原图竖条 */
export const MobileBgCarousel = ({ looping, immersive, onReady, ref }: MobileBgCarouselProps) => {
  const { frostOff, sharpOn } = useImmersiveFrost(immersive);
  const { slotA, slotB, advance, ready, skipBoot } = useMobileBgCarousel({ looping, preloadSharp: frostOff });
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const bootStartedRef = useRef(performance.now());
  const [painted, setPainted] = useState(false);
  const markPainted = useCallback(() => setPainted(true), []);
  useImperativeHandle(ref, () => ({ advance }), [advance]);
  useLayoutEffect(() => {
    if (!ready || !painted) return;
    if (skipBoot) {
      onReadyRef.current?.();
      return;
    }
    const remain = Math.max(0, MOBILE_BG_TRANSITION_MIN_MS - (performance.now() - bootStartedRef.current));
    const id = window.setTimeout(() => onReadyRef.current?.(), remain);
    return () => window.clearTimeout(id);
  }, [painted, ready, skipBoot]);

  const fadeVars = {
    "--mobile-bg-fade-ms": `${MOBILE_BG_FADE_MS}ms`,
  } as CSSProperties;

  return (
    <div className={`${styles.root}${frostOff ? ` ${styles.immersive}` : ""}`} style={fadeVars} aria-hidden>
      {slotA.url ? (
        <CarouselSlot sharp={sharpOn} url={slotA.url} visible={slotA.visible} onPainted={markPainted} />
      ) : null}
      {slotB.url ? (
        <CarouselSlot sharp={sharpOn} url={slotB.url} visible={slotB.visible} onPainted={markPainted} />
      ) : null}
    </div>
  );
};
