import { useEffect, useState } from "react";

import { applyTheme, persistTheme, readStoredTheme } from "@/lib/theme/theme";

import type { ThemeId } from "@/lib/theme/theme";

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeId>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  return { theme, setTheme };
};
