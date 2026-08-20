import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { HALL_COLUMNS, HALL_DESKTOP_COLUMNS, HALL_DESKTOP_GAP, HALL_DESKTOP_MAX_WIDTH, HALL_DESKTOP_PAD, HALL_GAP, HALL_MAX_WIDTH, HALL_OVERSCAN_SCREENS } from "@/lib/gallery/constants";
import { layoutMasonry } from "@/lib/gallery/layout-masonry";
import { useHallDesktop } from "@/lib/gallery/use-hall-desktop";

import type { HallBox, HallPhoto } from "@/lib/gallery/hall.types";

type VisibleWindow = {
  boxes: HallBox[];
  from: number;
  to: number;
};

const emptyWindow: VisibleWindow = { boxes: [], from: 0, to: 0 };

const pickVisible = (boxes: HallBox[], scrollTop: number, viewH: number): VisibleWindow => {
  if (boxes.length === 0 || viewH <= 0) return emptyWindow;
  const pad = viewH * HALL_OVERSCAN_SCREENS;
  const start = scrollTop - pad;
  const end = scrollTop + viewH + pad;
  let from = -1;
  let to = -1;
  const visible: HallBox[] = [];
  for (let i = 0; i < boxes.length; i += 1) {
    const box = boxes[i];
    if (!box) continue;
    if (box.y + box.height < start || box.y > end) continue;
    if (from < 0) from = i;
    to = i;
    visible.push(box);
  }
  return { boxes: visible, from: Math.max(0, from), to: Math.max(0, to) };
};

export const useHallMasonry = (photos: HallPhoto[], paused = false) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);
  const viewHRef = useRef(0);
  const frameRef = useRef(0);
  const pausedRef = useRef(paused);
  const desktop = useHallDesktop();
  const [width, setWidth] = useState(0);
  const [viewH, setViewH] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  pausedRef.current = paused;

  const layout = useMemo(
    () =>
      layoutMasonry(photos, width, {
        columns: desktop ? HALL_DESKTOP_COLUMNS : HALL_COLUMNS,
        gap: desktop ? HALL_DESKTOP_GAP : HALL_GAP,
        maxWidth: desktop ? HALL_DESKTOP_MAX_WIDTH : HALL_MAX_WIDTH,
        pad: HALL_DESKTOP_PAD,
      }),
    [desktop, photos, width],
  );

  const visible = useMemo(
    () => pickVisible(layout.boxes, scrollTop, viewH),
    [layout.boxes, scrollTop, viewH],
  );

  const flushScroll = useCallback(() => {
    frameRef.current = 0;
    if (pausedRef.current) return;
    const node = scrollerRef.current;
    if (!node) return;
    const nextTop = node.scrollTop;
    const nextH = node.clientHeight;
    scrollTopRef.current = nextTop;
    viewHRef.current = nextH;
    setScrollTop((prev) => (Math.abs(prev - nextTop) < 1 ? prev : nextTop));
    setViewH((prev) => (Math.abs(prev - nextH) < 1 ? prev : nextH));
  }, []);

  const onScroll = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(flushScroll);
  }, [flushScroll]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    const measure = () => {
      if (pausedRef.current) return;
      setWidth(node.clientWidth);
      setViewH(node.clientHeight);
      scrollTopRef.current = node.scrollTop;
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const node = scrollerRef.current;
    if (!node) return;
    setWidth(node.clientWidth);
    setViewH(node.clientHeight);
    scrollTopRef.current = node.scrollTop;
  }, [paused]);

  return { height: layout.height, onScroll, scrollerRef, visible: visible.boxes };
};
