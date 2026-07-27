import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./RepoSelect.module.css";

import type { GithubRepoConfig } from "@/config/github.types";

type RepoSelectProps = {
  repos: GithubRepoConfig[];
  activeId: string;
};

export const RepoSelect = ({ repos, activeId }: RepoSelectProps) => {
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const activeRepo = repos.find((repo) => repo.id === activeId) ?? repos[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (id: string) => {
    setOpen(false);
    if (id !== activeId) navigate(`/${id}`);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ""}`}
        aria-label="选择笔记仓库"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.triggerLabel}>{activeRepo?.label ?? "选择仓库"}</span>
        <span className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ""}`} aria-hidden />
      </button>

      {open ? (
        <ul id={listId} className={styles.menu} role="listbox" aria-label="笔记仓库列表">
          {repos.map((repo) => {
            const selected = repo.id === activeId;
            return (
              <li key={repo.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`${styles.option}${selected ? ` ${styles.optionSelected}` : ""}`}
                  onClick={() => handleSelect(repo.id)}
                >
                  {repo.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};
