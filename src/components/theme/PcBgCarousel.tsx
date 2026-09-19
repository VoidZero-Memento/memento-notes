import { useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import { MOBILE_BG_FADE_MS } from "@/lib/bg-photos/constants";
import { waitImgElementPainted } from "@/lib/bg-photos/photo-utils";
import { usePcBgCarousel } from "@/lib/bg-photos/use-pc-bg-carousel";

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
  urls: string[];
  visible: boolean;
  onPainted?: () => void;
};

const slotUrls = (url: string, urls?: string[]): string[] => (urls?.length ? urls : url ? [url] : []);

const CarouselSlot = ({ urls, visible, onPainted }: CarouselSlotProps) => {
  const slotRef = useRef<HTMLDivElement>(null);
  const urlsKey = urls.join("\n");

  useLayoutEffect(() => {
    if (!visible) return;
    const imgs = [...(slotRef.current?.querySelectorAll("img") ?? [])] as HTMLImageElement[];
    if (!imgs.length) return;
    let cancelled = false;
    void Promise.all(imgs.map((img) => waitImgElementPainted(img))).then(() => {
      if (!cancelled) onPainted?.();
    });
    return () => {
      cancelled = true;
    };
  }, [onPainted, urlsKey, visible]);

  return (
    <div ref={slotRef} className={`${styles.slot}${visible ? ` ${styles.slotVisible}` : ""}`}>
      {urls.map((src, index) => (
        <img key={`${src}-${index}`} className={styles.pane} src={src} alt="" decoding="async" />
      ))}
    </div>
  );
};

/** PC 正文底：四等分 cover；清屏与界面同一镜淡 veil / 亮度 */
export const PcBgCarousel = ({ looping, immersive, onReady, ref }: PcBgCarouselProps) => {
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
    "--immersive-ms": `${PC_IMMERSIVE_MS}ms`,
  } as CSSProperties;
  const urlsA = slotUrls(slotA.url, slotA.urls);
  const urlsB = slotUrls(slotB.url, slotB.urls);

  return (
    <div className={`${styles.root}${immersive ? ` ${styles.immersive}` : ""}`} style={fadeVars} aria-hidden>
      {urlsA.length ? <CarouselSlot urls={urlsA} visible={slotA.visible} onPainted={markPainted} /> : null}
      {urlsB.length ? <CarouselSlot urls={urlsB} visible={slotB.visible} onPainted={markPainted} /> : null}
      <div className={styles.veil} />
    </div>
  );
};
