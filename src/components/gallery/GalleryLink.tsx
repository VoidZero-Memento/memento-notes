import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { GALLERY_PATH } from "@/lib/gallery/constants";
import { useGalleryGate } from "@/lib/gallery/use-gallery-gate";

import { GalleryGateField } from "@/components/gallery/GalleryGateField";

import styles from "./GalleryLink.module.css";

import type { MouseEvent } from "react";
import type { GalleryLocationState } from "@/lib/gallery/gallery.types";

export const GalleryLink = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unlocked, unlock } = useGalleryGate();
  const [prompting, setPrompting] = useState(false);
  const state: GalleryLocationState = { from: `${location.pathname}${location.search}` };

  const enter = () => {
    navigate(GALLERY_PATH, { state });
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
          unlock={unlock}
          onUnlocked={enter}
          onCancel={() => setPrompting(false)}
        />
      </div>
    );
  }

  return (
    <Link
      className={styles.portal}
      to={GALLERY_PATH}
      state={state}
      aria-label="打开画廊"
      onClick={handleClick}
    >
      画廊
    </Link>
  );
};
