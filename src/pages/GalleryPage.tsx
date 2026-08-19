import { useEffect } from "react";

import { GalleryStage } from "@/components/gallery/GalleryStage";

export const GalleryPage = () => {
  useEffect(() => {
    const previous = document.title;
    document.title = "Memento · 画廊";
    return () => {
      document.title = previous;
    };
  }, []);

  return <GalleryStage />;
};
