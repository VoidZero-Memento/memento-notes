import { useEffect, useRef, useState } from "react";

import { BG_TRANSITION_EXIT_MS, PC_BG_EXIT_MS } from "@/lib/prefs/sidebar-bg";
import { useSidebarBg } from "@/lib/prefs/useSidebarBg";
import { toast } from "@/lib/toast/toast";

type UseSidebarBgTransitionOptions = {
  /** 手机 / PC 开启时都走当前图集清单 + 首图真实等待 */
  isMobile: boolean;
};

export const useSidebarBgTransition = ({ isMobile }: UseSidebarBgTransitionOptions) => {
  const { enabled, setEnabled } = useSidebarBg();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [overlayCrawl, setOverlayCrawl] = useState(false);
  const timersRef = useRef<number[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  useEffect(() => {
    return () => {
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const finishEnable = (exitMs = BG_TRANSITION_EXIT_MS) => {
    setOverlayOpen(false);
    const exitId = window.setTimeout(() => {
      setBusy(false);
      setOverlayCrawl(false);
      toast.success("已开启背景图");
      timersRef.current = timersRef.current.filter((id) => id !== exitId);
    }, exitMs);
    timersRef.current.push(exitId);
  };

  const setBgEnabled = (next: boolean) => {
    if (busy || next === enabled) return;

    if (next) {
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
      setBusy(true);

      if (isMobileRef.current) {
        setOverlayOpen(true);
        setOverlayCrawl(true);
        abortRef.current?.abort();
        const abort = new AbortController();
        abortRef.current = abort;

        // 动态加载，避免未开背景时把图集清单打进首屏
        void import("@/lib/bg-photos/prepare-mobile-bg")
          .then(({ prepareMobileBgTransition }) => prepareMobileBgTransition(abort.signal))
          .then(() => {
            if (abort.signal.aborted) return;
            setEnabled(true);
            finishEnable();
          })
          .catch(() => {
            if (abort.signal.aborted) return;
            setEnabled(true);
            finishEnable();
          });
        return;
      }

      setOverlayOpen(true);
      setOverlayCrawl(true);
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      void import("@/lib/bg-photos/prepare-pc-bg")
        .then(({ preparePcBgTransition }) => preparePcBgTransition(abort.signal))
        .then(() => {
          if (abort.signal.aborted) return;
          setEnabled(true);
          finishEnable();
        })
        .catch(() => {
          if (abort.signal.aborted) return;
          setEnabled(true);
          finishEnable();
        });
      return;
    }

    abortRef.current?.abort();
    abortRef.current = null;
    setEnabled(false);
    if (isMobileRef.current) {
      toast.success("已关闭背景图");
      return;
    }

    setBusy(true);
    const toastId = window.setTimeout(() => {
      setBusy(false);
      toast.success("已关闭背景图");
      timersRef.current = timersRef.current.filter((id) => id !== toastId);
    }, PC_BG_EXIT_MS);
    timersRef.current.push(toastId);
  };

  return { enabled, setBgEnabled, overlayOpen, busy, overlayCrawl };
};
