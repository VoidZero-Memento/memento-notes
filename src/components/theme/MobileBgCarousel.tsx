import { MOBILE_BG_FADE_MS } from "@/lib/bg-photos/constants";
import { useMobileBgCarousel } from "@/lib/bg-photos/use-mobile-bg-carousel";

import styles from "./MobileBgCarousel.module.css";

import type { CSSProperties } from "react";

type MobileBgCarouselProps = {
  looping: boolean;
};

/** 仅手机正文背景轮播层；须由父级在 isMobile && bgEnabled 时条件挂载 */
export const MobileBgCarousel = ({ looping }: MobileBgCarouselProps) => {
  const { slotA, slotB } = useMobileBgCarousel({ looping });

  const fadeVars = {
    "--mobile-bg-fade-ms": `${MOBILE_BG_FADE_MS}ms`,
  } as CSSProperties;

  return (
    <div className={styles.root} style={fadeVars} aria-hidden>
      {slotA.url ? (
        <img
          className={`${styles.slot}${slotA.visible ? ` ${styles.slotVisible}` : ""}`}
          src={slotA.url}
          alt=""
          decoding="async"
        />
      ) : null}
      {slotB.url ? (
        <img
          className={`${styles.slot}${slotB.visible ? ` ${styles.slotVisible}` : ""}`}
          src={slotB.url}
          alt=""
          decoding="async"
        />
      ) : null}
      <div className={styles.veil} />
    </div>
  );
};
