/** 将标题文本转为可用于 DOM id 的稳定 slug */
export const slugifyHeading = (text: string): string => {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "heading";
};

/** 同一文档内生成唯一 heading id（重复 slug 追加 -1、-2…） */
export const createHeadingIdGenerator = () => {
  const counts = new Map<string, number>();

  return (text: string): string => {
    const base = slugifyHeading(text);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
};
