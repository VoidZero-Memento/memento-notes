import { createContext, useContext, useEffect, useRef, useState } from "react";

import { toast } from "@/lib/toast/toast";

import styles from "./ImmersiveLayer.module.css";

import type { CSSProperties, MouseEvent, ReactNode } from "react";

export const IMMERSIVE_MS = 640;

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
  toast.info("轻触换图，点返回还原");
};

const stopAnd = (event: MouseEvent<HTMLButtonElement>, fn: () => void) => {
  event.stopPropagation();
  fn();
};

export const useImmersive = (): boolean => useContext(ImmersiveContext)?.immersive ?? false;

export const ImmersiveEnter = ({ className, children = "背景" }: ImmersiveEnterProps) => {
  const api = useContext(ImmersiveContext);
  if (!api?.enabled || api.immersive) return null;
  return (
    <button
      type="button"
      className={className}
      aria-label="沉浸看背景"
      onClick={(event) => stopAnd(event, api.enter)}
    >
      {children}
    </button>
  );
};

/** 手机沉浸看背景：点「背景」隐藏界面，轻触换图，点「返回」还原 */
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
  const [immersive, setImmersive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const leaveTimer = useRef(0);
  const onImmersiveChangeRef = useRef(onImmersiveChange);
  onImmersiveChangeRef.current = onImmersiveChange;
  const chromeOff = immersive || leaving;

  const enter = () => {
    if (!enabled) return;
    window.clearTimeout(leaveTimer.current);
    setLeaving(false);
    setImmersive(true);
    onImmersiveChangeRef.current?.(true);
    showHintOnce();
  };

  const exit = () => {
    if (!immersive) return;
    setImmersive(false);
    setLeaving(true);
    onImmersiveChangeRef.current?.(false);
    window.clearTimeout(leaveTimer.current);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    leaveTimer.current = window.setTimeout(() => setLeaving(false), reduced ? 0 : IMMERSIVE_MS);
  };

  useEffect(() => {
    if (enabled) return;
    window.clearTimeout(leaveTimer.current);
    setImmersive(false);
    setLeaving(false);
    onImmersiveChangeRef.current?.(false);
  }, [enabled]);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  return (
    <ImmersiveContext.Provider value={{ enabled, immersive, enter }}>
      <div
        className={[styles.surface, className].filter(Boolean).join(" ")}
        style={{ ...style, "--immersive": immersive ? "1" : "0", "--immersive-ms": `${IMMERSIVE_MS}ms` } as CSSProperties}
        data-immersive={chromeOff ? "true" : undefined}
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
        <div className={styles.pane} aria-hidden={chromeOff} {...(chromeOff ? { inert: true } : {})}>
          {children}
        </div>
      </div>
    </ImmersiveContext.Provider>
  );
};
