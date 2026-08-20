import { useEffect, useMemo, useRef, useState } from "react";

import { GALLERY_MAT_GAP } from "@/lib/gallery/constants";
import { fitFrameSize } from "@/lib/gallery/fit-frame";

import type { GalleryNaturalSize } from "@/lib/gallery/gallery.types";

export const useGalleryArtBox = (natural: GalleryNaturalSize) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [maxBox, setMaxBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const apply = (width: number, height: number) => {
      setMaxBox({
        width: Math.max(0, Math.floor(width) - GALLERY_MAT_GAP * 2),
        height: Math.max(0, Math.floor(height) - GALLERY_MAT_GAP * 2),
      });
    };

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      apply(rect.width, rect.height);
    });
    observer.observe(el);
    apply(el.clientWidth, el.clientHeight);
    return () => observer.disconnect();
  }, []);

  const art = useMemo(
    () => fitFrameSize(natural.width, natural.height, maxBox.width, maxBox.height),
    [maxBox.height, maxBox.width, natural.height, natural.width],
  );

  return { canvasRef, art };
};
