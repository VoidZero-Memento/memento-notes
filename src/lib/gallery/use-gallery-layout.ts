import { useEffect, useMemo, useRef, useState } from "react";

import { GALLERY_CHROME_PAD, GALLERY_CHROME_PAD_MOBILE, GALLERY_COMPACT_MAX_WIDTH } from "@/lib/gallery/constants";
import { fitFrameSize } from "@/lib/gallery/fit-frame";

import type { GalleryNaturalSize, GalleryStageStatus } from "@/lib/gallery/gallery.types";

export const useGalleryLayout = (status: GalleryStageStatus, naturalSize: GalleryNaturalSize) => {
  const wellRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= GALLERY_COMPACT_MAX_WIDTH,
  );
  const [maxBox, setMaxBox] = useState({ width: 0, height: 0 });
  const [fxPaused, setFxPaused] = useState(true);

  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth <= GALLERY_COMPACT_MAX_WIDTH);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (status !== "ready") {
      setFxPaused(true);
      return;
    }
    const id = window.setTimeout(() => setFxPaused(false), 520);
    return () => window.clearTimeout(id);
  }, [status]);

  useEffect(() => {
    const el = wellRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const pad =
        window.innerWidth <= GALLERY_COMPACT_MAX_WIDTH
          ? GALLERY_CHROME_PAD_MOBILE
          : GALLERY_CHROME_PAD;
      setMaxBox({
        width: Math.max(0, rect.width - pad * 2),
        height: Math.max(0, rect.height - pad * 2),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [status]);

  const chromePad = compact ? GALLERY_CHROME_PAD_MOBILE : GALLERY_CHROME_PAD;
  const frame = useMemo(
    () => fitFrameSize(naturalSize.width, naturalSize.height, maxBox.width, maxBox.height),
    [maxBox.height, maxBox.width, naturalSize.height, naturalSize.width],
  );

  return { wellRef, compact, chromePad, frame, fxPaused };
};
