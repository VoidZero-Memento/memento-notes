import { createPortal } from "react-dom";

import { useAnimatedOpen } from "@/lib/dom/use-animated-open";
import { BG_TRANSITION_EXIT_MS, BG_TRANSITION_HOLD_MS } from "@/lib/prefs/sidebar-bg";

import styles from "./BgTransitionOverlay.module.css";

import type { CSSProperties } from "react";

type BgTransitionOverlayProps = {
  open: boolean;
};

export const BgTransitionOverlay = ({ open }: BgTransitionOverlayProps) => {
  const { mounted, visible } = useAnimatedOpen(open, BG_TRANSITION_EXIT_MS);

  if (!mounted || typeof document === "undefined") return null;

  const overlayVars = {
    "--bg-transition-hold-ms": `${BG_TRANSITION_HOLD_MS}ms`,
    "--bg-transition-exit-ms": `${BG_TRANSITION_EXIT_MS}ms`,
  } as CSSProperties;

  return createPortal(
    <div
      className={`${styles.root}${visible ? ` ${styles.rootVisible}` : ""}`}
      style={overlayVars}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bg-transition-title"
      aria-describedby="bg-transition-desc"
    >
      <div className={styles.backdrop} aria-hidden />
      <div className={styles.veil} aria-hidden />
      <div className={styles.panel}>
        <p id="bg-transition-title" className={styles.title}>
          氛围模式
        </p>
        <p id="bg-transition-desc" className={styles.desc}>
          背景铺开中
        </p>
        <div className={styles.progressTrack} aria-hidden>
          <span className={`${styles.progressBar}${visible ? ` ${styles.progressBarActive}` : ""}`} />
        </div>
      </div>
    </div>,
    document.body,
  );
};
