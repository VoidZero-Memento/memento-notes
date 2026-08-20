export const fitFrameSize = (
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number,
): { width: number; height: number } => {
  if (naturalW <= 0 || naturalH <= 0 || maxW <= 0 || maxH <= 0) {
    return { width: 0, height: 0 };
  }
  const scale = Math.min(maxW / naturalW, maxH / naturalH);
  return {
    width: Math.max(1, Math.floor(naturalW * scale)),
    height: Math.max(1, Math.floor(naturalH * scale)),
  };
};
