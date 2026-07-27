import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { applyTheme, parseThemeId } from "@/lib/theme/theme";

export const useThemeFromUrl = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    applyTheme(parseThemeId(searchParams.get("theme")));
  }, [searchParams]);
};
