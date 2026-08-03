import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { subscribeToasts } from "@/lib/toast/toast";

import styles from "./ToastHost.module.css";

import type { ToastItem, ToastType } from "@/lib/toast/toast.types";

const iconClassByType: Record<ToastType, string> = {
  success: styles.iconSuccess,
  error: styles.iconError,
  info: styles.iconInfo,
  warning: styles.iconWarning,
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  const className = `${styles.icon} ${iconClassByType[type]}`;

  if (type === "success") {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d="M7.8 12.2 10.5 14.9 16.2 9.1" fill="none" stroke="var(--background)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "error") {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d="M9 9l6 6M15 9l-6 6" fill="none" stroke="var(--background)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "warning") {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d="M12 7.5v5.5M12 16.2v.5" fill="none" stroke="var(--background)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M12 11V16.5M12 7.5v.5" fill="none" stroke="var(--background)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export const ToastHost = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (typeof document === "undefined" || items.length === 0) return null;

  return createPortal(
    <div className={styles.viewport} role="region" aria-live="polite" aria-relevant="additions">
      {items.map((item) => (
        <div key={item.id} className={styles.item} role="status">
          <ToastIcon type={item.type} />
          <span className={styles.content}>{item.content}</span>
        </div>
      ))}
    </div>,
    document.body,
  );
};
