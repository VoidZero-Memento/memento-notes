const DEFAULT_DOCUMENT_TITLE = "Memento Notes";
const LEADING_INDEX_PREFIX = /^\d+\.\s*/;

export const getNoteTitleFromPath = (path: string | null): string => {
  if (!path) return DEFAULT_DOCUMENT_TITLE;

  const fileName = path.split("/").pop() ?? path;
  const withoutExt = fileName.replace(/\.md$/i, "");
  const withoutIndex = withoutExt.replace(LEADING_INDEX_PREFIX, "");
  return withoutIndex || withoutExt || DEFAULT_DOCUMENT_TITLE;
};

export const DEFAULT_NOTE_TITLE = DEFAULT_DOCUMENT_TITLE;
