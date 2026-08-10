import { useEffect, useId, useRef, useState } from "react";

import { useAnimatedOpen } from "@/lib/dom/use-animated-open";

import styles from "./SidebarBgToggle.module.css";

const ImageIcon = () => (
  <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden>
    <rect
      x="1.75"
      y="2.75"
      width="12.5"
      height="10.5"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <circle cx="5.4" cy="6.2" r="1.15" fill="currentColor" />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
      d="M2.6 11.4 6.1 8.2l2.1 2.1 2.2-2.6 2.9 3.7"
    />
  </svg>
);

type SidebarBgToggleProps = {
  enabled: boolean;
  looping: boolean;
  /** 为 true 时展示弹出菜单（含循环项）；PC 为 false 时仍直接开关背景 */
  menuMode: boolean;
  disabled?: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onLoopingChange: (looping: boolean) => void;
};

export const SidebarBgToggle = ({
  enabled,
  looping,
  menuMode,
  disabled = false,
  onEnabledChange,
  onLoopingChange,
}: SidebarBgToggleProps) => {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { mounted, visible } = useAnimatedOpen(open);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!menuMode) setOpen(false);
  }, [menuMode]);

  const handleTriggerClick = () => {
    if (disabled) return;
    if (!menuMode) {
      onEnabledChange(!enabled);
      return;
    }
    setOpen((prev) => !prev);
  };

  const handleToggleEnabled = () => {
    if (disabled) return;
    onEnabledChange(!enabled);
    setOpen(false);
  };

  const handleToggleLooping = () => {
    if (disabled || !enabled) return;
    onLoopingChange(!looping);
    setOpen(false);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger}${enabled ? ` ${styles.triggerOn}` : ""}${open ? ` ${styles.triggerOpen}` : ""}`}
        role={menuMode ? undefined : "switch"}
        aria-checked={menuMode ? undefined : enabled}
        aria-busy={disabled || undefined}
        aria-label="背景图"
        aria-haspopup={menuMode ? "menu" : undefined}
        aria-expanded={menuMode ? open : undefined}
        aria-controls={menuMode ? listId : undefined}
        title={
          disabled
            ? "背景切换中"
            : menuMode
              ? "背景图设置"
              : enabled
                ? "关闭背景图"
                : "开启背景图"
        }
        disabled={disabled}
        onClick={handleTriggerClick}
      >
        <ImageIcon />
      </button>

      {menuMode && mounted ? (
        <ul
          id={listId}
          className={`${styles.menu}${visible ? ` ${styles.menuVisible}` : ""}`}
          role="menu"
          aria-label="背景图设置"
          aria-hidden={!visible}
        >
          <li role="presentation">
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={enabled}
              tabIndex={visible ? 0 : -1}
              className={`${styles.option}${enabled ? ` ${styles.optionSelected}` : ""}`}
              disabled={disabled}
              onClick={handleToggleEnabled}
            >
              <span className={styles.optionLabel}>显示背景</span>
              <span className={styles.optionState}>{enabled ? "开" : "关"}</span>
            </button>
          </li>
          <li role="presentation">
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={looping}
              tabIndex={visible && enabled ? 0 : -1}
              className={`${styles.option}${looping && enabled ? ` ${styles.optionSelected}` : ""}`}
              disabled={disabled || !enabled}
              onClick={handleToggleLooping}
            >
              <span className={styles.optionLabel}>循环播放</span>
              <span className={styles.optionState}>{looping ? "开" : "关"}</span>
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
};
