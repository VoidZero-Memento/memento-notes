import { useEffect, useState } from "react";

import { createRulerShared } from "@/lib/ruler/ruler-shared";
import { getRulerConfig, RULER_MIN_OVERFLOW, RULER_MIN_OVERFLOW_KEEP } from "@/lib/ruler/ruler.config";
import { createScrollAnimator } from "@/lib/ruler/scroll-animator";
import { useRulerGeom } from "@/lib/ruler/use-ruler-geom";
import { useRulerMode } from "@/lib/ruler/use-ruler-mode";
import { useRulerSections } from "@/lib/ruler/use-ruler-sections";

import { RulerLabels } from "./RulerLabels";
import { RulerRail } from "./RulerRail";

import type { RefObject } from "react";
import type { RulerMode, ScrollAnimator } from "@/lib/ruler/ruler.types";
import type { RulerLabelsProps } from "./ruler-labels.types";

type ScrollRulerProps = {
  scrollRef: RefObject<HTMLElement | null>;
  /** KeepAlive 是否处于激活态；false 时暂停 rAF 与几何观察 */
  active: boolean;
  enabled: boolean;
  /** 内容标识（如当前文件路径），变化时重算章节 */
  contentKey: string | null;
  onModeChange?: (mode: RulerMode | null) => void;
};

/** 标尺式滚动条：绑定一个滚动容器，rail 渲染在容器的父元素（.viewerBodyWrap）里 */
export const ScrollRuler = ({ scrollRef, active, enabled, contentKey, onModeChange }: ScrollRulerProps) => {
  const mode = useRulerMode();
  const config = getRulerConfig(mode);
  const geom = useRulerGeom(scrollRef, enabled && active, contentKey);
  const sections = useRulerSections(scrollRef, geom, contentKey);
  const [shared] = useState(createRulerShared);
  const [animator, setAnimator] = useState<ScrollAnimator | null>(null);
  const [open, setOpen] = useState(false);

  // 已开启时用更低的阈值：开启后 padding 变化会让高度抖动，避免临界内容反复开关
  const nextOpen = enabled && geom.docH - geom.vh >= (open ? RULER_MIN_OVERFLOW_KEEP : RULER_MIN_OVERFLOW);
  if (nextOpen !== open) setOpen(nextOpen);
  const { railW } = config.layout;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const created = createScrollAnimator(container);
    setAnimator(created);
    return () => {
      created.destroy();
      setAnimator(null);
    };
  }, [scrollRef]);

  // --ruler-rail 写在父元素（.viewerBodyWrap）上供 .viewerBody 的 padding 读取；
  // 回到顶部按钮是 wrap 的兄弟节点，只能读到再上一层，所以两层都写
  useEffect(() => {
    if (!nextOpen) return;
    const wrap = scrollRef.current?.parentElement;
    const scopes = [wrap, wrap?.parentElement];
    for (const scope of scopes) scope?.style.setProperty("--ruler-rail", `${railW}px`);
    onModeChange?.(mode);
    return () => {
      for (const scope of scopes) scope?.style.removeProperty("--ruler-rail");
      onModeChange?.(null);
    };
  }, [nextOpen, mode, railW, scrollRef, onModeChange]);

  if (!nextOpen || !animator) return null;

  const labelsProps: RulerLabelsProps = { mode, config, geom, sections, shared, animator, scrollRef, active };

  return (
    <>
      <RulerRail mode={mode} config={config} geom={geom} shared={shared} animator={animator} scrollRef={scrollRef} active={active} />
      <RulerLabels {...labelsProps} />
    </>
  );
};
