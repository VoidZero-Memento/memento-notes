import { EmptyState } from "@/components/common/EmptyState";
import styles from "./OutlineTree.module.css";

import type { EmptyStateAction } from "@/components/common/EmptyState.types";
import type { OutlineItem } from "@/lib/markdown/outline.types";

type OutlineTreeProps = {
  items: OutlineItem[];
  emptyLabel?: string;
  emptyAction?: EmptyStateAction;
  onNavigate: (id: string) => void;
};

const LevelIcon = ({ level }: { level: number }) => {
  if (level <= 1) {
    return (
      <svg className={`${styles.icon} ${styles.iconL1}`} viewBox="0 0 16 16" aria-hidden>
        <path fill="currentColor" d="M8 1.6 13.8 8 8 14.4 2.2 8 8 1.6Z" />
      </svg>
    );
  }

  if (level === 2) {
    return (
      <svg className={`${styles.icon} ${styles.iconL2}`} viewBox="0 0 16 16" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          d="M8 2.4 13.2 8 8 13.6 2.8 8 8 2.4Z"
        />
      </svg>
    );
  }

  if (level === 3) {
    return (
      <svg className={`${styles.icon} ${styles.iconL3}`} viewBox="0 0 16 16" aria-hidden>
        <rect x="3.2" y="3.2" width="9.6" height="9.6" rx="1.6" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg className={`${styles.icon} ${styles.iconLn}`} viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="2.4" fill="currentColor" />
    </svg>
  );
};

export const OutlineTree = ({
  items,
  emptyLabel = "暂无大纲",
  emptyAction,
  onNavigate,
}: OutlineTreeProps) => {
  if (items.length === 0) {
    return <EmptyState title={emptyLabel} action={emptyAction} variant="compact" />;
  }

  return (
    <ul className={styles.tree}>
      {items.map((item) => {
        const paddingLeft = 8 + (item.level - 1) * 14;
        return (
          <li key={item.id} className={styles.item}>
            <button
              type="button"
              className={styles.row}
              style={{ paddingLeft }}
              title={item.text}
              onClick={() => onNavigate(item.id)}
            >
              <LevelIcon level={item.level} />
              <span className={styles.name}>{item.text}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
