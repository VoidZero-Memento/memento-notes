import { useImperativeHandle } from "react";

import { MOBILE_BG_FADE_MS } from "@/lib/bg-photos/constants";
import { toImmersiveBgUrl } from "@/lib/bg-photos/photo-utils";
import { useMobileBgCarousel } from "@/lib/bg-photos/use-mobile-bg-carousel";

import { useImmersiveFrost } from "@/components/theme/use-immersive-frost";

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
  sharp: boolean;
  url: string;
  visible: boolean;
};

const CarouselSlot = ({ sharp, url, visible }: CarouselSlotProps) => (
  <div className={`${styles.slot}${visible ? ` ${styles.slotVisible}` : ""}`}>
    <img className={styles.cover} src={url} alt="" decoding="async" />
    <div className={styles.veil} />
    {sharp ? <img className={`${styles.cover} ${styles.coverSharp}`} src={toImmersiveBgUrl(url)} alt="" decoding="async" /> : null}
    <img className={styles.portrait} src={url} alt="" decoding="async" />
  </div>
);

/** 背景轮播层：手机铺满；PC 为两侧磨砂 + 中间原图竖条 */
export const MobileBgCarousel = ({ looping, ref }: MobileBgCarouselProps) => {
  const { frostOff, sharpOn } = useImmersiveFrost();
  const { slotA, slotB, advance } = useMobileBgCarousel({ looping });
  useImperativeHandle(ref, () => ({ advance }), [advance]);

  const fadeVars = {
    "--mobile-bg-fade-ms": `${MOBILE_BG_FADE_MS}ms`,
  } as CSSProperties;

  return (
    <div className={`${styles.root}${frostOff ? ` ${styles.immersive}` : ""}`} style={fadeVars} aria-hidden>
      {slotA.url ? <CarouselSlot sharp={sharpOn} url={slotA.url} visible={slotA.visible} /> : null}
      {slotB.url ? <CarouselSlot sharp={sharpOn} url={slotB.url} visible={slotB.visible} /> : null}
    </div>
  );
};
