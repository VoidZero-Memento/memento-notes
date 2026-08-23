import { createContext, useContext, useEffect, useRef, useState } from "react";

import { toast } from "@/lib/toast/toast";

import styles from "./ImmersiveLayer.module.css";

import type { CSSProperties, MouseEvent, ReactNode } from "react";

const HINT_KEY = "memento.immersive-hint";

type ImmersiveApi = {
  enabled: boolean;
  immersive: boolean;
  enter: () => void;
};

type ImmersiveLayerProps = {
  enabled: boolean;
  /** 默认在右上角放「背景」入口；笔记有顶栏时关掉，改用 ImmersiveEnter */
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
  showEnter = true,
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
  const onImmersiveChangeRef = useRef(onImmersiveChange);
  onImmersiveChangeRef.current = onImmersiveChange;

  const enter = () => {
    if (!enabled) return;
    setImmersive(true);
    onImmersiveChangeRef.current?.(true);
    showHintOnce();
  };

  const exit = () => {
    setImmersive(false);
    onImmersiveChangeRef.current?.(false);
  };

  useEffect(() => {
    if (enabled) return;
    setImmersive(false);
    onImmersiveChangeRef.current?.(false);
  }, [enabled]);

  return (
    <ImmersiveContext.Provider value={{ enabled, immersive, enter }}>
      <div
        className={[styles.surface, className].filter(Boolean).join(" ")}
        style={{ ...style, "--immersive": immersive ? "1" : "0" } as CSSProperties}
        data-immersive={immersive ? "true" : undefined}
        role={role}
        aria-label={ariaLabel}
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        {background}
        {enabled && immersive ? (
          <>
            <button
              type="button"
              className={styles.clearHit}
              aria-label="切换背景图"
              onClick={(event) => stopAnd(event, () => onClearTap?.())}
            />
            <button type="button" className={styles.restore} onClick={(event) => stopAnd(event, exit)}>
              返回
            </button>
          </>
        ) : null}
        {enabled && showEnter && !immersive ? (
          <button type="button" className={styles.enter} aria-label="沉浸看背景" onClick={(event) => stopAnd(event, enter)}>
            背景
          </button>
        ) : null}
        <div className={styles.pane} aria-hidden={immersive} {...(immersive ? { inert: true } : {})}>
          {children}
        </div>
      </div>
    </ImmersiveContext.Provider>
  );
};
