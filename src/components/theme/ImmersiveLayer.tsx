import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { MOBILE_BG_MQ } from "@/lib/bg-photos/constants";
import { useMediaQuery } from "@/lib/dom/use-media-query";
import { toast } from "@/lib/toast/toast";

import styles from "./ImmersiveLayer.module.css";

import type { CSSProperties, MouseEvent, ReactNode } from "react";

export const IMMERSIVE_MS = 640;
const PC_IMMERSIVE_MS = 420;

const HINT_KEY = "memento.immersive-hint";

type ImmersiveApi = {
  enabled: boolean;
  immersive: boolean;
  enter: () => void;
};

type ImmersiveLayerProps = {
  enabled: boolean;
  /** 右上角「背景」入口；仅笔记空态需要，展台/画廊关掉 */
  showEnter?: boolean;
  onImmersiveChange?: (immersive: boolean) => void;
  onClearTap?: () => void;
  className?: string;
  style?: CSSProperties;
  background?: ReactNode;
  children: ReactNode;
  role?: string;
  "aria-label"?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
};

type ImmersiveEnterProps = {
  className?: string;
  children?: ReactNode;
};

const ImmersiveContext = createContext<ImmersiveApi | null>(null);

const showHintOnce = () => {
  try {
    if (sessionStorage.getItem(HINT_KEY)) return;
    sessionStorage.setItem(HINT_KEY, "1");
  } catch {
    /* private mode */
  }
  toast.info(
    window.matchMedia("(pointer: coarse)").matches ? "轻触换图，点返回还原" : "点击空白换图，点返回还原",
  );
};

const stopAnd = (event: MouseEvent<HTMLButtonElement>, fn: () => void) => {
  event.stopPropagation();
  fn();
};

export const useImmersive = (): boolean => useContext(ImmersiveContext)?.immersive ?? false;

export const ImmersiveEnter = ({ className, children = "背景" }: ImmersiveEnterProps) => {
  const api = useContext(ImmersiveContext);
  if (!api?.enabled) return null;
  return (
    <button
      type="button"
      className={className}
      aria-label="沉浸看背景"
      tabIndex={api.immersive ? -1 : 0}
      aria-hidden={api.immersive}
      onClick={(event) => {
        if (api.immersive) {
          event.stopPropagation();
          return;
        }
        stopAnd(event, api.enter);
      }}
    >
      {children}
    </button>
  );
};

/** 沉浸看背景：隐藏界面，点击空白换图，点「返回」还原 */
export const ImmersiveLayer = ({
  enabled,
  showEnter = false,
  onImmersiveChange,
  onClearTap,
  className,
  style,
  background,
  children,
  role,
  onClick,
  onContextMenu,
  "aria-label": ariaLabel,
}: ImmersiveLayerProps) => {
  const isMobile = useMediaQuery(MOBILE_BG_MQ);
  const durationMs = isMobile ? IMMERSIVE_MS : PC_IMMERSIVE_MS;
  const [immersive, setImmersive] = useState(false);
  const onImmersiveChangeRef = useRef(onImmersiveChange);
  onImmersiveChangeRef.current = onImmersiveChange;

  const enter = useCallback(() => {
    if (!enabled) return;
    setImmersive(true);
    onImmersiveChangeRef.current?.(true);
    showHintOnce();
  }, [enabled]);

  const exit = useCallback(() => {
    if (!immersive) return;
    setImmersive(false);
    onImmersiveChangeRef.current?.(false);
  }, [immersive]);

  useEffect(() => {
    if (enabled) return;
    setImmersive(false);
    onImmersiveChangeRef.current?.(false);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !immersive || isMobile) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      exit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, exit, immersive, isMobile]);

  return (
    <ImmersiveContext.Provider value={{ enabled, immersive, enter }}>
      <div
        className={[styles.surface, className].filter(Boolean).join(" ")}
        style={{ ...style, "--immersive": immersive ? "1" : "0", "--immersive-ms": `${durationMs}ms` } as CSSProperties}
        data-immersive={immersive ? "true" : undefined}
        role={role}
        aria-label={ariaLabel}
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        {background}
        {enabled ? (
          <>
            <button
              type="button"
              className={`${styles.clearHit}${immersive ? ` ${styles.clearHitOn}` : ""}`}
              tabIndex={immersive ? 0 : -1}
              aria-hidden={!immersive}
              aria-label="切换背景图"
              onClick={(event) => stopAnd(event, () => onClearTap?.())}
            />
            <button
              type="button"
              className={`${styles.restore}${immersive ? ` ${styles.restoreOn}` : ""}`}
              tabIndex={immersive ? 0 : -1}
              aria-hidden={!immersive}
              onClick={(event) => stopAnd(event, exit)}
            >
              返回
            </button>
          </>
        ) : null}
        {enabled && showEnter ? (
          <button
            type="button"
            className={`${styles.enter}${immersive ? "" : ` ${styles.enterOn}`}`}
            tabIndex={immersive ? -1 : 0}
            aria-hidden={immersive}
            aria-label="沉浸看背景"
            onClick={(event) => stopAnd(event, enter)}
          >
            背景
          </button>
        ) : null}
        <div className={styles.pane} data-pane aria-hidden={immersive} {...(immersive ? { inert: true } : {})}>
          {children}
        </div>
      </div>
    </ImmersiveContext.Provider>
  );
};
