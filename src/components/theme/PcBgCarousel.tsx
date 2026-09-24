import { useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import { MOBILE_BG_FADE_MS, MOBILE_BG_TRANSITION_MIN_MS } from "@/lib/bg-photos/constants";
import { toImmersiveBgUrl, waitImgElementPainted } from "@/lib/bg-photos/photo-utils";
import { useMobileBgCarousel } from "@/lib/bg-photos/use-mobile-bg-carousel";

import { PC_IMMERSIVE_MS } from "@/components/theme/ImmersiveLayer";

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
  const fillRef = useRef<HTMLImageElement>(null);
  const sharpUrl = toImmersiveBgUrl(url);
  const showSharp = sharpUrl !== url;

  useLayoutEffect(() => {
    if (!visible) return;
    const img = fillRef.current;
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
      <img ref={fillRef} className={styles.fill} src={url} alt="" decoding="async" />
      <img className={styles.portrait} src={url} alt="" decoding="async" />
      {showSharp ? <img className={styles.portraitSharp} src={sharpUrl} alt="" decoding="async" /> : null}
      <div className={styles.veil} />
    </div>
  );
};

/** PC 正文底：与手机同一图集循环。中间保持原比例，左右同图放大模糊铺满。 */
export const PcBgCarousel = ({ looping, immersive, onReady, ref }: PcBgCarouselProps) => {
  const { slotA, slotB, advance, ready, skipBoot } = useMobileBgCarousel({ looping, preloadSharp: true });
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
    "--pc-bg-fade-ms": `${MOBILE_BG_FADE_MS}ms`,
    "--immersive-ms": `${PC_IMMERSIVE_MS}ms`,
  } as CSSProperties;

  return (
    <div className={`${styles.root}${immersive ? ` ${styles.immersive}` : ""}`} style={fadeVars} aria-hidden>
      {slotA.url ? <CarouselSlot url={slotA.url} visible={slotA.visible} onPainted={markPainted} /> : null}
      {slotB.url ? <CarouselSlot url={slotB.url} visible={slotB.visible} onPainted={markPainted} /> : null}
    </div>
  );
};
