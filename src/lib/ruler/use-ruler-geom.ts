import { useEffect, useState } from "react";

import type { RefObject } from "react";
import type { RulerGeom } from "./ruler.types";

const ZERO_GEOM: RulerGeom = { docH: 0, vh: 0, vw: 0 };

/** 只观察到“正文根”这一层（容器 > 包裹 > 正文根）：块级元素的增高必然撑高它，不必观察成百上千个节点 */
const collectObserved = (container: HTMLElement): Set<Element> => {
  const targets = new Set<Element>([container]);
  for (const child of container.children) {
    targets.add(child);
    // 仅当包裹层只有一个子节点时才继续下探，避免把正文里的每个块都纳入观察
    if (child.children.length === 1) targets.add(child.children[0]);
  }
  return targets;
};

/**
 * 容器几何：docH=scrollHeight、vh=clientHeight、vw=clientWidth。
 * enabled=false（如 KeepAlive 未激活）时保留上次结果，不重置为 0，避免隐藏期间 display:none 的零尺寸污染
 */
export const useRulerGeom = (
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  contentKey: string | null,
): RulerGeom => {
  const [geom, setGeom] = useState<RulerGeom>(ZERO_GEOM);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    let raf = 0;
    const observed = new Set<Element>();

    const measure = () => {
      raf = 0;
      const next = { docH: container.scrollHeight, vh: container.clientHeight, vw: container.clientWidth };
      setGeom((prev) => (prev.docH === next.docH && prev.vh === next.vh && prev.vw === next.vw ? prev : next));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    const ro = new ResizeObserver(schedule);
    const syncObserved = () => {
      const next = collectObserved(container);
      for (const el of observed) {
        if (next.has(el)) continue;
        ro.unobserve(el);
        observed.delete(el);
      }
      for (const el of next) {
        if (observed.has(el)) continue;
        ro.observe(el);
        observed.add(el);
      }
    };

    // 正文是异步渲染的（markdown / mermaid），子树变化后要重新挂观察并重测
    const mo = new MutationObserver(() => {
      syncObserved();
      schedule();
    });

    syncObserved();
    measure();
    mo.observe(container, { childList: true, subtree: true });
    // load 不冒泡，用捕获阶段接住图片/iframe 加载完成造成的高度变化
    container.addEventListener("load", schedule, true);
    window.addEventListener("resize", schedule);
    void document.fonts?.ready.then(schedule).catch(() => {});

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      container.removeEventListener("load", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [containerRef, enabled, contentKey]);

  return geom;
};
