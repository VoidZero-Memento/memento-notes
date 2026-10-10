import type { LetterMetrics } from "./ruler.types";

/** 标题字母用的字体栈；必须与 RulerLabels 渲染时的 font-family / weight 完全一致，否则字宽对不上 */
export const RULER_LABEL_FONT_FAMILY = '"LXGWWenKai", var(--font-geist-sans)';
export const RULER_LABEL_FONT_WEIGHT = 700;

const MEASURE_SIZE = 100;

/** 在隐藏 div 里逐字符量 100px 字号下的宽度（除以 100 得 em），同原站；调用方负责保证字体已就绪 */
export const measureLetters = (labels: string[]): Record<string, LetterMetrics> => {
  const probe = document.createElement("div");
  probe.style.cssText = [
    "position:absolute",
    "left:-9999px",
    "top:0",
    "visibility:hidden",
    "white-space:pre",
    `font-size:${MEASURE_SIZE}px`,
    "line-height:1",
    `font-family:${RULER_LABEL_FONT_FAMILY}`,
    `font-weight:${RULER_LABEL_FONT_WEIGHT}`,
  ].join(";");
  document.body.appendChild(probe);

  const result: Record<string, LetterMetrics> = {};
  for (const label of labels) {
    probe.textContent = "";
    const adv = Array.from(label)
      .map((char) => {
        const span = document.createElement("span");
        span.textContent = char;
        probe.appendChild(span);
        return span;
      })
      .map((span) => span.getBoundingClientRect().width / MEASURE_SIZE);

    const cum: number[] = [];
    let total = 0;
    for (const width of adv) {
      cum.push(total);
      total += width;
    }
    result[label] = { adv, cum, total };
  }

  probe.remove();
  return result;
};

/** 等字体（含 LXGWWenKai 的 unicode-range 分段）加载完再量，避免量到回退字体 */
export const measureLettersWhenReady = async (labels: string[]): Promise<Record<string, LetterMetrics>> => {
  if (document.fonts) {
    const font = `${RULER_LABEL_FONT_WEIGHT} ${MEASURE_SIZE}px "LXGWWenKai"`;
    try {
      await Promise.all([document.fonts.load(font, labels.join("")), document.fonts.ready]);
    } catch {
      // 字体加载失败时仍按回退字体量，比不显示强
    }
  }
  return measureLetters(labels);
};
