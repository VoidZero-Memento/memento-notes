import { useEffect, useRef, useState } from "react";

import { getNoteRawContent } from "@/lib/github/github.service";
import { useRepos } from "@/lib/github/ReposContext";
import { parseOutline } from "@/lib/markdown/parse-outline";
import { DEFAULT_NOTE_TITLE, getNoteTitleFromPath } from "@/lib/note-title";
import { FileTree } from "./FileTree";
import { LoadingState } from "./LoadingState";
import { MarkdownViewer } from "./MarkdownViewer";
import { OutlineTree } from "./OutlineTree";
import { OwnerFooter } from "./OwnerFooter";
import { RepoSelect } from "./RepoSelect";
import styles from "./NotesShell.module.css";

import type { GithubRepoConfig } from "@/config/github.types";
import type { GithubFileTreeNode } from "@/lib/github/github.types";

type SidebarMode = "files" | "outline";

type NotesWorkspaceProps = {
  config: GithubRepoConfig;
  tree: GithubFileTreeNode[];
  treeError: string | null;
};

export const NotesWorkspace = ({ config, tree, treeError }: NotesWorkspaceProps) => {
  const { repos } = useRepos();
  const viewerBodyRef = useRef<HTMLDivElement>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("files");
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const outlineItems = content ? parseOutline(content) : [];
  const outlineEmptyLabel = selectedPath ? "暂无大纲" : "请先选择文件";

  useEffect(() => {
    document.title = getNoteTitleFromPath(selectedPath);
    return () => {
      document.title = DEFAULT_NOTE_TITLE;
    };
  }, [selectedPath]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

  const openMobileNav = (mode: SidebarMode) => {
    setSidebarMode(mode);
    setMobileNavOpen(true);
  };

  const handleSelect = async (path: string) => {
    setSelectedPath(path);
    setMobileNavOpen(false);
    setLoading(true);
    setError(null);

    try {
      const raw = await getNoteRawContent(config, path);
      setContent(raw);
    } catch (err) {
      setContent(null);
      setError(err instanceof Error ? err.message : "加载笔记内容失败");
    } finally {
      setLoading(false);
    }
  };

  const handleOutlineNavigate = (id: string) => {
    const target = document.getElementById(id);
    const container = viewerBodyRef.current;
    if (!target || !container) return;

    const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollTo({
      top: container.scrollTop + offset,
      behavior: "smooth",
    });
    setMobileNavOpen(false);
  };

  const sidebarClassName = [
    styles.sidebar,
    mobileNavOpen ? styles.sidebarOpen : "",
    sidebarHidden ? styles.sidebarHidden : "",
  ]
    .filter(Boolean)
    .join(" ");

  const backdropClassName = mobileNavOpen
    ? `${styles.backdrop} ${styles.backdropVisible}`
    : styles.backdrop;

  return (
    <div className={`${styles.root}${sidebarHidden ? ` ${styles.rootSidebarHidden}` : ""}`}>
      <button
        type="button"
        className={backdropClassName}
        aria-label="关闭导航"
        aria-hidden={!mobileNavOpen}
        tabIndex={mobileNavOpen ? 0 : -1}
        onClick={() => setMobileNavOpen(false)}
      />
      <aside className={sidebarClassName} aria-hidden={sidebarHidden}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitleRow}>
            <h2 className={styles.sidebarTitle}>笔记仓库</h2>
            <div className={styles.sidebarTitleActions}>
              <button
                type="button"
                className={styles.sidebarCollapse}
                aria-label="隐藏目录"
                onClick={() => setSidebarHidden(true)}
              >
                «
              </button>
              <button
                type="button"
                className={styles.mobileClose}
                aria-label="关闭"
                onClick={() => setMobileNavOpen(false)}
              >
                ×
              </button>
            </div>
          </div>
          <RepoSelect repos={repos} activeId={config.id} />
          <div className={styles.sidebarTabs} role="tablist" aria-label="侧栏面板">
            <span
              className={`${styles.sidebarTabsThumb}${sidebarMode === "outline" ? ` ${styles.sidebarTabsThumbOutline}` : ""}`}
              aria-hidden="true"
            />
            <button
              type="button"
              role="tab"
              aria-selected={sidebarMode === "files"}
              className={`${styles.sidebarTab}${sidebarMode === "files" ? ` ${styles.sidebarTabActive}` : ""}`}
              onClick={() => setSidebarMode("files")}
            >
              文件
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sidebarMode === "outline"}
              className={`${styles.sidebarTab}${sidebarMode === "outline" ? ` ${styles.sidebarTabActive}` : ""}`}
              onClick={() => setSidebarMode("outline")}
            >
              大纲
            </button>
          </div>
        </div>
        <div className={styles.treePanel}>
          <div hidden={sidebarMode !== "files"}>
            {treeError ? <p className={styles.error}>{treeError}</p> : null}
            {!treeError ? (
              <FileTree
                key={config.id}
                nodes={tree}
                selectedPath={selectedPath}
                onSelect={handleSelect}
              />
            ) : null}
          </div>
          <div hidden={sidebarMode !== "outline"}>
            <OutlineTree
              items={outlineItems}
              emptyLabel={outlineEmptyLabel}
              onNavigate={handleOutlineNavigate}
            />
          </div>
        </div>
        <OwnerFooter login={config.owner} avatarUrl={config.ownerAvatarUrl} />
      </aside>
      <main className={styles.viewer}>
        <div className={styles.mobileBar}>
          <h2 className={styles.mobileBarTitle}>笔记仓库</h2>
          <div className={styles.mobileBarActions}>
            <button type="button" className={styles.mobileBarBtn} onClick={() => openMobileNav("files")}>
              文件
            </button>
            <button type="button" className={styles.mobileBarBtn} onClick={() => openMobileNav("outline")}>
              大纲
            </button>
          </div>
        </div>
        {sidebarHidden ? (
          <button
            type="button"
            className={styles.sidebarExpand}
            aria-label="显示目录"
            onClick={() => setSidebarHidden(false)}
          >
            <span className={styles.sidebarExpandMark} aria-hidden />
          </button>
        ) : null}
        {selectedPath ? <p className={styles.viewerPath}>{selectedPath}</p> : null}
        <div className={styles.viewerBody} ref={viewerBodyRef}>
          {!selectedPath ? <p className={styles.status}>请选择一个 Markdown 文件</p> : null}
          {selectedPath && loading ? <LoadingState label="加载中" /> : null}
          {selectedPath && error ? <p className={styles.error}>{error}</p> : null}
          {selectedPath && content && !loading ? (
            <MarkdownViewer content={content} headingIds={outlineItems.map((item) => item.id)} />
          ) : null}
        </div>
      </main>
    </div>
  );
};
