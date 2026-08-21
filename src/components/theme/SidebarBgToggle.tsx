import { useEffect, useId, useRef, useState } from "react";

import { useAnimatedOpen } from "@/lib/dom/use-animated-open";
import { GalleryGateField } from "@/components/gallery/GalleryGateField";

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
  /** 是否展示"循环播放"这一项；目前只对手机端轮播图有意义 */
  showLoopOption: boolean;
  borderFlowEnabled: boolean;
  disabled?: boolean;
  needsUnlock?: boolean;
  unlock?: (raw: string) => Promise<boolean>;
  onEnabledChange: (enabled: boolean) => void;
  onLoopingChange: (looping: boolean) => void;
  onBorderFlowChange: (enabled: boolean) => void;
};

export const SidebarBgToggle = ({
  enabled,
  looping,
  showLoopOption,
  borderFlowEnabled,
  disabled = false,
  needsUnlock = false,
  unlock,
  onEnabledChange,
  onLoopingChange,
  onBorderFlowChange,
}: SidebarBgToggleProps) => {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [prompting, setPrompting] = useState(false);
  const { mounted, visible } = useAnimatedOpen(open);

  useEffect(() => {
    if (!open && !prompting) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setPrompting(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setPrompting(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, prompting]);

  const requestEnable = () => {
    if (needsUnlock && unlock) {
      setOpen(false);
      setPrompting(true);
      return;
    }
    onEnabledChange(true);
  };

  const handleTriggerClick = () => {
    if (disabled) return;
    setPrompting(false);
    setOpen((prev) => !prev);
  };

  const handleToggleEnabled = () => {
    if (disabled) return;
    if (enabled) {
      onEnabledChange(false);
      setOpen(false);
      return;
    }
    requestEnable();
  };

  const handleToggleLooping = () => {
    if (disabled || !enabled) return;
    onLoopingChange(!looping);
    setOpen(false);
  };

  const handleToggleBorderFlow = () => {
    onBorderFlowChange(!borderFlowEnabled);
    setOpen(false);
  };

  const handleUnlocked = () => {
    setPrompting(false);
    onEnabledChange(true);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger}${enabled ? ` ${styles.triggerOn}` : ""}${open ? ` ${styles.triggerOpen}` : ""}`}
        aria-busy={disabled || undefined}
        aria-label="外观设置"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={listId}
        title={disabled ? "背景切换中" : "外观设置"}
        disabled={disabled}
        onClick={handleTriggerClick}
      >
        <ImageIcon />
      </button>

      {mounted ? (
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
          {showLoopOption ? (
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
          ) : null}
          <li role="presentation">
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={borderFlowEnabled}
              tabIndex={visible ? 0 : -1}
              className={`${styles.option}${borderFlowEnabled ? ` ${styles.optionSelected}` : ""}`}
              onClick={handleToggleBorderFlow}
            >
              <span className={styles.optionLabel}>边框流光</span>
              <span className={styles.optionState}>{borderFlowEnabled ? "开" : "关"}</span>
            </button>
          </li>
        </ul>
      ) : null}

      {prompting && unlock ? (
        <div className={styles.prompt} onClick={(event) => event.stopPropagation()}>
          <GalleryGateField
            variant="inline"
            autoFocus
            unlock={unlock}
            onUnlocked={handleUnlocked}
            onCancel={() => setPrompting(false)}
          />
        </div>
      ) : null}
    </div>
  );
};
