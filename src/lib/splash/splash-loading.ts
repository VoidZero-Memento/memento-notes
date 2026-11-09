const BAND_WIDTH = 5;
const INSET = BAND_WIDTH / 2;
const SHEEN_LEN = 90;
const SHEEN_PERIOD = 2400;
const GRADIENT_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, "#a8d8ff"],
  [0.3, "#d4b8ff"],
  [0.6, "#ff9ec4"],
  [0.85, "#ffc2e0"],
  [1, "#ffe58a"],
];

export const SPLASH_TICK_MS = 48;
export const SPLASH_LOAD_CAP = 90;
export const SPLASH_BANNER_COUNT = 15;
export const SPLASH_BANNER_INTERVAL_MS = 2000;
export const SPLASH_BANNER_RETRY_MS = 300;
export const SPLASH_BANNER_REVEAL_FALLBACK_MS = 1000;
/** 资源就绪后，贴边进度补到顶点的时长。这段蒙层保持不透明。 */
export const SPLASH_EDGE_FINISH_MS = 1000;
/** 进度画到顶点后再停一拍，避免刚到顶就退场 */
export const SPLASH_EDGE_TOP_HOLD_MS = 220;

export const splashEdgeSettleMs = () => SPLASH_EDGE_FINISH_MS + SPLASH_EDGE_TOP_HOLD_MS;

export const splashBannerSrc = (index: number) => {
  const n = index + 1;
  return `https://memento-static.oss-cn-shenzhen.aliyuncs.com/lite/loading/${n < 10 ? "0" : ""}${n}.jpg`;
};

/** 与 index.html 开屏相同：先快后慢，逼近 90% 后不再提前走满 */
export const splashSimulatedProgress = (elapsedMs: number) => {
  const t = elapsedMs / 1000;
  if (t < 0.45) return (t / 0.45) * 18;
  if (t < 1.1) return 18 + ((t - 0.45) / 0.65) * 24;
  if (t < 1.85) return 42 + ((t - 1.1) / 0.75) * 22;
  if (t < 2.6) return 64 + ((t - 1.85) / 0.75) * 14;
  return 78 + (1 - Math.exp(-(t - 2.6) * 0.55)) * (SPLASH_LOAD_CAP - 78);
};

const buildHalfPath = (ctx: CanvasRenderingContext2D, w: number, h: number, side: number) => {
  const cx = w / 2;
  const sideX = side < 0 ? INSET : w - INSET;
  ctx.beginPath();
  ctx.moveTo(cx, h - INSET);
  ctx.lineTo(sideX, h - INSET);
  ctx.lineTo(sideX, INSET);
  ctx.lineTo(cx, INSET);
};

const halfLength = (w: number, h: number) => w + h - 4 * INSET;

const strokeHalf = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  side: number,
  style: string | CanvasGradient,
  width: number,
  dash: number[],
  offset: number,
) => {
  buildHalfPath(ctx, w, h, side);
  ctx.strokeStyle = style;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.lineDashOffset = offset;
  ctx.stroke();
};

/** 贴边进度：左右两半从底边中点爬到顶边中点，带流光 */
export const drawSplashEdge = (ctx: CanvasRenderingContext2D, w: number, h: number, ratio: number, time: number) => {
  const total = halfLength(w, h);
  const filled = total * Math.min(1, Math.max(0, ratio));
  const gradient = ctx.createLinearGradient(0, h, 0, 0);
  GRADIENT_STOPS.forEach((stop) => {
    gradient.addColorStop(stop[0], stop[1]);
  });
  const pulse = 0.5 + 0.5 * Math.sin(time / 380);
  const phase = (time % SHEEN_PERIOD) / SHEEN_PERIOD;
  const sheenStart = phase * (filled + SHEEN_LEN) - SHEEN_LEN;
  const sheenFrom = Math.max(0, sheenStart);
  const sheenTo = Math.min(filled, sheenStart + SHEEN_LEN);
  const sheenAlpha = Math.sin(phase * Math.PI) * 0.8;

  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  [-1, 1].forEach((side) => {
    strokeHalf(ctx, w, h, side, "rgba(255,255,255,0.16)", BAND_WIDTH, [], 0);
    if (filled <= 0) return;
    const dash = [filled, total * 2];
    ctx.globalAlpha = 0.22 + 0.16 * pulse;
    strokeHalf(ctx, w, h, side, gradient, BAND_WIDTH * 3.2, dash, 0);
    ctx.globalAlpha = 1;
    strokeHalf(ctx, w, h, side, gradient, BAND_WIDTH, dash, 0);
    if (sheenTo > sheenFrom) {
      ctx.globalAlpha = sheenAlpha;
      strokeHalf(ctx, w, h, side, "#ffffff", BAND_WIDTH * 0.7, [sheenTo - sheenFrom, total * 2], -sheenFrom);
      ctx.globalAlpha = 1;
    }
  });
  ctx.setLineDash([]);
};
