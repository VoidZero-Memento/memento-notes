import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { GalleryGateField } from "@/components/gallery/GalleryGateField";

import fx from "./GalleryFx.module.css";
import styles from "./GalleryGate.module.css";

import type { GalleryLocationState } from "@/lib/gallery/gallery.types";

type GalleryGateProps = {
  title: string;
  unlock: (raw: string) => Promise<boolean>;
};

export const GalleryGate = ({ title, unlock }: GalleryGateProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = useCallback(() => {
    const from = (location.state as GalleryLocationState | null)?.from;
    if (from && from !== location.pathname) {
      navigate(from);
      return;
    }
    navigate("/", { replace: true });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleBack();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack]);

  return (
    <div className={styles.root}>
      <div className={fx.aurora} aria-hidden />
      <div className={fx.stars} aria-hidden />
      <div className={fx.vignette} aria-hidden />

      <div className={styles.panel}>
        <p className={styles.title}>{title}</p>
        <GalleryGateField variant="page" autoFocus unlock={unlock} />
      </div>

      <button type="button" className={styles.back} aria-label="返回笔记" onClick={handleBack}>
        <svg className={styles.backIcon} viewBox="0 0 16 16" aria-hidden>
          <path
            d="M10.5 3.5 5.5 8l5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};
