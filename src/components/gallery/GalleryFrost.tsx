import styles from "./GalleryFrost.module.css";

type GalleryFrostProps = {
  off?: boolean;
};

/** PC 展台/画廊共用：正文开背景模糊同款磨砂，罩层更透 */
export const GalleryFrost = ({ off = false }: GalleryFrostProps) => (
  <div className={`${styles.frost}${off ? ` ${styles.off}` : ""}`} aria-hidden />
);
