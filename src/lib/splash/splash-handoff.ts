import type { SplashHandoffListener } from "@/lib/splash/splash-handoff.types";

const HANDOFF_TIMEOUT_MS = 1500;

const listeners = new Set<SplashHandoffListener>();

export const subscribeSplashHandoff = (listener: SplashHandoffListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** 通知正文背景接管加载页当前图；无订阅者立即返回，最长等待 1500ms */
export const requestSplashHandoff = (url: string) => {
  if (!listeners.size) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const targets = [...listeners];
    let pending = targets.length;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, HANDOFF_TIMEOUT_MS);
    for (const listener of targets) {
      let called = false;
      listener(url, () => {
        if (called) return;
        called = true;
        pending -= 1;
        if (pending <= 0) finish();
      });
    }
  });
};
