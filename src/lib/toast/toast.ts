import type { ToastItem, ToastListener, ToastType } from "./toast.types";

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 2800;
const DEDUPE_WINDOW_MS = 1200;

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<ToastListener>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const recentKeys = new Map<string, number>();

const emit = () => {
  listeners.forEach((listener) => listener(items));
};

const remove = (id: string) => {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return;
  items = next;
  emit();
};

const isDuplicate = (type: ToastType, content: string) => {
  const key = `${type}:${content}`;
  const now = Date.now();
  const last = recentKeys.get(key);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return true;
  recentKeys.set(key, now);
  for (const [k, t] of recentKeys) {
    if (now - t >= DEDUPE_WINDOW_MS) recentKeys.delete(k);
  }
  return false;
};

const push = (type: ToastType, content: string, duration = DEFAULT_DURATION) => {
  if (!content || isDuplicate(type, content)) return;

  seq += 1;
  const id = `toast-${seq}`;
  const item: ToastItem = { id, type, content, duration };
  const next = [...items, item];
  const overflow = next.slice(0, Math.max(0, next.length - MAX_TOASTS));
  overflow.forEach((old) => {
    const timer = timers.get(old.id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(old.id);
    }
  });
  items = next.slice(-MAX_TOASTS);
  emit();

  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => {
        remove(id);
      }, duration),
    );
  }
};

export const toast = {
  success: (content: string, duration?: number) => push("success", content, duration ?? DEFAULT_DURATION),
  error: (content: string, duration?: number) => push("error", content, duration ?? DEFAULT_DURATION),
  info: (content: string, duration?: number) => push("info", content, duration ?? DEFAULT_DURATION),
  warning: (content: string, duration?: number) => push("warning", content, duration ?? DEFAULT_DURATION),
};

export const subscribeToasts = (listener: ToastListener) => {
  listeners.add(listener);
  listener(items);
  return () => {
    listeners.delete(listener);
  };
};

export const dismissToast = (id: string) => {
  remove(id);
};
