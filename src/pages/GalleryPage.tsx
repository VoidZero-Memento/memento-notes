import { useEffect } from "react";

import { useGalleryGate } from "@/lib/gallery/use-gallery-gate";

import { GalleryGate } from "@/components/gallery/GalleryGate";
import { GalleryStage } from "@/components/gallery/GalleryStage";

export const GalleryPage = () => {
  const { unlocked } = useGalleryGate();

  useEffect(() => {
    const previous = document.title;
    document.title = "Memento · 画廊";
    return () => {
      document.title = previous;
    };
  }, []);

  if (!unlocked) return <GalleryGate />;

  return <GalleryStage />;
};
