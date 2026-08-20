import { useState } from "react";
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
};

const GatePortal = ({ from, label, path, unlocked, unlock }: GatePortalProps) => {
  const navigate = useNavigate();
  const [prompting, setPrompting] = useState(false);
  const state: GalleryLocationState = { from };

  const enter = () => {
    navigate(path, { state });
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    if (unlocked) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setPrompting(true);
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
          onCancel={() => setPrompting(false)}
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

export const GalleryLink = () => {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;
  const stage = useStageGate();
  const gallery = useGalleryGate();

  return (
    <div className={styles.cluster} onClick={(event) => event.stopPropagation()}>
      <GatePortal path={STAGE_PATH} label="展台" from={from} unlocked={stage.unlocked} unlock={stage.unlock} />
      <GatePortal path={GALLERY_PATH} label="画廊" from={from} unlocked={gallery.unlocked} unlock={gallery.unlock} />
    </div>
  );
};
