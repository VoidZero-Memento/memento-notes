import styles from "./SidebarBgToggle.module.css";

const ImageIcon = () => (
  <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden>
    <rect
      x="1.75"
      y="2.75"
      width="12.5"
      height="10.5"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <circle cx="5.4" cy="6.2" r="1.15" fill="currentColor" />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
      d="M2.6 11.4 6.1 8.2l2.1 2.1 2.2-2.6 2.9 3.7"
    />
  </svg>
);

type SidebarBgToggleProps = {
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
};

export const SidebarBgToggle = ({ enabled, disabled = false, onChange }: SidebarBgToggleProps) => {
  const handleToggle = () => {
    if (disabled) return;
    onChange(!enabled);
  };

  return (
    <button
      type="button"
      className={`${styles.trigger}${enabled ? ` ${styles.triggerOn}` : ""}`}
      role="switch"
      aria-checked={enabled}
      aria-busy={disabled || undefined}
      aria-label="背景图"
      title={disabled ? "背景切换中" : enabled ? "关闭背景图" : "开启背景图"}
      disabled={disabled}
      onClick={handleToggle}
    >
      <ImageIcon />
    </button>
  );
};
