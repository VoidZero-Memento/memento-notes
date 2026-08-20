import { useEffect } from "react";

import { useGalleryGate } from "@/lib/gallery/use-gallery-gate";
import { useKeepAliveActive } from "@/lib/keep-alive/keep-alive";

import { GalleryGate } from "@/components/gallery/GalleryGate";
import { GalleryHall } from "@/components/gallery/GalleryHall";

export const GalleryPage = () => {
  const { unlocked, unlock } = useGalleryGate();
  const alive = useKeepAliveActive();

  useEffect(() => {
    if (!alive) return;
    document.title = "Memento · 画廊";
  }, [alive]);

  if (!unlocked) return <GalleryGate title="画廊" unlock={unlock} />;

  return <GalleryHall />;
};
