import { useEffect, useId, useRef, useState } from "react";

import { useAnimatedOpen } from "@/lib/dom/use-animated-open";
import { THEME_IDS, THEME_LABELS, THEME_PREVIEWS } from "@/lib/theme/theme";
import { useTheme } from "@/lib/theme/useTheme";
import { toast } from "@/lib/toast/toast";

import styles from "./ThemeSwitcher.module.css";

const PaletteIcon = () => (
  <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden>
    <path
      fill="currentColor"
      d="M8 1.5a6.5 6.5 0 1 0 0 13c.9 0 1.5-.65 1.5-1.4 0-.36-.14-.68-.37-.92a.9.9 0 0 1-.25-.6c0-.5.42-.88.92-.88h1.1A3.1 3.1 0 0 0 14 7.6C14 4.2 11.3 1.5 8 1.5Z"
      opacity="0.18"
    />
    <circle cx="4.6" cy="7.2" r="1.1" fill="currentColor" />
    <circle cx="6.6" cy="4.4" r="1.1" fill="currentColor" />
    <circle cx="9.6" cy="4.4" r="1.1" fill="currentColor" />
    <circle cx="11.4" cy="7.2" r="1.1" fill="currentColor" />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      d="M8 1.5a6.5 6.5 0 1 0 0 13c.9 0 1.5-.65 1.5-1.4 0-.36-.14-.68-.37-.92a.9.9 0 0 1-.25-.6c0-.5.42-.88.92-.88h1.1A3.1 3.1 0 0 0 14 7.6C14 4.2 11.3 1.5 8 1.5Z"
    />
  </svg>
);

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
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

  const handleSelect = (id: (typeof THEME_IDS)[number]) => {
    if (id !== theme) {
      setTheme(id);
      toast.success(`已切换至「${THEME_LABELS[id]}」`);
    }
    setOpen(false);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ""}`}
        aria-label="切换主题"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <PaletteIcon />
      </button>

      {mounted ? (
        <ul
          id={listId}
          className={`${styles.menu}${visible ? ` ${styles.menuVisible}` : ""}`}
          role="listbox"
          aria-label="主题列表"
          aria-hidden={!visible}
        >
          {THEME_IDS.map((id) => {
            const selected = id === theme;
            return (
              <li key={id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={visible ? 0 : -1}
                  className={`${styles.option}${selected ? ` ${styles.optionSelected}` : ""}`}
                  onClick={() => handleSelect(id)}
                >
                  <span className={styles.swatch} style={{ background: THEME_PREVIEWS[id] }} aria-hidden />
                  <span className={styles.optionLabel}>{THEME_LABELS[id]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};
