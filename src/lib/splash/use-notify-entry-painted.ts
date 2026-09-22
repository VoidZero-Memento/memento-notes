import { useLayoutEffect } from "react";

import { notifyEntryPainted } from "@/lib/splash/splash-gate";

/** 当前入口画面已画上，splash 可以退场 */
export const useNotifyEntryPainted = (ready = true) => {
  useLayoutEffect(() => {
    if (!ready) return;
    notifyEntryPainted();
  }, [ready]);
};
