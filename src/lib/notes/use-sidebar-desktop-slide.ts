import { useCallback, useLayoutEffect, useRef, useState } from "react";

const DURATION_MS = 500;
const EASE = "cubic-bezier(0.25, 0.8, 0.25, 1)";
const FALLBACK_SHIFT = 316;

type Phase = "open" | "collapsing" | "closed" | "expanding";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const play = (el: HTMLElement, from: Keyframe, to: Keyframe) =>
  el.animate([from, to], { duration: DURATION_MS, easing: EASE, fill: "both" });

/** 桌面侧栏收缩/展开共用：先落到最终布局，再用 transform 过渡 */
export const useSidebarDesktopSlide = (enabled: boolean) => {
  const sidebarRef = useRef<HTMLElement>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const shiftRef = useRef(FALLBACK_SHIFT);
  const animsRef = useRef<Animation[]>([]);
  const genRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("open");

  const stopAnims = () => {
    animsRef.current.forEach((anim) => {
      try {
        anim.cancel();
      } catch {
        /* already finished */
      }
    });
    animsRef.current = [];
  };

  useLayoutEffect(() => {
    if (phase !== "collapsing" && phase !== "expanding") {
      stopAnims();
      return;
    }

    const sidebar = sidebarRef.current;
    const viewer = viewerRef.current;
    if (!sidebar || !viewer) {
      setPhase(phase === "collapsing" ? "closed" : "open");
      return;
    }

    let shift = shiftRef.current;
    if (phase === "expanding") {
      const next = Math.round(viewer.getBoundingClientRect().left - sidebar.getBoundingClientRect().left);
      shift = next > 0 ? next : FALLBACK_SHIFT;
    }
    shiftRef.current = shift;

    const gen = ++genRef.current;
    const anims =
      phase === "collapsing"
        ? [
            play(sidebar, { transform: "translate3d(0,0,0)" }, { transform: `translate3d(${-shift}px,0,0)` }),
            play(viewer, { transform: `translate3d(${shift}px,0,0)` }, { transform: "translate3d(0,0,0)" }),
          ]
        : [
            play(sidebar, { transform: `translate3d(${-shift}px,0,0)` }, { transform: "translate3d(0,0,0)" }),
            play(viewer, { transform: `translate3d(${-shift}px,0,0)` }, { transform: "translate3d(0,0,0)" }),
          ];
    animsRef.current = anims;

    void Promise.all(anims.map((anim) => anim.finished.catch(() => undefined))).then(() => {
      if (gen !== genRef.current) return;
      setPhase(phase === "collapsing" ? "closed" : "open");
    });

    return () => stopAnims();
  }, [phase]);

  const slideCollapse = useCallback(() => {
    if (phase !== "open") return;
    if (!enabled || prefersReducedMotion()) {
      setPhase("closed");
      return;
    }
    const sidebar = sidebarRef.current;
    const viewer = viewerRef.current;
    if (sidebar && viewer) {
      const next = Math.round(viewer.getBoundingClientRect().left - sidebar.getBoundingClientRect().left);
      shiftRef.current = next > 0 ? next : FALLBACK_SHIFT;
    }
    setPhase("collapsing");
  }, [enabled, phase]);

  const slideExpand = useCallback(() => {
    if (phase !== "closed") return;
    if (!enabled || prefersReducedMotion()) {
      setPhase("open");
      return;
    }
    setPhase("expanding");
  }, [enabled, phase]);

  const reveal = useCallback(() => {
    genRef.current += 1;
    stopAnims();
    setPhase("open");
  }, []);

  return {
    sidebarRef,
    viewerRef,
    hidden: phase === "closed",
    collapsing: phase === "collapsing",
    expanding: phase === "expanding",
    slideCollapse,
    slideExpand,
    reveal,
  };
};
