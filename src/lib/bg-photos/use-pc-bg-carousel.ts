import { useRef } from "react";

import { PC_PAGE_BG_URL } from "@/lib/bg-photos/constants";
import { takePreparedPcBg } from "@/lib/bg-photos/prepare-pc-bg";

/** PC 正文底固定一张，不轮播。仅在 PC 且背景开启时调用。 */
export const usePcBgCarousel = () => {
  const urlRef = useRef<string | null>(null);
  if (urlRef.current === null) {
    urlRef.current = takePreparedPcBg() ?? PC_PAGE_BG_URL;
  }
  return { url: urlRef.current };
};
