const DEFAULT_DOCUMENT_TITLE = "Memento · 笔记";
const LEADING_INDEX_PREFIX = /^\d+\.\s*/;

export const getRepoWorkspaceTitle = (repoLabel: string): string => `${repoLabel}笔记仓库`;

export const getNoteTitleFromPath = (path: string | null, repoLabel?: string): string => {
  const fallback = repoLabel ? getRepoWorkspaceTitle(repoLabel) : DEFAULT_DOCUMENT_TITLE;
  if (!path) return fallback;

  const fileName = path.split("/").pop() ?? path;
  const withoutExt = fileName.replace(/\.md$/i, "");
  const withoutIndex = withoutExt.replace(LEADING_INDEX_PREFIX, "");
  return withoutIndex || withoutExt || fallback;
};

export const DEFAULT_NOTE_TITLE = DEFAULT_DOCUMENT_TITLE;
