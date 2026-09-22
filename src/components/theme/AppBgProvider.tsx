import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { MOBILE_BG_MQ } from "@/lib/bg-photos/constants";
import { useMediaQuery } from "@/lib/dom/use-media-query";
import { paneOfPath } from "@/lib/keep-alive/keep-alive";
import { PC_BG_EXIT_MS } from "@/lib/prefs/sidebar-bg";
import { useSidebarBg } from "@/lib/prefs/useSidebarBg";
import { useSidebarBgLoop } from "@/lib/prefs/useSidebarBgLoop";
import { notifyAppBgPainted } from "@/lib/splash/splash-gate";

import styles from "./AppPageBackground.module.css";

import type { AppBgContextValue } from "@/lib/bg-photos/app-bg.types";
import type { CSSProperties, ReactNode } from "react";
import type { MobileBgCarouselHandle } from "./MobileBgCarousel";
import type { PcBgCarouselHandle } from "./PcBgCarousel";

const AppBgContext = createContext<AppBgContextValue | null>(null);

const MobileBgCarousel = lazy(() =>
  import("./MobileBgCarousel").then((m) => ({ default: m.MobileBgCarousel })),
);

const PcBgCarousel = lazy(() => import("./PcBgCarousel").then((m) => ({ default: m.PcBgCarousel })));

type AppBgProviderProps = {
  children: ReactNode;
};

export const AppBgProvider = ({ children }: AppBgProviderProps) => {
  const { enabled } = useSidebarBg();
  const { looping } = useSidebarBgLoop();
  const isMobile = useMediaQuery(MOBILE_BG_MQ);
  const pane = paneOfPath(useLocation().pathname);
  const notesActive = pane === "notes";
  const [immersive, setImmersive] = useState(false);
  const [ready, setReady] = useState(() => !enabled);
  const [leaving, setLeaving] = useState(false);
  const [trackedEnabled, setTrackedEnabled] = useState(enabled);
  const enabledRef = useRef(enabled);
  const isMobileRef = useRef(isMobile);
  const mobileRef = useRef<MobileBgCarouselHandle>(null);
  const pcRef = useRef<PcBgCarouselHandle>(null);

  useEffect(() => {
    const wasEnabled = enabledRef.current;
    const wasMobile = isMobileRef.current;
    enabledRef.current = enabled;
    isMobileRef.current = isMobile;

    if (!enabled) {
      setReady(true);
      setImmersive(false);
      return;
    }

    if (!wasEnabled || wasMobile !== isMobile) setReady(false);
  }, [enabled, isMobile]);

  useEffect(() => {
    if (ready) notifyAppBgPainted();
  }, [ready]);

  if (enabled !== trackedEnabled || (isMobile && leaving)) {
    setTrackedEnabled(enabled);
    setLeaving(!enabled && !isMobile);
  }

  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => setLeaving(false), PC_BG_EXIT_MS + 40);
    return () => window.clearTimeout(id);
  }, [leaving]);

  const advance = useCallback(() => {
    mobileRef.current?.advance();
    pcRef.current?.advance();
  }, []);

  const value = useMemo<AppBgContextValue>(
    () => ({ ready, immersive, advance, setImmersive }),
    [advance, immersive, ready],
  );

  const loopingNow = enabled && looping && notesActive && !immersive;
  const showLayer = enabled || (!isMobile && leaving);
  const layerStyle = { "--bg-leave-ms": `${PC_BG_EXIT_MS}ms` } as CSSProperties;

  return (
    <AppBgContext.Provider value={value}>
      {showLayer ? (
        <div className={`${styles.layer}${leaving && !enabled ? ` ${styles.leave}` : ""}`} style={layerStyle} aria-hidden>
          <Suspense fallback={null}>
            {isMobile ? (
              <MobileBgCarousel
                ref={mobileRef}
                looping={loopingNow}
                immersive={immersive}
                onReady={() => setReady(true)}
              />
            ) : (
              <PcBgCarousel ref={pcRef} immersive={immersive} onReady={() => setReady(true)} />
            )}
          </Suspense>
        </div>
      ) : null}
      {children}
    </AppBgContext.Provider>
  );
};

export const useAppBg = (): AppBgContextValue => {
  const context = useContext(AppBgContext);
  if (!context) {
    throw new Error("useAppBg 必须在 AppBgProvider 内使用");
  }
  return context;
};
