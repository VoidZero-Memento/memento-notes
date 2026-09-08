import { useImperativeHandle } from "react";

import { MOBILE_BG_FADE_MS } from "@/lib/bg-photos/constants";
import { usePcBgCarousel } from "@/lib/bg-photos/use-pc-bg-carousel";

import { useImmersiveFrost } from "@/components/theme/use-immersive-frost";

import styles from "./PcBgCarousel.module.css";

import type { CSSProperties, Ref } from "react";

export type PcBgCarouselHandle = {
  advance: () => void;
};

type PcBgCarouselProps = {
  looping: boolean;
  ref?: Ref<PcBgCarouselHandle>;
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
export const PcBgCarousel = ({ looping, ref }: PcBgCarouselProps) => {
  const { frostOff } = useImmersiveFrost();
  const { slotA, slotB, advance } = usePcBgCarousel({ looping });
  useImperativeHandle(ref, () => ({ advance }), [advance]);

  const fadeVars = {
    "--pc-bg-fade-ms": `${MOBILE_BG_FADE_MS}ms`,
  } as CSSProperties;

  return (
    <div className={`${styles.root}${frostOff ? ` ${styles.immersive}` : ""}`} style={fadeVars} aria-hidden>
      {slotA.url ? <CarouselSlot url={slotA.url} visible={slotA.visible} /> : null}
      {slotB.url ? <CarouselSlot url={slotB.url} visible={slotB.visible} /> : null}
      <div className={styles.veil} />
    </div>
  );
};
