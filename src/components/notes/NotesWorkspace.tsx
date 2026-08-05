import { useEffect, useRef, useState } from "react";

import { describeGithubError } from "@/lib/github/describe-github-error";
import { useRepos } from "@/lib/github/ReposContext";
import { parseOutline } from "@/lib/markdown/parse-outline";
import { getNoteTitleFromPath, getRepoWorkspaceTitle } from "@/lib/note-title";
import { useNoteContent } from "@/lib/notes/use-note-content";
import { useSidebarBgTransition } from "@/lib/prefs/useSidebarBgTransition";
import { EmptyState } from "@/components/common/EmptyState";
import { BgTransitionOverlay } from "@/components/theme/BgTransitionOverlay";
import { SidebarBgToggle } from "@/components/theme/SidebarBgToggle";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { FileTree } from "./FileTree";
import { LoadingState } from "./LoadingState";
import { MarkdownViewer } from "./MarkdownViewer";
import { NoteEnter } from "./NoteEnter";
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
  treeLoading?: boolean;
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
};

const describeNoteLoadError = (message: string) => describeGithubError(message).description;

const SidebarEdgeChevron = ({ direction }: { direction: "left" | "right" }) => (
  <svg
    className={direction === "left" ? styles.sidebarCollapseMark : styles.sidebarExpandMark}
    viewBox="0 0 16 16"
    aria-hidden
  >
    <path
      d={direction === "left" ? "M10.5 3.5 5.5 8l5 4.5" : "M5.5 3.5 10.5 8l-5 4.5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const NotesWorkspace = ({
  config,
  tree,
  treeError,
  treeLoading = false,
  selectedPath,
  onSelectPath,
}: NotesWorkspaceProps) => {
  const { repos } = useRepos();
  const {
    enabled: sidebarBgEnabled,
    setBgEnabled: setSidebarBgEnabled,
    overlayOpen: bgOverlayOpen,
    busy: bgTransitionBusy,
  } = useSidebarBgTransition();
  const viewerBodyRef = useRef<HTMLDivElement>(null);
  const { content, loading, pending, error, selectNote, retry } = useNoteContent(
    config,
    selectedPath,
    onSelectPath,
  );
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("files");
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [sidebarFx, setSidebarFx] = useState<"idle" | "collapse" | "expand">("idle");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sidebarFxTimerRef = useRef<number | null>(null);

  const clearSidebarFxTimer = () => {
    if (sidebarFxTimerRef.current == null) return;
    window.clearTimeout(sidebarFxTimerRef.current);
    sidebarFxTimerRef.current = null;
  };

  const playSidebarFx = (fx: "collapse" | "expand", durationMs: number) => {
    clearSidebarFxTimer();
    setSidebarFx(fx);
    sidebarFxTimerRef.current = window.setTimeout(() => {
      setSidebarFx("idle");
      sidebarFxTimerRef.current = null;
    }, durationMs);
  };

  const collapseSidebar = () => {
    setSidebarHidden(true);
    playSidebarFx("collapse", 520);
  };

  const expandSidebar = () => {
    setSidebarHidden(false);
    playSidebarFx("expand", 580);
  };

  useEffect(() => () => clearSidebarFxTimer(), []);

  const handleBrowseFiles = () => {
    setSidebarMode("files");
    setSidebarHidden(false);
    setMobileNavOpen(true);
  };

  const outlineItems = content ? parseOutline(content) : [];
  const outlineEmptyLabel = selectedPath ? "暂无大纲" : "请先选择文件";
  const outlineEmptyAction = selectedPath
    ? undefined
    : { label: "浏览文件", onClick: handleBrowseFiles };

  const workspaceTitle = getRepoWorkspaceTitle(config.label);

  useEffect(() => {
    document.title = getNoteTitleFromPath(selectedPath, config.label);
    return () => {
      document.title = workspaceTitle;
    };
  }, [selectedPath, config.label, workspaceTitle]);

  useEffect(() => {
    viewerBodyRef.current?.scrollTo({ top: 0 });
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

  const handleSelect = (path: string) => {
    setMobileNavOpen(false);
    void selectNote(path);
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
    sidebarFx === "collapse" ? styles.sidebarFxCollapse : "",
    sidebarFx === "expand" ? styles.sidebarFxExpand : "",
    sidebarBgEnabled ? styles.sidebarBgEnabled : "",
  ]
    .filter(Boolean)
    .join(" ");

  const backdropClassName = mobileNavOpen
    ? `${styles.backdrop} ${styles.backdropVisible}`
    : styles.backdrop;

  return (
    <div
      className={[
        styles.root,
        sidebarHidden ? styles.rootSidebarHidden : "",
        sidebarFx === "collapse" ? styles.rootFxCollapse : "",
        sidebarFx === "expand" ? styles.rootFxExpand : "",
        sidebarBgEnabled ? styles.rootBgEnabled : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          styles.sidebarRailFx,
          sidebarFx === "collapse" ? styles.sidebarRailFxCollapse : "",
          sidebarFx === "expand" ? styles.sidebarRailFxExpand : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden
      />
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
            <h2 className={styles.sidebarTitle}>{workspaceTitle}</h2>
            <button
              type="button"
              className={styles.mobileClose}
              aria-label="关闭"
              onClick={() => setMobileNavOpen(false)}
            >
              <SidebarEdgeChevron direction="left" />
            </button>
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
            {treeLoading ? <LoadingState label="加载文件树" /> : null}
            {!treeLoading && treeError ? <p className={styles.error}>{treeError}</p> : null}
            {!treeLoading && !treeError ? (
              <FileTree
                key={config.id}
                nodes={tree}
                selectedPath={selectedPath}
                onSelect={handleSelect}
              />
            ) : null}
          </div>
          <div hidden={sidebarMode !== "outline"}>
            {treeLoading ? (
              <LoadingState label="加载文件树" />
            ) : (
              <OutlineTree
                items={outlineItems}
                emptyLabel={outlineEmptyLabel}
                emptyAction={outlineEmptyAction}
                onNavigate={handleOutlineNavigate}
              />
            )}
          </div>
        </div>
        <button
          type="button"
          className={styles.sidebarCollapse}
          aria-label="隐藏目录"
          onClick={collapseSidebar}
        >
          <SidebarEdgeChevron direction="left" />
        </button>
        <div className={styles.sidebarFooter}>
          <div className={styles.ownerFooter}>
            <OwnerFooter login={config.owner} avatarUrl={config.ownerAvatarUrl} />
            <div className={styles.ownerFooterActions}>
              <SidebarBgToggle
                enabled={sidebarBgEnabled}
                disabled={bgTransitionBusy}
                onChange={setSidebarBgEnabled}
              />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </aside>
      <BgTransitionOverlay open={bgOverlayOpen} />
      <main className={styles.viewer}>
        <div className={styles.viewerGlass} aria-hidden />
        <div className={styles.viewerContent}>
          <div className={styles.mobileBar}>
            <h2 className={styles.mobileBarTitle}>{workspaceTitle}</h2>
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
              onClick={expandSidebar}
            >
              <SidebarEdgeChevron direction="right" />
            </button>
          ) : null}
          {selectedPath ? (
            <div className={styles.viewerMeta}>
              <p className={styles.viewerPath}>{selectedPath}</p>
            </div>
          ) : null}
          <div
            className={`${styles.viewerBody}${pending ? ` ${styles.viewerBodyPending}` : ""}`}
            ref={viewerBodyRef}
          >
            {treeLoading ? <LoadingState label="加载文件树" /> : null}
            {!treeLoading && !selectedPath ? (
              <EmptyState
                title="请选择一个 Markdown 文件"
                description="从左侧文件列表中选一篇笔记开始阅读"
                action={{ label: "浏览文件", onClick: handleBrowseFiles }}
              />
            ) : null}
            {!treeLoading && selectedPath && loading ? <LoadingState label="加载中" /> : null}
            {!treeLoading && selectedPath && error && !loading ? (
              <EmptyState
                variant="error"
                title="无法加载笔记"
                description={describeNoteLoadError(error)}
                action={{ label: "重试", onClick: () => void retry() }}
              />
            ) : null}
            {!treeLoading && selectedPath && content && !loading ? (
              <NoteEnter key={selectedPath}>
                <MarkdownViewer content={content} headingIds={outlineItems.map((item) => item.id)} />
              </NoteEnter>
            ) : null}
          </div>
          {pending ? (
            <div className={styles.pendingOverlay}>
              <LoadingState label="加载中" />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};
