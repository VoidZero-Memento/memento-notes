import { useEffect, useState } from "react";

import { persistBorderFlow, readStoredBorderFlow } from "@/lib/prefs/border-flow";

export const useBorderFlow = () => {
  const [enabled, setEnabled] = useState(() => readStoredBorderFlow());

  useEffect(() => {
    persistBorderFlow(enabled);
  }, [enabled]);

  return { enabled, setEnabled };
};
