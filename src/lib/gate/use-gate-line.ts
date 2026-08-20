import { useEffect, useRef, useState } from "react";

import { GATE_LINES, GATE_LINE_INTERVAL_MS, pickNextGateLineIndex } from "@/lib/gate/gate-lines";

import type { GateLineSlot } from "@/lib/gate/gate-line.types";

const emptySlot = (): GateLineSlot => ({ text: "", visible: false });

const pickInitialIndex = (): number => Math.floor(Math.random() * GATE_LINES.length);

export const useGateLine = () => {
  const lastIndexRef = useRef(0);
  const activeIsARef = useRef(true);

  const [slotA, setSlotA] = useState<GateLineSlot>(() => {
    const idx = pickInitialIndex();
    lastIndexRef.current = idx;
    return { text: GATE_LINES[idx] ?? "Memento", visible: true };
  });
  const [slotB, setSlotB] = useState<GateLineSlot>(emptySlot);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;

    const swap = () => {
      const nextIdx = pickNextGateLineIndex(GATE_LINES.length, lastIndexRef.current);
      const nextText = GATE_LINES[nextIdx];
      if (!nextText) return;

      lastIndexRef.current = nextIdx;

      if (activeIsARef.current) {
        setSlotB({ text: nextText, visible: false });
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            if (cancelled) return;
            setSlotA((prev) => ({ ...prev, visible: false }));
            setSlotB({ text: nextText, visible: true });
            activeIsARef.current = false;
          });
        });
        return;
      }

      setSlotA({ text: nextText, visible: false });
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (cancelled) return;
          setSlotB((prev) => ({ ...prev, visible: false }));
          setSlotA({ text: nextText, visible: true });
          activeIsARef.current = true;
        });
      });
    };

    const timer = window.setInterval(swap, GATE_LINE_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      cancelAnimationFrame(frame);
    };
  }, []);

  return { slotA, slotB };
};
