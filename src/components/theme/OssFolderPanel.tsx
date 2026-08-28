import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { blurActiveInside } from "@/lib/dom/blur-active-inside";
import { OssFolderChips } from "@/components/theme/OssFolderChips";

import styles from "./OssFolderPanel.module.css";

import type { CSSProperties, RefObject } from "react";

type OssFolderPanelProps = {
  id: string;
  visible: boolean;
  disabled?: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  onPicked: () => void;
};

const SIDE_PAD = 12;

const measure = (anchor: HTMLElement): CSSProperties => {
  const trigger = anchor.getBoundingClientRect();
  const sidebar = anchor.closest("aside")?.getBoundingClientRect();
  const left = Math.round((sidebar?.left ?? trigger.left) + SIDE_PAD);
  const right = Math.round((sidebar?.right ?? trigger.right) - SIDE_PAD);
  return {
    left,
    width: Math.max(168, right - left),
    bottom: Math.round(window.innerHeight - trigger.top + 8),
  };
};

export const OssFolderPanel = ({
  id,
  visible,
  disabled = false,
  anchorRef,
  panelRef,
  onPicked,
}: OssFolderPanelProps) => {
  const localRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<CSSProperties>({});

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    panelRef.current = node;
  };

  useLayoutEffect(() => {
    const origin = anchorRef.current;
    if (!origin) return;

    const update = () => setBox(measure(origin));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  return createPortal(
    <div
      ref={setRefs}
      id={id}
      className={`${styles.panel}${visible ? ` ${styles.panelVisible}` : ""}`}
      style={box}
      role="dialog"
      aria-label="选择图集"
      aria-hidden={!visible}
      inert={!visible || undefined}
    >
      <OssFolderChips
        disabled={disabled}
        onPicked={() => {
          blurActiveInside(localRef.current);
          onPicked();
        }}
      />
    </div>,
    document.body,
  );
};
