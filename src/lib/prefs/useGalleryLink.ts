import { useEffect, useState } from "react";

import { persistGalleryLink, readStoredGalleryLink } from "@/lib/prefs/gallery-link";

export const useGalleryLink = () => {
  const [enabled, setEnabled] = useState(() => readStoredGalleryLink());

  useEffect(() => {
    persistGalleryLink(enabled);
  }, [enabled]);

  return { enabled, setEnabled };
};
