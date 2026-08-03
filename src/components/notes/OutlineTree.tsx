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

/** 图标槽宽 + 与文字间距，使下级图标与上级文字起点对齐 */
const ICON_SLOT = 12;
const ROW_GAP = 7;
const BASE_PAD = 8;
/** 一级（含常见的 h2 空心菱形）沿用原缩进，避免整体右移 */
const ROOT_STEP = 14;
const NEST_STEP = ICON_SLOT + ROW_GAP;

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
        <rect x="3.5" y="3.5" width="9" height="9" rx="1.4" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg className={`${styles.icon} ${styles.iconLn}`} viewBox="0 0 16 16" aria-hidden>
      <rect x="3.2" y="6.8" width="9.6" height="2.4" rx="1.2" fill="currentColor" />
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
        // level≤2 保持原位；更深层级按「图标对齐上级文字」递进
        const paddingLeft =
          item.level <= 2
            ? BASE_PAD + (item.level - 1) * ROOT_STEP
            : BASE_PAD + ROOT_STEP + (item.level - 2) * NEST_STEP;
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
