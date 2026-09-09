import { useEffect, useState } from "react";

import { persistBgBlur, readStoredBgBlur } from "@/lib/prefs/bg-blur";

export const useBgBlur = () => {
  const [enabled, setEnabled] = useState(() => readStoredBgBlur());

  useEffect(() => {
    persistBgBlur(enabled);
  }, [enabled]);

  return { enabled, setEnabled };
};
