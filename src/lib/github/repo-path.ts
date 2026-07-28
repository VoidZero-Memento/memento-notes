export const isMarkdownPath = (path: string): boolean => path.toLowerCase().endsWith(".md");

/** 点开头路径段、README.md、.xmind 等非笔记文件，不作为笔记树展示。 */
export const isExcludedFromNoteTree = (path: string): boolean => {
  const segments = path.split("/");
  if (segments.some((segment) => segment.startsWith("."))) {
    return true;
  }
  const name = (segments[segments.length - 1] ?? "").toLowerCase();
  return name === "readme.md" || name.endsWith(".xmind");
};

export const encodeNotePathForUrl = (path: string): string =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
