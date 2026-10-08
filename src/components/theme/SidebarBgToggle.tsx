import { useEffect, useId, useRef, useState } from "react";

import { OSS_FOLDER_LABELS } from "@/lib/bg-photos/oss-folder";
import { useOssFolder } from "@/lib/bg-photos/useOssFolder";
import { blurActiveInside } from "@/lib/dom/blur-active-inside";
import { useAnimatedOpen } from "@/lib/dom/use-animated-open";
import { nextSidebarBgEffect, SIDEBAR_BG_EFFECT_LABELS } from "@/lib/prefs/sidebar-bg-effect";
import { GalleryGateField } from "@/components/gallery/GalleryGateField";
import { OssFolderPanel } from "@/components/theme/OssFolderPanel";

import styles from "./SidebarBgToggle.module.css";

import type { SidebarBgEffect } from "@/lib/prefs/sidebar-bg-effect.types";

const SlidersIcon = () => (
  <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      d="M2 3.75h12M2 8h12M2 12.25h12"
    />
    <circle cx="10.5" cy="3.75" r="1.7" fill="rgba(8, 14, 28, 0.9)" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="5.5" cy="8" r="1.7" fill="rgba(8, 14, 28, 0.9)" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="9.5" cy="12.25" r="1.7" fill="rgba(8, 14, 28, 0.9)" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

type SidebarBgToggleProps = {
  enabled: boolean;
  looping: boolean;
  /** 循环播放：PC 写死双图、手机图集轮播都用 */
  showLoopOption: boolean;
  /** 图集切换：PC / 手机同一套入口与面板 */
  showFolderOption?: boolean;
  /** 背景模糊开关；PC / 手机都显示 */
  showBgBlurOption?: boolean;
  /** 边框流光是否必须先开背景模糊；手机不锁，模糊关时保持现有流光 */
  lockBorderFlowToBgBlur?: boolean;
  borderFlowEnabled: boolean;
  bgBlurEnabled: boolean;
  galleryLinkEnabled: boolean;
  disabled?: boolean;
  needsUnlock?: boolean;
  unlock?: (raw: string) => Promise<boolean>;
  onEnabledChange: (enabled: boolean) => void;
  onLoopingChange: (looping: boolean) => void;
  /** 切换动画：传入 effect + onEffectChange 才显示该菜单项，点击按顺序循环 */
  effect?: SidebarBgEffect;
  onEffectChange?: (effect: SidebarBgEffect) => void;
  onBorderFlowChange: (enabled: boolean) => void;
  onBgBlurChange: (enabled: boolean) => void;
  onGalleryLinkChange: (enabled: boolean) => void;
};

export const SidebarBgToggle = ({
  enabled,
  looping,
  showLoopOption,
  showFolderOption = false,
  showBgBlurOption = false,
  lockBorderFlowToBgBlur = showBgBlurOption,
  borderFlowEnabled,
  bgBlurEnabled,
  galleryLinkEnabled,
  disabled = false,
  needsUnlock = false,
  unlock,
  onEnabledChange,
  onLoopingChange,
  effect,
  onEffectChange,
  onBorderFlowChange,
  onBgBlurChange,
  onGalleryLinkChange,
}: SidebarBgToggleProps) => {
  const { folder } = useOssFolder();
  const listId = useId();
  const folderPanelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const folderPanelRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [prompting, setPrompting] = useState(false);
  const menuOpen = open && !folderOpen && !prompting;
  const { mounted, visible } = useAnimatedOpen(menuOpen);
  const { mounted: folderMounted, visible: folderVisible } = useAnimatedOpen(folderOpen);

  useEffect(() => {
    if (!showFolderOption) setFolderOpen(false);
  }, [showFolderOption]);

  useEffect(() => {
    if (!open && !folderOpen && !prompting) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || folderPanelRef.current?.contains(target)) return;
      blurActiveInside(menuRef.current);
      blurActiveInside(folderPanelRef.current);
      setOpen(false);
      setFolderOpen(false);
      setPrompting(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (folderOpen) {
        blurActiveInside(folderPanelRef.current);
        setFolderOpen(false);
        setOpen(true);
        return;
      }
      blurActiveInside(menuRef.current);
      setOpen(false);
      setFolderOpen(false);
      setPrompting(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [folderOpen, open, prompting]);

  const requestEnable = () => {
    if (needsUnlock && unlock) {
      blurActiveInside(menuRef.current);
      setOpen(false);
      setFolderOpen(false);
      setPrompting(true);
      return;
    }
    onEnabledChange(true);
  };

  const handleTriggerClick = () => {
    if (disabled) return;
    setPrompting(false);
    if (folderOpen) {
      blurActiveInside(folderPanelRef.current);
      setFolderOpen(false);
      setOpen(false);
      return;
    }
    if (open) blurActiveInside(menuRef.current);
    setOpen((prev) => !prev);
  };

  const borderFlowAvailable = !lockBorderFlowToBgBlur || !enabled || bgBlurEnabled;

  const handleToggleEnabled = () => {
    if (disabled) return;
    if (enabled) {
      onEnabledChange(false);
      blurActiveInside(menuRef.current);
      setOpen(false);
      return;
    }
    requestEnable();
  };

  const handleToggleLooping = () => {
    if (disabled || !enabled) return;
    onLoopingChange(!looping);
    blurActiveInside(menuRef.current);
    setOpen(false);
  };

  /** 循环切换动画，菜单保持展开方便连续点选 */
  const handleCycleEffect = () => {
    if (disabled || !enabled || !effect || !onEffectChange) return;
    onEffectChange(nextSidebarBgEffect(effect));
  };

  const handleToggleBorderFlow = () => {
    if (!borderFlowAvailable) return;
    onBorderFlowChange(!borderFlowEnabled);
    blurActiveInside(menuRef.current);
    setOpen(false);
  };

  const handleToggleBgBlur = () => {
    if (!enabled) return;
    onBgBlurChange(!bgBlurEnabled);
    blurActiveInside(menuRef.current);
    setOpen(false);
  };

  const handleToggleGalleryLink = () => {
    if (!enabled) return;
    onGalleryLinkChange(!galleryLinkEnabled);
    blurActiveInside(menuRef.current);
    setOpen(false);
  };

  const handleUnlocked = () => {
    setPrompting(false);
    onEnabledChange(true);
  };

  const handleOpenFolders = () => {
    if (disabled || !enabled) return;
    blurActiveInside(menuRef.current);
    setOpen(false);
    setFolderOpen(true);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger}${enabled ? ` ${styles.triggerOn}` : ""}${open || folderOpen ? ` ${styles.triggerOpen}` : ""}`}
        aria-busy={disabled || undefined}
        aria-label="外观设置"
        aria-haspopup="menu"
        aria-expanded={open || folderOpen}
        aria-controls={folderOpen ? folderPanelId : listId}
        title={disabled ? "背景切换中" : "外观设置"}
        disabled={disabled}
        onClick={handleTriggerClick}
      >
        <SlidersIcon />
      </button>

      {mounted ? (
        <ul
          ref={menuRef}
          id={listId}
          className={`${styles.menu}${visible ? ` ${styles.menuVisible}` : ""}`}
          role="menu"
          aria-label="背景图设置"
          aria-hidden={!visible}
          inert={!visible || undefined}
        >
          <li role="presentation" className={styles.groupLabel}>
            背景
          </li>
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
          {showFolderOption ? (
            <li role="presentation">
              <button
                type="button"
                role="menuitem"
                tabIndex={visible && enabled ? 0 : -1}
                className={styles.option}
                disabled={disabled || !enabled}
                onClick={handleOpenFolders}
              >
                <span className={styles.optionLabel}>主题图集</span>
                <span className={styles.optionState}>{OSS_FOLDER_LABELS[folder]}</span>
              </button>
            </li>
          ) : null}
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
          {effect && onEffectChange ? (
            <li role="presentation">
              <button
                type="button"
                role="menuitem"
                tabIndex={visible && enabled ? 0 : -1}
                className={styles.option}
                disabled={disabled || !enabled}
                onClick={handleCycleEffect}
              >
                <span className={styles.optionLabel}>切换动画</span>
                <span className={styles.optionState}>{SIDEBAR_BG_EFFECT_LABELS[effect]}</span>
              </button>
            </li>
          ) : null}
          <li role="presentation" className={`${styles.groupLabel} ${styles.groupLabelDivider}`}>
            效果
          </li>
          {showBgBlurOption ? (
            <li role="presentation">
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={bgBlurEnabled}
                tabIndex={visible && enabled ? 0 : -1}
                className={`${styles.option}${bgBlurEnabled && enabled ? ` ${styles.optionSelected}` : ""}`}
                disabled={!enabled}
                onClick={handleToggleBgBlur}
              >
                <span className={styles.optionLabel}>背景模糊</span>
                <span className={styles.optionState}>{bgBlurEnabled ? "开" : "关"}</span>
              </button>
            </li>
          ) : null}
          <li role="presentation">
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={borderFlowEnabled}
              tabIndex={visible && borderFlowAvailable ? 0 : -1}
              className={`${styles.option}${borderFlowEnabled && borderFlowAvailable ? ` ${styles.optionSelected}` : ""}`}
              disabled={!borderFlowAvailable}
              onClick={handleToggleBorderFlow}
            >
              <span className={styles.optionLabel}>边框流光</span>
              <span className={styles.optionState}>{borderFlowEnabled && borderFlowAvailable ? "开" : "关"}</span>
            </button>
          </li>
          <li role="presentation">
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={galleryLinkEnabled}
              tabIndex={visible && enabled ? 0 : -1}
              className={`${styles.option}${galleryLinkEnabled && enabled ? ` ${styles.optionSelected}` : ""}`}
              disabled={!enabled}
              onClick={handleToggleGalleryLink}
            >
              <span className={styles.optionLabel}>展台画廊</span>
              <span className={styles.optionState}>{galleryLinkEnabled ? "开" : "关"}</span>
            </button>
          </li>
        </ul>
      ) : null}

      {showFolderOption && folderMounted ? (
        <OssFolderPanel
          id={folderPanelId}
          visible={folderVisible}
          disabled={disabled}
          anchorRef={rootRef}
          panelRef={folderPanelRef}
          onPicked={() => setFolderOpen(false)}
        />
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
