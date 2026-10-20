/** 当前章节判定线：视口上方 30% 处，与“正在读的章节”体感一致 */
export const CURRENT_LINE = 0.3;

/** 找最后一个 anchor<=line 的章节下标，未到第一个标题时返回 -1 */
export const findCurrentSection = (anchors: number[], line: number): number => {
  let found = -1;
  for (let i = 0; i < anchors.length; i++) {
    if (anchors[i] <= line) found = i;
  }
  return found;
};
