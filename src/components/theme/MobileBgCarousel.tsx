import { useImperativeHandle } from "react";

import { MOBILE_BG_FADE_MS } from "@/lib/bg-photos/constants";
import { useMobileBgCarousel } from "@/lib/bg-photos/use-mobile-bg-carousel";

import styles from "./MobileBgCarousel.module.css";

import type { CSSProperties, Ref } from "react";

export type MobileBgCarouselHandle = {
  advance: () => void;
};

type MobileBgCarouselProps = {
  looping: boolean;
  ref?: Ref<MobileBgCarouselHandle>;
};

type CarouselSlotProps = {
  url: string;
  visible: boolean;
};

const CarouselSlot = ({ url, visible }: CarouselSlotProps) => (
  <div className={`${styles.slot}${visible ? ` ${styles.slotVisible}` : ""}`}>
    <img className={styles.cover} src={url} alt="" decoding="async" />
    <img className={styles.portrait} src={url} alt="" decoding="async" />
  </div>
);

/** 背景轮播层：手机铺满；PC 为两侧磨砂 + 中间原图竖条 */
export const MobileBgCarousel = ({ looping, ref }: MobileBgCarouselProps) => {
  const { slotA, slotB, advance } = useMobileBgCarousel({ looping });
  useImperativeHandle(ref, () => ({ advance }), [advance]);

  const fadeVars = {
    "--mobile-bg-fade-ms": `${MOBILE_BG_FADE_MS}ms`,
  } as CSSProperties;

  return (
    <div className={styles.root} style={fadeVars} aria-hidden>
      {slotA.url ? <CarouselSlot url={slotA.url} visible={slotA.visible} /> : null}
      {slotB.url ? <CarouselSlot url={slotB.url} visible={slotB.visible} /> : null}
      <div className={styles.veil} />
    </div>
  );
};
