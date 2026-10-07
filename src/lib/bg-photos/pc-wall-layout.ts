/** 每格目标宽高比：略宽于手机壁纸，格子不挤，cover 只裁上下少许 */
export const PC_WALL_DEFAULT_RATIO = 9 / 16;

/** 列数：视口宽 ÷ (视口高 × 目标宽高比)，四舍五入，PC 至少 2 列 */
export const calcWallCols = (width: number, height: number, ratio: number): number => {
  if (width <= 0 || height <= 0 || ratio <= 0) return 2;
  return Math.max(2, Math.round(width / (height * ratio)));
};

/** 随机取一个清单下标（仅用于起点） */
export const pickRandomWallStart = (length: number): number => (length <= 0 ? -1 : Math.floor(Math.random() * length));

/** 从 start 起按清单顺序连续取 count 个下标，到末尾回到第一张 */
const takeSequential = (length: number, start: number, count: number): number[] =>
  Array.from({ length: count }, (_, i) => (((start + i) % length) + length) % length);

/**
 * 首批 cols 格：第 0 格是起点（预载首图 firstIndex，缺省随机），
 * 其余格按清单顺序依次 +1，如起点 10 → 10、11、12、13；越过末尾回到第 0 张。
 */
export const pickWallBatch = (length: number, cols: number, firstIndex: number): number[] => {
  if (length <= 0) return Array.from({ length: cols }, () => 0);
  const start = firstIndex >= 0 ? firstIndex : pickRandomWallStart(length);
  return takeSequential(length, start, cols);
};

/**
 * 一整轮波浪的新图：接着当前最后一格往后排，如当前 10、11、12、13 → 14、15、16、17。
 * 图数不超过格数时整体前进会撞回当前图，退为只前进 1 位。
 */
export const pickWaveBatch = (length: number, shown: number[]): number[] => {
  if (length <= 1) return shown.map(() => 0);
  const first = shown[0] ?? 0;
  const step = length > shown.length ? shown.length : 1;
  return takeSequential(length, first + step, shown.length);
};

/** 新增格（列数变多）：接在当前最后一格后面，按顺序补 count 个 */
export const pickWallAppend = (length: number, shown: number[], count: number): number[] => {
  if (length <= 0) return Array.from({ length: count }, () => 0);
  const last = shown[shown.length - 1];
  const start = last === undefined || last < 0 ? pickRandomWallStart(length) : last + 1;
  return takeSequential(length, start, count);
};

/** 交界柔化：每格左边向左多铺的渐隐宽度，占格宽比例 */
const PC_WALL_FEATHER_RATIO = 0.22;

/** 交界柔化：渐隐宽度上限（px） */
const PC_WALL_FEATHER_MAX_PX = 96;

/** 渐隐宽度 f = min(格宽 × 0.22, 96px)；列数仍按等分宽，重叠区不计入列宽 */
export const calcWallFeather = (width: number, cols: number): number => {
  if (width <= 0 || cols < 1) return 0;
  return Math.round(Math.min((width / cols) * PC_WALL_FEATHER_RATIO, PC_WALL_FEATHER_MAX_PX) * 100) / 100;
};
