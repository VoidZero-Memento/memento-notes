import styles from "./NotesShell.module.css";

type OwnerFooterProps = {
  login: string;
  avatarUrl?: string;
};

export const OwnerFooter = ({ login, avatarUrl }: OwnerFooterProps) => (
  <div className={styles.ownerFooter}>
    {avatarUrl ? (
      <img className={styles.ownerAvatar} src={avatarUrl} alt="" width={28} height={28} />
    ) : (
      <span className={styles.ownerAvatarFallback} aria-hidden>
        {login.slice(0, 1).toUpperCase()}
      </span>
    )}
    <span className={styles.ownerLogin}>{login}</span>
  </div>
);
