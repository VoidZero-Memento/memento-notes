import { useEffect, useRef, useState } from "react";

import { BG_TRANSITION_EXIT_MS, BG_TRANSITION_HOLD_MS } from "@/lib/prefs/sidebar-bg";
import { useSidebarBg } from "@/lib/prefs/useSidebarBg";
import { toast } from "@/lib/toast/toast";

type UseSidebarBgTransitionOptions = {
  /** 仅手机开启时走 images.json + 首图真实等待 */
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

  const finishEnable = () => {
    setOverlayOpen(false);
    const exitId = window.setTimeout(() => {
      setBusy(false);
      setOverlayCrawl(false);
      toast.success("已开启背景图");
      timersRef.current = timersRef.current.filter((id) => id !== exitId);
    }, BG_TRANSITION_EXIT_MS);
    timersRef.current.push(exitId);
  };

  const setBgEnabled = (next: boolean) => {
    if (busy || next === enabled) return;

    if (next) {
      setBusy(true);
      setOverlayOpen(true);

      if (isMobileRef.current) {
        setOverlayCrawl(true);
        abortRef.current?.abort();
        const abort = new AbortController();
        abortRef.current = abort;

        // 动态加载，避免 PC 主路径带上 images.json / 预加载逻辑
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

      setOverlayCrawl(false);
      setEnabled(true);

      const holdId = window.setTimeout(() => {
        finishEnable();
        timersRef.current = timersRef.current.filter((id) => id !== holdId);
      }, BG_TRANSITION_HOLD_MS);

      timersRef.current.push(holdId);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = null;
    setEnabled(false);
    toast.success("已关闭背景图");
  };

  return { enabled, setBgEnabled, overlayOpen, busy, overlayCrawl };
};
