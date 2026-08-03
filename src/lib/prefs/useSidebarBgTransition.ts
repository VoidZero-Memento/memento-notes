import { useEffect, useRef, useState } from "react";

import { BG_TRANSITION_EXIT_MS, BG_TRANSITION_HOLD_MS } from "@/lib/prefs/sidebar-bg";
import { useSidebarBg } from "@/lib/prefs/useSidebarBg";
import { toast } from "@/lib/toast/toast";

export const useSidebarBgTransition = () => {
  const { enabled, setEnabled } = useSidebarBg();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
    };
  }, []);

  const setBgEnabled = (next: boolean) => {
    if (busy || next === enabled) return;

    if (next) {
      setBusy(true);
      setEnabled(true);
      setOverlayOpen(true);

      const holdId = window.setTimeout(() => {
        setOverlayOpen(false);
        const exitId = window.setTimeout(() => {
          setBusy(false);
          toast.success("已开启背景图");
          timersRef.current = timersRef.current.filter((id) => id !== holdId && id !== exitId);
        }, BG_TRANSITION_EXIT_MS);
        timersRef.current.push(exitId);
      }, BG_TRANSITION_HOLD_MS);

      timersRef.current.push(holdId);
      return;
    }

    setEnabled(false);
    toast.success("已关闭背景图");
  };

  return { enabled, setBgEnabled, overlayOpen, busy };
};
