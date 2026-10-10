import { Fragment, useEffect, useMemo, useRef } from "react";

import { RULER_LABEL_FONT_FAMILY, RULER_LABEL_FONT_WEIGHT } from "@/lib/ruler/measure-letters";
import { easeOutExpo } from "@/lib/ruler/ruler-math";
import { useLabelMetrics } from "@/lib/ruler/use-label-metrics";
import { useRafLoop } from "@/lib/ruler/use-raf-loop";
import { createLabelState, runLabelsFrame } from "./ruler-labels-frame";
import { RulerLabelsLite } from "./ruler-labels-lite";

import styles from "./RulerLabels.module.css";

import type { MouseEvent } from "react";
import type { LabelRefs, RulerLabelsProps } from "./ruler-labels.types";

/** 点击跳转时让标题离视口顶部留一点空隙，不至于贴边 */
const JUMP_TOP_GAP = 8;
/** 点击后 accent 闪色持续（毫秒） */
const FLASH_MS = 350;

/** full 模式：顶部堆叠 / 底部队列 / 字母飞行 / snap / 命中区 */
const RulerLabelsFull = ({ config, geom, sections, shared, animator, scrollRef, active }: RulerLabelsProps) => {
  const count = sections.length;
  const labels = useMemo(() => sections.map((section) => section.label.toUpperCase()), [sections]);
  const metrics = useLabelMetrics(labels, true);
  const refs = useRef<LabelRefs[]>([]);
  const st = useMemo(() => createLabelState(count), [count]);
  const { layout, motion } = config;

  useRafLoop((_now, dtMs) => {
    const container = scrollRef.current;
    if (!container || !metrics || !count) return;
    const ctx = { cfg: config, geom, sections, labels, metrics, shared, animator, container, refs: refs.current, st };
    runLabelsFrame(ctx, dtMs);
  }, active);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // wheel/touchmove 挂在 wrap 上：rail 的滚轮转发发生在 container 之外，挂 container 会漏掉
    const wrap = container.parentElement ?? container;
    // 用户任何输入都会打断 animator 的动画且不触发 onComplete，必须在此复位门闸，否则 snap/跳转会被永久锁死
    const release = () => {
      st.armed = true;
      st.jumping = false;
      st.snapping = false;
    };
    wrap.addEventListener("wheel", release, { passive: true });
    wrap.addEventListener("touchmove", release, { passive: true });
    container.addEventListener("pointerdown", release, { passive: true });
    window.addEventListener("keydown", release);
    return () => {
      wrap.removeEventListener("wheel", release);
      wrap.removeEventListener("touchmove", release);
      container.removeEventListener("pointerdown", release);
      window.removeEventListener("keydown", release);
    };
  }, [scrollRef, st]);

  // 卸载时清掉让位区间，否则 rail 上的百分比数字会一直被旧区间压暗
  useEffect(
    () => () => {
      shared.railOccupancy.spans.length = 0;
    },
    [shared],
  );

  if (!count || !metrics) return null;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    st.flashUntil[index] = performance.now() + FLASH_MS;
    st.armed = false;
    st.jumping = true;
    animator.scrollTo(Math.max(0, sections[index].anchor - JUMP_TOP_GAP), {
      duration: motion.jumpDur,
      easing: easeOutExpo,
      onComplete: () => {
        st.jumping = false;
      },
    });
  };

  return (
    <>
      <div className={styles.layer} style={{ fontFamily: RULER_LABEL_FONT_FAMILY, fontWeight: RULER_LABEL_FONT_WEIGHT }}>
        {sections.map((section, i) => {
          const entry = (refs.current[i] ??= { letters: [], hit: null });
          return (
            <Fragment key={`${section.id}-${i}`}>
              <a
                ref={(el) => {
                  entry.hit = el;
                }}
                href={`#${section.id}`}
                className={styles.hit}
                aria-label={`跳转到 ${section.label}`}
                onClick={(event) => handleClick(event, i)}
                onPointerEnter={() => {
                  st.hover = i;
                }}
                onPointerLeave={() => {
                  if (st.hover === i) st.hover = -1;
                }}
              />
              {Array.from(labels[i]).map((char, j) => (
                <span
                  key={j}
                  ref={(el) => {
                    entry.letters[j] = el;
                  }}
                  aria-hidden
                  className={styles.letter}
                  style={{ fontSize: layout.headingPx }}
                >
                  {char}
                </span>
              ))}
            </Fragment>
          );
        })}
      </div>
    </>
  );
};

/** 章节标题入口：full=字母飞行；lite=按住 rail 时的压缩地图；static=不渲染 */
export const RulerLabels = (props: RulerLabelsProps) => {
  if (props.mode === "full") return <RulerLabelsFull {...props} />;
  if (props.mode === "lite") return <RulerLabelsLite {...props} />;
  return null;
};
