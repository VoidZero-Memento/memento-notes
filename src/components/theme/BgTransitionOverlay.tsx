import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MOBILE_BG_MQ, PC_PAGE_BG_URL } from "@/lib/bg-photos/constants";
import { useAnimatedOpen } from "@/lib/dom/use-animated-open";
import { useMediaQuery } from "@/lib/dom/use-media-query";
import { BG_TRANSITION_EXIT_MS, getCrawlDissolveMs, getCrawlExitMs, getCrawlLeaveDelayMs, PC_BG_ENTER_MS, PC_BG_EXIT_MS } from "@/lib/prefs/sidebar-bg";
import { runOverlayDomino } from "@/lib/splash/overlay-domino";
import { splashBannerSrc, splashEdgeSettleMs } from "@/lib/splash/splash-loading";
import { useSplashBanners } from "@/lib/splash/use-splash-banners";
import { useSplashEdge } from "@/lib/splash/use-splash-edge";

import styles from "./BgTransitionOverlay.module.css";

import type { CSSProperties } from "react";

type BgTransitionOverlayProps = {
  open: boolean;
  /** 真实等待：贴边进度先爬到 90%，画到顶点后才退场；PC 收尾走多米诺倒牌 */
  crawlProgress?: boolean;
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const BgTransitionOverlay = ({ open, crawlProgress = false }: BgTransitionOverlayProps) => {
  const isMobile = useMediaQuery(MOBILE_BG_MQ);
  const pcSettle = !isMobile && !crawlProgress;
  const exitMs = crawlProgress ? getCrawlDissolveMs(isMobile) : pcSettle ? PC_BG_EXIT_MS : BG_TRANSITION_EXIT_MS;
  const leaveDelayMs = crawlProgress ? getCrawlLeaveDelayMs(isMobile) : 0;
  const mountMs = crawlProgress ? getCrawlExitMs(isMobile) : exitMs;
  const [holding, setHolding] = useState(false);
  const [progressDone, setProgressDone] = useState(false);
  const [trackedOpen, setTrackedOpen] = useState(open);
  if (open !== trackedOpen) {
    setTrackedOpen(open);
    setProgressDone(false);
    setHolding(!open && !prefersReducedMotion());
  }
  const shownOpen = open || holding;
  const { mounted, visible } = useAnimatedOpen(shownOpen, mountMs);
  const rootRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dominoing, setDominoing] = useState(false);
  const [dominoDone, setDominoDone] = useState(false);
  const present = mounted && !(dominoDone && !open);
  const { indexes, active, onSettle } = useSplashBanners(present && isMobile, backdropRef);

  const finishEdge = () => {
    setProgressDone(true);
    setHolding(false);
  };

  useEffect(() => {
    if (!holding) return;
    const fallback = window.setTimeout(finishEdge, splashEdgeSettleMs() + 400);
    return () => window.clearTimeout(fallback);
  }, [holding]);

  useSplashEdge(rootRef, canvasRef, {
    enabled: present && !dominoing,
    finishing: !open && holding,
    onFinished: finishEdge,
  });

  useLayoutEffect(() => {
    if (open || !progressDone || !crawlProgress || isMobile) return;
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
  }, [open, progressDone, crawlProgress, isMobile]);

  if (!present || typeof document === "undefined") return null;

  const overlayVars = {
    "--bg-transition-enter-ms": `${pcSettle ? PC_BG_ENTER_MS : 220}ms`,
    "--bg-transition-exit-ms": `${exitMs}ms`,
    "--bg-transition-leave-delay": `${leaveDelayMs}ms`,
  } as CSSProperties;

  const rootClassName = [styles.root, visible ? styles.rootVisible : "", crawlProgress ? styles.rootCrawl : "", dominoing ? styles.rootDomino : ""]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div ref={rootRef} className={rootClassName} style={overlayVars} role="dialog" aria-modal="true" aria-label="加载中">
      <div ref={backdropRef} className={styles.stage} aria-hidden>
        {isMobile ? (
          indexes.map((index) => (
            <div key={index} className={`${styles.banner}${index === active ? ` ${styles.bannerActive}` : ""}`}>
              <img
                alt=""
                data-index={index}
                decoding="async"
                src={splashBannerSrc(index)}
                onLoad={(event) => onSettle(index, event.currentTarget.naturalWidth > 0)}
                onError={() => onSettle(index, false)}
              />
            </div>
          ))
        ) : (
          <div className={`${styles.banner} ${styles.bannerActive}`}>
            <img className={styles.fill} alt="" decoding="async" src={PC_PAGE_BG_URL} />
            <img className={styles.portrait} alt="" decoding="async" src={PC_PAGE_BG_URL} />
          </div>
        )}
      </div>
      {dominoing ? null : <canvas ref={canvasRef} className={styles.edge} aria-hidden />}
    </div>,
    document.body,
  );
};
