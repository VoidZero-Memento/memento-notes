/** 入口标题：短词、记忆/备忘气质，适配现有字距与全息色 */
export const GATE_LINES = [
  "Memento",
  "记得",
  "此刻",
  "留下",
  "勿忘",
  "未完",
  "珍藏",
  "Remember",
] as const;

/** 停留展示时长（不含淡入淡出） */
export const GATE_LINE_INTERVAL_MS = 5200;

/** 与 CSS transition 对齐 */
export const GATE_LINE_FADE_MS = 680;

const CJK_RE = /[\u4e00-\u9fff]/;

export const isCjkGateLine = (line: string): boolean => CJK_RE.test(line);

export const pickNextGateLineIndex = (length: number, lastIndex: number): number => {
  if (length <= 0) return -1;
  if (length === 1) return 0;
  let idx = Math.floor(Math.random() * length);
  let guard = 0;
  while (idx === lastIndex && guard < 12) {
    idx = Math.floor(Math.random() * length);
    guard += 1;
  }
  return idx;
};
