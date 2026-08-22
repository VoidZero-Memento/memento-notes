import { useEffect } from "react";

import { CHROME_SWIPE_EXIT_EXTRA_PX, CHROME_SWIPE_HINT_KEY } from "@/lib/chrome-swipe/constants";
import { useChromeSwipe } from "@/lib/chrome-swipe/use-chrome-swipe";
import { toast } from "@/lib/toast/toast";

import styles from "./ChromeSwipeLayer.module.css";

import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

type ChromeSwipeLayerProps = {
  enabled: boolean;
  blocked?: boolean;
  onClearTap?: () => void;
  className?: string;
  style?: CSSProperties;
  background?: ReactNode;
  children: ReactNode;
  role?: string;
  "aria-label"?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onContextMenu?: MouseEventHandler<HTMLDivElement>;
};

const showHintOnce = () => {
  try {
    if (sessionStorage.getItem(CHROME_SWIPE_HINT_KEY)) return;
    sessionStorage.setItem(CHROME_SWIPE_HINT_KEY, "1");
  } catch {
    /* private mode */
  }
  toast.info("轻触换图，右滑恢复");
};

/** 左滑收起 chrome、右滑恢复；可复用到其它页面 */
export const ChromeSwipeLayer = ({
  enabled,
  blocked = false,
  onClearTap,
  className,
  style,
  background,
  children,
  role,
  onClick,
  onContextMenu,
  "aria-label": ariaLabel,
}: ChromeSwipeLayerProps) => {
  const { surfaceRef, progress, dragging, cleared } = useChromeSwipe({
    enabled,
    blocked,
    onClearTap,
  });

  useEffect(() => {
    if (cleared) showHintOnce();
  }, [cleared]);

  const moving = dragging || Math.abs(progress) > 0.001;
  const gone = progress >= 0.999;
  const paneStyle: CSSProperties | undefined = moving
    ? { transform: `translate3d(calc(${-progress} * (100vw + ${CHROME_SWIPE_EXIT_EXTRA_PX}px)), 0, 0)` }
    : undefined;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <div
      ref={surfaceRef}
      className={[styles.surface, className].filter(Boolean).join(" ")}
      style={{ ...style, "--chrome-swipe-progress": String(clamped) } as CSSProperties}
      data-cleared={cleared ? "true" : undefined}
      data-swipe={enabled ? "on" : undefined}
      role={role}
      aria-label={ariaLabel}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {background}
      <div
        className={`${styles.pane}${moving ? ` ${styles.paneActive}` : ""}${gone ? ` ${styles.paneGone}` : ""}`}
        style={paneStyle}
        aria-hidden={cleared}
        {...(cleared ? { inert: true } : {})}
      >
        {children}
      </div>
    </div>
  );
};
