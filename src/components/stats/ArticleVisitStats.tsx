import styles from "./ArticleVisitStats.module.css";

/** 单文阅读量（不蒜子 page_pv value id 固定，勿改） */
export const ArticleVisitStats = () => (
  <p className={styles.root} aria-label="本文阅读量">
    <span className={styles.dot} aria-hidden />
    <span className={styles.label}>本文阅读量</span>
    <span id="busuanzi_value_page_pv" className={styles.value} />
    <span className={styles.unit}>次</span>
  </p>
);
