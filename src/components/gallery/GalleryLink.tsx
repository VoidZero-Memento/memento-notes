import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { GALLERY_PATH, STAGE_PATH } from "@/lib/gallery/constants";
import { useGalleryGate, useStageGate } from "@/lib/gallery/use-gallery-gate";

import { GalleryGateField } from "@/components/gallery/GalleryGateField";

import styles from "./GalleryLink.module.css";

import type { MouseEvent } from "react";
import type { GalleryLocationState } from "@/lib/gallery/gallery.types";

type GatePortalProps = {
  from: string;
  label: string;
  path: string;
  unlocked: boolean;
  unlock: (raw: string) => Promise<boolean>;
  prompting: boolean;
  onPromptingChange: (prompting: boolean) => void;
};

const GatePortal = ({ from, label, path, unlocked, unlock, prompting, onPromptingChange }: GatePortalProps) => {
  const navigate = useNavigate();
  const state: GalleryLocationState = { from };

  const enter = () => {
    onPromptingChange(false);
    navigate(path, { state });
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    if (unlocked) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onPromptingChange(true);
  };

  if (prompting && !unlocked) {
    return (
      <div className={styles.anchor} onClick={(event) => event.stopPropagation()}>
        <GalleryGateField
          variant="inline"
          autoFocus
          label={`${label}密钥`}
          unlock={unlock}
          onUnlocked={enter}
          onCancel={() => onPromptingChange(false)}
        />
      </div>
    );
  }

  return (
    <Link className={styles.portal} to={path} state={state} aria-label={`打开${label}`} onClick={handleClick}>
      {label}
    </Link>
  );
};

type PromptingKey = "stage" | "gallery" | null;

export const GalleryLink = () => {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;
  const stage = useStageGate();
  const gallery = useGalleryGate();
  const [promptingKey, setPromptingKey] = useState<PromptingKey>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!promptingKey) return;

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setPromptingKey(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPromptingKey(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [promptingKey]);

  return (
    <div className={styles.cluster} ref={rootRef} onClick={(event) => event.stopPropagation()}>
      {promptingKey !== "gallery" ? (
        <GatePortal
          path={STAGE_PATH}
          label="展台"
          from={from}
          unlocked={stage.unlocked}
          unlock={stage.unlock}
          prompting={promptingKey === "stage"}
          onPromptingChange={(next) => setPromptingKey(next ? "stage" : null)}
        />
      ) : null}
      {promptingKey !== "stage" ? (
        <GatePortal
          path={GALLERY_PATH}
          label="画廊"
          from={from}
          unlocked={gallery.unlocked}
          unlock={gallery.unlock}
          prompting={promptingKey === "gallery"}
          onPromptingChange={(next) => setPromptingKey(next ? "gallery" : null)}
        />
      ) : null}
    </div>
  );
};
