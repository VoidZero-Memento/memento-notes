import styles from "./OutlineTree.module.css";

import type { OutlineItem } from "@/lib/markdown/outline.types";

type OutlineTreeProps = {
  items: OutlineItem[];
  emptyLabel?: string;
  onNavigate: (id: string) => void;
};

export const OutlineTree = ({ items, emptyLabel = "暂无大纲", onNavigate }: OutlineTreeProps) => {
  if (items.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>;
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
              <span className={styles.name}>{item.text}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
