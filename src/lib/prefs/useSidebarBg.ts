import { useEffect, useState } from "react";

import { persistSidebarBg, readStoredSidebarBg } from "@/lib/prefs/sidebar-bg";

export const useSidebarBg = () => {
  const [enabled, setEnabled] = useState(() => readStoredSidebarBg());

  useEffect(() => {
    persistSidebarBg(enabled);
  }, [enabled]);

  return { enabled, setEnabled };
};
