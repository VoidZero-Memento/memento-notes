import styles from "./SiteVisitStats.module.css";

/** 全站访问量 / 访客数（不蒜子 value id 固定，勿改） */
export const SiteVisitStats = () => (
  <div className={styles.root} aria-label="站点访问统计">
    <span className={styles.scan} aria-hidden />
    <span className={styles.item}>
      <span className={styles.label}>网站访问量</span>
      <span id="busuanzi_value_site_pv" className={styles.value} />
      <span className={styles.unit}>次</span>
    </span>
    <span className={styles.divider} aria-hidden>
      ·
    </span>
    <span className={styles.item}>
      <span className={styles.label}>网站访客数</span>
      <span id="busuanzi_value_site_uv" className={styles.value} />
      <span className={styles.unit}>人</span>
    </span>
  </div>
);
