import { GATE_LINE_FADE_MS, isCjkGateLine } from "@/lib/gate/gate-lines";
import { useGateLine } from "@/lib/gate/use-gate-line";

import styles from "./GateTitle.module.css";

import type { GateLineSlot } from "@/lib/gate/gate-line.types";
import type { CSSProperties } from "react";

const Line = ({ slot }: { slot: GateLineSlot }) => {
  if (!slot.text) return null;

  return (
    <span
      className={[
        styles.line,
        isCjkGateLine(slot.text) ? styles.lineCjk : "",
        slot.visible ? styles.lineVisible : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!slot.visible}
    >
      {slot.text}
    </span>
  );
};

export const GateTitle = () => {
  const { slotA, slotB } = useGateLine();
  const fadeVars = { "--gate-line-fade-ms": `${GATE_LINE_FADE_MS}ms` } as CSSProperties;

  return (
    <p className={styles.title} style={fadeVars} aria-live="polite">
      <Line slot={slotA} />
      <Line slot={slotB} />
    </p>
  );
};
