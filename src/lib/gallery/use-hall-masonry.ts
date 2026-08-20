import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { HALL_OVERSCAN_SCREENS } from "@/lib/gallery/constants";
import { layoutMasonry } from "@/lib/gallery/layout-masonry";

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

export const useHallMasonry = (photos: HallPhoto[]) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);
  const viewHRef = useRef(0);
  const frameRef = useRef(0);
  const [width, setWidth] = useState(0);
  const [viewH, setViewH] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const layout = useMemo(() => layoutMasonry(photos, width), [photos, width]);

  const visible = useMemo(
    () => pickVisible(layout.boxes, scrollTop, viewH),
    [layout.boxes, scrollTop, viewH],
  );

  const flushScroll = useCallback(() => {
    frameRef.current = 0;
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

  return { height: layout.height, onScroll, scrollerRef, visible: visible.boxes };
};
