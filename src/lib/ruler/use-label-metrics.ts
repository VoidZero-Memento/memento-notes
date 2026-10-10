import { useEffect, useState } from "react";

import { measureLettersWhenReady } from "./measure-letters";

import type { LetterMetrics } from "./ruler.types";

/**
 * 测量展示标题的逐字宽度。以序列化后的标题为依赖：sections 因锚点变化重建时标题没变就不重量，
 * 避免字母飞行因 metrics 引用变化而闪一下。
 */
export const useLabelMetrics = (labels: string[], enabled: boolean): Record<string, LetterMetrics> | null => {
  const [metrics, setMetrics] = useState<Record<string, LetterMetrics> | null>(null);
  const key = JSON.stringify(labels);

  useEffect(() => {
    const list = JSON.parse(key) as string[];
    if (!enabled || !list.length) return;
    let cancelled = false;
    void measureLettersWhenReady(list).then((result) => {
      if (!cancelled) setMetrics(result);
    });
    return () => {
      cancelled = true;
    };
  }, [key, enabled]);

  return metrics;
};
