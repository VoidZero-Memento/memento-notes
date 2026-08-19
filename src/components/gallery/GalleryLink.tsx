import { Link, useLocation } from "react-router-dom";

import { GALLERY_PATH } from "@/lib/gallery/constants";

import styles from "./GalleryLink.module.css";

import type { GalleryLocationState } from "@/lib/gallery/gallery.types";

const PrismIcon = () => (
  <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
      d="M8 1.8 14.2 13.2H1.8Z"
    />
    <path fill="none" stroke="currentColor" strokeWidth="1.2" d="M8 1.8v11.4M4.2 10.2h7.6" />
    <path fill="currentColor" d="M8 6.2 9 8.4 8 9.2 7 8.4Z" opacity="0.85" />
  </svg>
);

export const GalleryLink = () => {
  const location = useLocation();
  const state: GalleryLocationState = { from: `${location.pathname}${location.search}` };

  return (
    <Link className={styles.trigger} to={GALLERY_PATH} state={state} aria-label="打开画廊" title="画廊">
      <PrismIcon />
    </Link>
  );
};
