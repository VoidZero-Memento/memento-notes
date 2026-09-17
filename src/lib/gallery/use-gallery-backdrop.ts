import { useCallback, useEffect, useRef, useState } from "react";

export const useGalleryBackdrop = () => {
  const [slotA, setSlotA] = useState("");
  const [slotB, setSlotB] = useState("");
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);
  const [frontIsB, setFrontIsB] = useState(false);
  const frontIsBRef = useRef(false);
  const pendingUrlRef = useRef("");
  const armTimerRef = useRef(0);

  const clearArmTimer = () => {
    window.cancelAnimationFrame(armTimerRef.current);
    armTimerRef.current = 0;
  };

  const applyPending = useCallback(() => {
    const url = pendingUrlRef.current;
    if (!url) return;
    pendingUrlRef.current = "";
    if (frontIsBRef.current) setSlotA(url);
    else setSlotB(url);
  }, []);

  const reset = useCallback(() => {
    pendingUrlRef.current = "";
    clearArmTimer();
    setSlotA("");
    setSlotB("");
    setShowA(false);
    setShowB(false);
    setFrontIsB(false);
    frontIsBRef.current = false;
  }, []);

  const boot = useCallback((url: string) => {
    pendingUrlRef.current = "";
    clearArmTimer();
    setSlotA(url);
    setSlotB("");
    setShowA(false);
    setShowB(false);
    setFrontIsB(false);
    frontIsBRef.current = false;
  }, []);

  const reveal = useCallback(() => {
    setShowA(true);
  }, []);

  const arm = useCallback((url: string) => {
    pendingUrlRef.current = url;
    if (frontIsBRef.current) setShowA(false);
    else setShowB(false);
    clearArmTimer();
    armTimerRef.current = window.requestAnimationFrame(() => {
      armTimerRef.current = window.requestAnimationFrame(applyPending);
    });
  }, [applyPending]);

  const play = useCallback(() => {
    applyPending();
    const nextIsB = !frontIsBRef.current;
    frontIsBRef.current = nextIsB;
    setFrontIsB(nextIsB);
    if (nextIsB) setShowB(true);
    else setShowA(true);
  }, [applyPending]);

  useEffect(() => () => clearArmTimer(), []);

  return { slotA, slotB, showA, showB, frontIsB, arm, play, boot, reveal, reset };
};
