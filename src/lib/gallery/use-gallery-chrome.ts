import { useCallback, useEffect, useRef, useState } from "react";

import { GALLERY_CHROME_IDLE_MS, GALLERY_CHROME_PULSE_MS, GALLERY_HINT_MS } from "@/lib/gallery/constants";

export const useGalleryChrome = (ready: boolean) => {
  const [chromeOn, setChromeOn] = useState(true);
  const [hintOn, setHintOn] = useState(true);
  const hideRef = useRef(0);
  const hintRef = useRef(0);
  const hintDoneRef = useRef(false);

  const scheduleHide = useCallback((ms: number) => {
    window.clearTimeout(hideRef.current);
    hideRef.current = window.setTimeout(() => setChromeOn(false), ms);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setChromeOn(true);
    if (!hintDoneRef.current) {
      setHintOn(true);
      hintRef.current = window.setTimeout(() => {
        hintDoneRef.current = true;
        setHintOn(false);
      }, GALLERY_HINT_MS);
    }
    scheduleHide(GALLERY_CHROME_IDLE_MS);
    return () => {
      window.clearTimeout(hintRef.current);
      window.clearTimeout(hideRef.current);
    };
  }, [ready, scheduleHide]);

  const dismissHint = useCallback(() => {
    hintDoneRef.current = true;
    window.clearTimeout(hintRef.current);
    setHintOn(false);
  }, []);

  const pulseChrome = useCallback(() => {
    setChromeOn(true);
    scheduleHide(GALLERY_CHROME_PULSE_MS);
  }, [scheduleHide]);

  return { chromeOn, hintOn, dismissHint, pulseChrome };
};
