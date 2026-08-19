export type HeartSpot = {
  x: number;
  y: number;
  s: number;
  delay: number;
  tilt: number;
  dur: number;
};

/** 标准心形：x=16sin³t，y=13cos t − 5cos2t − 2cos3t − cos4t */
const heartRaw = (t: number) => ({
  x: 16 * Math.sin(t) ** 3,
  y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t),
});

const X_MAX = 16;
const Y_MAX = 13.2;
const Y_MIN = -17;
const CX = 0;
const CY = (Y_MAX + Y_MIN) / 2;
const SPAN = Math.max(X_MAX * 2, Y_MAX - Y_MIN);
const USABLE = 78;
const K = USABLE / SPAN;
const SAMPLE = 240;

/** 等比映射进 100×100，避免把心形拉扁 */
export const heartToPct = (t: number) => {
  const { x, y } = heartRaw(t);
  return {
    x: 50 + (x - CX) * K,
    y: 50 - (y - CY) * K,
  };
};

export const HEART_PATH = (() => {
  const n = 96;
  const pts: string[] = [];
  for (let i = 0; i <= n; i += 1) {
    const p = heartToPct((i / n) * Math.PI * 2);
    pts.push(`${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
})();

const sampleLoop = () => {
  const pts: { x: number; y: number }[] = [];
  const cum = [0];
  for (let i = 0; i < SAMPLE; i += 1) {
    pts.push(heartToPct((i / SAMPLE) * Math.PI * 2));
    if (i === 0) continue;
    const a = pts[i];
    const b = pts[i - 1];
    cum.push(cum[i - 1] + Math.hypot(a.x - b.x, a.y - b.y));
  }
  const first = pts[0];
  const last = pts[SAMPLE - 1];
  cum.push(cum[SAMPLE - 1] + Math.hypot(first.x - last.x, first.y - last.y));
  return { pts, cum, total: cum[SAMPLE] };
};

const makeSpots = (count: number): HeartSpot[] => {
  const { pts, cum, total } = sampleLoop();
  return Array.from({ length: count }, (_, i) => {
    const target = ((i + 0.5) / count) * total;
    let j = 1;
    while (j < cum.length && cum[j] < target) j += 1;
    const p = pts[(j - 1) % SAMPLE];
    return {
      x: p.x,
      y: p.y,
      s: 0.88 + (i % 4) * 0.05,
      delay: (i * 0.16) % 2.2,
      tilt: (i % 2 === 0 ? -1 : 1) * (3 + (i % 4)),
      dur: 7.4 + (i % 5) * 0.5,
    };
  });
};

export const DESKTOP_HEART_SPOTS = makeSpots(14);

/** 手机：贴屏幕上下缘，把中间让给主图 */
export const MOBILE_HEART_SPOTS: HeartSpot[] = [
  { x: 14, y: 15.5, s: 1, delay: 0.08, tilt: -7, dur: 7.6 },
  { x: 50, y: 11.5, s: 0.86, delay: 0.4, tilt: 3, dur: 8.1 },
  { x: 86, y: 15.5, s: 0.96, delay: 0.18, tilt: 6, dur: 7.9 },
  { x: 13, y: 84.5, s: 0.94, delay: 0.48, tilt: 5, dur: 8.3 },
  { x: 50, y: 88.5, s: 1.04, delay: 0.22, tilt: -4, dur: 7.5 },
  { x: 87, y: 84.5, s: 0.92, delay: 0.34, tilt: -6, dur: 8 },
];
