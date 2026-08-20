import { useEffect } from "react";

import { useStageGate } from "@/lib/gallery/use-gallery-gate";
import { useKeepAliveActive } from "@/lib/keep-alive/keep-alive";

import { GalleryGate } from "@/components/gallery/GalleryGate";
import { GalleryStage } from "@/components/gallery/GalleryStage";

export const StagePage = () => {
  const { unlocked, unlock } = useStageGate();
  const alive = useKeepAliveActive();

  useEffect(() => {
    if (!alive) return;
    document.title = "Memento · 展台";
  }, [alive]);

  if (!unlocked) return <GalleryGate title="展台" unlock={unlock} />;

  return <GalleryStage />;
};
