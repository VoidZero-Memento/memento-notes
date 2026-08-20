import { useEffect } from "react";

import { useGalleryGate } from "@/lib/gallery/use-gallery-gate";

import { GalleryGate } from "@/components/gallery/GalleryGate";
import { GalleryHall } from "@/components/gallery/GalleryHall";

export const GalleryPage = () => {
  const { unlocked, unlock } = useGalleryGate();

  useEffect(() => {
    const previous = document.title;
    document.title = "Memento · 画廊";
    return () => {
      document.title = previous;
    };
  }, []);

  if (!unlocked) return <GalleryGate title="画廊" unlock={unlock} />;

  return <GalleryHall />;
};
