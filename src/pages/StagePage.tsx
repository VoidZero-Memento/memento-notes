import { useEffect } from "react";

import { useStageGate } from "@/lib/gallery/use-gallery-gate";

import { GalleryGate } from "@/components/gallery/GalleryGate";
import { GalleryStage } from "@/components/gallery/GalleryStage";

export const StagePage = () => {
  const { unlocked, unlock } = useStageGate();

  useEffect(() => {
    const previous = document.title;
    document.title = "Memento · 展台";
    return () => {
      document.title = previous;
    };
  }, []);

  if (!unlocked) return <GalleryGate title="展台" unlock={unlock} />;

  return <GalleryStage />;
};
