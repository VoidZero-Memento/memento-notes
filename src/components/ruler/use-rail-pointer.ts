import { useEffect } from "react";

import { clamp01, easeOutExpo, rulerMap } from "@/lib/ruler/ruler-math";

import type { PointerEvent, RefObject, WheelEvent } from "react";
import type { RulerConfig, RulerGeom, RulerMode, RulerShared, ScrollAnimator } from "@/lib/ruler/ruler.types";
import type { RailRefs, RailState } from "./ruler-rail.types";

/** 位移超过该值视为拖拽，不触发 click 跳转 */
const DRAG_THRESHOLD_PX = 4;
/** wheel 的 deltaMode=1（行）时的换算 */
const LINE_HEIGHT_PX = 16;

type Args = {
  mode: RulerMode;
  cfg: RulerConfig;
  geom: RulerGeom;
  shared: RulerShared;
  animator: ScrollAnimator;
  scrollRef: RefObject<HTMLElement | null>;
  refs: RefObject<RailRefs>;
  st: RefObject<RailState>;
};

/** rail 的点击跳转 / 悬停缩放 / 拖拽 scrub（原站 g() 内联的事件处理） */
export const useRailPointer = ({ mode, cfg, geom, shared, animator, scrollRef, refs, st }: Args) => {
  const { motion, look, layout } = cfg;

  useEffect(() => {
    const state = st.current;
    return () => {
      window.clearTimeout(state.zoomTimer);
      shared.zoom.target = 0;
      shared.zoom.p = 0;
      shared.zoom.dragging = false;
    };
  }, [shared, st]);

  /** 指针 y（相对 rail 顶部）映射到 0~1 进度 */
  const progressAt = (clientY: number) => {
    const top = refs.current.rail?.getBoundingClientRect().top ?? 0;
    const map = rulerMap(geom.vh, layout.edgePad);
    const y = Math.max(map.base, Math.min(map.base + map.span, clientY - top));
    return { y, progress: clamp01((y - map.base) / map.span) };
  };

  const scheduleZoom = (intent: boolean) => {
    const state = st.current;
    window.clearTimeout(state.zoomTimer);
    state.zoomTimer = window.setTimeout(
      () => {
        state.zoomIntent = intent;
      },
      intent ? motion.zoomInDelay : motion.zoomOutDelay,
    );
  };

  const jumpTo = (clientY: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const target = progressAt(clientY).progress * Math.max(1, geom.docH - geom.vh);
    if (mode === "static") {
      animator.scrollTo(target, { immediate: true });
      return;
    }
    const distance = Math.abs(target - container.scrollTop);
    animator.scrollTo(target, {
      duration: motion.jumpDur * (0.4 + 0.6 * Math.min(1, distance / (2.5 * geom.vh))),
      easing: easeOutExpo,
    });
    // 点击后幽灵线先亮起再淡回常态，给“落点已确认”的反馈
    if (mode === "full") {
      refs.current.ghostLine?.animate([{ opacity: 1 }, { opacity: look.ghostAlpha }], { duration: 450, easing: "ease-out" });
    }
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!shared.zoom.dragging) return;
    shared.zoom.dragging = false;
    const state = st.current;
    const rect = refs.current.rail?.getBoundingClientRect();
    const inside =
      mode !== "lite" &&
      rect &&
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (inside) return;
    state.ghostActive = false;
    scheduleZoom(false);
  };

  return {
    onClick: (event: PointerEvent<HTMLDivElement>) => {
      if (st.current.dragMoved > DRAG_THRESHOLD_PX) return;
      jumpTo(event.clientY);
    },
    onPointerEnter: mode === "full" ? () => scheduleZoom(true) : undefined,
    onPointerLeave:
      mode === "full"
        ? () => {
            st.current.ghostActive = false;
            if (!shared.zoom.dragging) scheduleZoom(false);
          }
        : undefined,
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const state = st.current;
      const dragging = shared.zoom.dragging;
      if (mode === "static" && !dragging) return;
      const { y, progress } = progressAt(event.clientY);
      if (mode === "full" || dragging) {
        state.ghostActive = mode !== "static";
        state.ghostY = y;
        shared.pointerY = y;
      }
      if (!dragging) return;
      state.dragMoved = Math.max(state.dragMoved, Math.abs(event.clientY - state.dragStartY));
      const target = progress * Math.max(1, geom.docH - geom.vh);
      animator.scrollTo(target, mode === "static" ? { immediate: true } : { lerp: motion.dragLerp });
    },
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      const state = st.current;
      animator.stop();
      state.dragStartY = event.clientY;
      state.dragMoved = 0;
      shared.pointerY = progressAt(event.clientY).y;
      shared.zoom.dragging = true;
      if (mode === "lite") {
        window.clearTimeout(state.zoomTimer);
        state.zoomIntent = true;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    // rail 不在滚动容器内，滚轮落在它上面时要手动转发，否则会“滚不动”
    onWheel: (event: WheelEvent<HTMLDivElement>) => {
      const container = scrollRef.current;
      if (!container) return;
      animator.stop();
      container.scrollTop += event.deltaY * (event.deltaMode === 1 ? LINE_HEIGHT_PX : 1);
    },
  };
};
