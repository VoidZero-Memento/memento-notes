import { MOBILE_BG_FADE_MS } from "@/lib/bg-photos/constants";
import { usePcBgCarousel } from "@/lib/bg-photos/use-pc-bg-carousel";

import styles from "./PcBgCarousel.module.css";

import type { CSSProperties } from "react";

type PcBgCarouselProps = {
  looping: boolean;
};

type CarouselSlotProps = {
  url: string;
  visible: boolean;
};

const CarouselSlot = ({ url, visible }: CarouselSlotProps) => (
  <div className={`${styles.slot}${visible ? ` ${styles.slotVisible}` : ""}`}>
    <img className={styles.cover} src={url} alt="" decoding="async" />
  </div>
);

/** PC 正文底：写死两张图交叉淡入，侧栏仍用 CSS 底图 */
export const PcBgCarousel = ({ looping }: PcBgCarouselProps) => {
  const { slotA, slotB } = usePcBgCarousel({ looping });

  const fadeVars = {
    "--pc-bg-fade-ms": `${MOBILE_BG_FADE_MS}ms`,
  } as CSSProperties;

  return (
    <div className={styles.root} style={fadeVars} aria-hidden>
      {slotA.url ? <CarouselSlot url={slotA.url} visible={slotA.visible} /> : null}
      {slotB.url ? <CarouselSlot url={slotB.url} visible={slotB.visible} /> : null}
      <div className={styles.veil} />
    </div>
  );
};
