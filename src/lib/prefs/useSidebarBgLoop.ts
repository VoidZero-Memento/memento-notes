import { useEffect, useState } from "react";

import { persistSidebarBgLoop, readStoredSidebarBgLoop } from "@/lib/prefs/sidebar-bg-loop";

export const useSidebarBgLoop = () => {
  const [looping, setLooping] = useState(() => readStoredSidebarBgLoop());

  useEffect(() => {
    persistSidebarBgLoop(looping);
  }, [looping]);

  return { looping, setLooping };
};
