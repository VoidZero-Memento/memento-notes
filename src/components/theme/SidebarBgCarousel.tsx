import { MOBILE_BG_FADE_MS } from "@/lib/bg-photos/constants";
import { useSidebarBgCarousel } from "@/lib/bg-photos/use-sidebar-bg-carousel";

import styles from "./SidebarBgCarousel.module.css";

import type { CSSProperties } from "react";

type SidebarBgCarouselProps = {
  looping: boolean;
};

type CarouselSlotProps = {
  url: string;
  visible: boolean;
};

const CarouselSlot = ({ url, visible }: CarouselSlotProps) => (
  <div className={`${styles.slot}${visible ? ` ${styles.slotVisible}` : ""}`}>
    <img className={styles.photo} src={url} alt="" decoding="async" />
  </div>
);

/** 侧栏 / 手机菜单独立底图轮播，单张 cover */
export const SidebarBgCarousel = ({ looping }: SidebarBgCarouselProps) => {
  const { slotA, slotB } = useSidebarBgCarousel({ looping });
  const fadeVars = {
    "--sidebar-bg-fade-ms": `${MOBILE_BG_FADE_MS}ms`,
  } as CSSProperties;

  return (
    <div className={styles.root} style={fadeVars} aria-hidden>
      {slotA.url ? <CarouselSlot url={slotA.url} visible={slotA.visible} /> : null}
      {slotB.url ? <CarouselSlot url={slotB.url} visible={slotB.visible} /> : null}
    </div>
  );
};
