import { useLayoutEffect, useRef, useState } from "react";

import { GALLERY_MAT_GAP } from "@/lib/gallery/constants";

export const useGalleryArtBox = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [maxBox, setMaxBox] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const apply = (width: number, height: number) => {
      if (width < 1 || height < 1) return;
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

  return { canvasRef, maxBox };
};
