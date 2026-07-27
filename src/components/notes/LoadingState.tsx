import styles from "./LoadingState.module.css";

type LoadingStateProps = {
  label?: string;
};

export const LoadingState = ({ label = "加载中" }: LoadingStateProps) => {
  return (
    <div className={styles.root} role="status" aria-live="polite" aria-label={label}>
      <div className={styles.orb} aria-hidden>
        <span className={styles.ring} />
        <span className={styles.core} />
      </div>
      <p className={styles.label}>
        {label}
        <span className={styles.dots} aria-hidden>
          <i />
          <i />
          <i />
        </span>
      </p>
    </div>
  );
};
