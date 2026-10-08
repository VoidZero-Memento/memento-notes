import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MOBILE_BG_MQ } from "@/lib/bg-photos/constants";
import { useAnimatedOpen } from "@/lib/dom/use-animated-open";
import { useMediaQuery } from "@/lib/dom/use-media-query";
import { BG_TRANSITION_EXIT_MS, BG_TRANSITION_HOLD_MS, getCrawlDissolveMs, getCrawlExitMs, getCrawlLeaveDelayMs, PC_BG_ENTER_MS, PC_BG_EXIT_MS, PC_BG_HOLD_MS } from "@/lib/prefs/sidebar-bg";
import { runOverlayDomino } from "@/lib/splash/overlay-domino";

import styles from "./BgTransitionOverlay.module.css";

import type { CSSProperties } from "react";

type BgTransitionOverlayProps = {
  open: boolean;
  /** 真实等待：进度爬到 90%，不按固定 3s 收束文案；PC 收尾走多米诺倒牌 */
  crawlProgress?: boolean;
};

export const BgTransitionOverlay = ({ open, crawlProgress = false }: BgTransitionOverlayProps) => {
  const isMobile = useMediaQuery(MOBILE_BG_MQ);
  const pcSettle = !isMobile && !crawlProgress;
  const holdMs = pcSettle ? PC_BG_HOLD_MS : BG_TRANSITION_HOLD_MS;
  const exitMs = crawlProgress
    ? getCrawlDissolveMs(isMobile)
    : pcSettle
      ? PC_BG_EXIT_MS
      : BG_TRANSITION_EXIT_MS;
  const leaveDelayMs = crawlProgress ? getCrawlLeaveDelayMs(isMobile) : 0;
  const mountMs = crawlProgress ? getCrawlExitMs(isMobile) : exitMs;
  const { mounted, visible } = useAnimatedOpen(open, mountMs);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [dominoing, setDominoing] = useState(false);
  const [dominoDone, setDominoDone] = useState(false);

  // 关闭瞬间（绘制前）接管：PC 把底图切列倒牌；不可执行则沿用溶解
  useLayoutEffect(() => {
    if (open || !crawlProgress || isMobile) return;
    const backdrop = backdropRef.current;
    if (!backdrop) return;
    const cleanup = runOverlayDomino(backdrop, () => setDominoDone(true));
    if (!cleanup) return;
    setDominoing(true);
    return () => {
      cleanup();
      setDominoing(false);
      setDominoDone(false);
    };
  }, [open, crawlProgress, isMobile]);

  if (!mounted || (dominoDone && !open) || typeof document === "undefined") return null;

  const overlayVars = {
    "--bg-transition-enter-ms": `${pcSettle ? PC_BG_ENTER_MS : 220}ms`,
    "--bg-transition-hold-ms": `${holdMs}ms`,
    "--bg-transition-exit-ms": `${exitMs}ms`,
    "--bg-transition-leave-delay": `${leaveDelayMs}ms`,
  } as CSSProperties;

  const progressClass = crawlProgress ? styles.progressBarCrawl : styles.progressBarActive;
  /** 真实等待蒙层收尾时进度条要停在当前位置，不能随 visible 归零 */
  const progressActive = crawlProgress || visible;
  const rootClassName = [
    styles.root,
    visible ? styles.rootVisible : "",
    crawlProgress ? styles.rootCrawl : "",
    dominoing ? styles.rootDomino : "",
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      className={rootClassName}
      style={overlayVars}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bg-transition-title"
      aria-describedby="bg-transition-desc"
    >
      <div ref={backdropRef} className={styles.backdrop} aria-hidden />
      <div className={styles.veil} aria-hidden />
      <div className={styles.panel}>
        <p id="bg-transition-title" className={styles.title}>
          氛围模式
        </p>
        <p id="bg-transition-desc" className={styles.desc}>
          背景铺开中
        </p>
        <div className={styles.progressTrack} aria-hidden>
          <span className={`${styles.progressBar}${progressActive ? ` ${progressClass}` : ""}`} />
        </div>
      </div>
    </div>,
    document.body,
  );
};
