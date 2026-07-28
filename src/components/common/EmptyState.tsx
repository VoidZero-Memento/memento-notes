import styles from "./EmptyState.module.css";

import type { EmptyStateProps } from "./EmptyState.types";

const NotebookIllustration = () => (
  <svg className={styles.illustration} viewBox="0 0 96 96" aria-hidden>
    <circle
      className={styles.orbit}
      cx="48"
      cy="48"
      r="38"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeDasharray="3 6"
    />
    <g transform="translate(15 15) scale(0.75)">
      <path
        className={styles.notebookBody}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        d="M31 22h26a5 5 0 0 1 5 5v34a5 5 0 0 1-5 5H31a5 5 0 0 1-5-5V27a5 5 0 0 1 5-5Z"
      />
      <path
        className={styles.notebookSpine}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        d="M35 22v44"
      />
      <path
        className={styles.notebookLines}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M43 34h14M43 43h14M43 52h9"
      />
      <path
        className={styles.sparkleBig}
        fill="currentColor"
        d="M70 20 71.6 24.4 76 26 71.6 27.6 70 32 68.4 27.6 64 26 68.4 24.4 70 20Z"
      />
      <path
        className={styles.sparkleSmall}
        fill="currentColor"
        d="M22 62 23 64.6 25.6 65.6 23 66.6 22 69.2 21 66.6 18.4 65.6 21 64.6 22 62Z"
      />
      <circle className={styles.dotFar} cx="20" cy="30" r="2" fill="currentColor" />
    </g>
  </svg>
);

const OutlineIllustration = () => (
  <svg className={styles.illustration} viewBox="0 0 96 96" aria-hidden>
    <circle
      className={styles.orbit}
      cx="48"
      cy="48"
      r="38"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeDasharray="3 6"
    />
    <g transform="translate(48 48)">
      <circle className={styles.outlineDot} cx="-16" cy="-18" r="2.6" fill="currentColor" />
      <path className={styles.outlineBarLong} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" d="M-7 -18h26" />
      <circle className={styles.outlineDot} cx="-16" cy="-6" r="2.6" fill="currentColor" />
      <path className={styles.outlineBarMed} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" d="M-7 -6h20" />
      <circle className={styles.outlineDotSmall} cx="-11" cy="6" r="2.1" fill="currentColor" />
      <path className={styles.outlineBarShort} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" d="M-4 6h13" />
      <circle className={styles.outlineDot} cx="-16" cy="18" r="2.6" fill="currentColor" />
      <path className={styles.outlineBarMed} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" d="M-7 18h20" />
    </g>
  </svg>
);

export const EmptyState = ({ title, description, action, variant = "default" }: EmptyStateProps) => {
  const isCompact = variant === "compact";
  return (
    <div className={`${styles.root} ${isCompact ? styles.compact : ""}`}>
      {isCompact ? <OutlineIllustration /> : <NotebookIllustration />}
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action && !isCompact ? (
        <button type="button" className={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
};
