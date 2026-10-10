import { clamp01, rulerMap } from "@/lib/ruler/ruler-math";

import type { RulerMap } from "@/lib/ruler/ruler.types";
import type { RailFrameCtx, RailTick } from "./ruler-rail.types";

type Frame = { scrollTop: number; progress: number; map: RulerMap; drift: number };

/** 指针、里程表、aria：每帧只在值变化时才写 DOM */
const updateNeedle = (ctx: RailFrameCtx, f: Frame) => {
  const { refs, st, cfg, geom } = ctx;
  const needleY = f.map.base + f.progress * f.map.span;
  if (refs.needle) {
    refs.needle.style.transform = `translate3d(0, ${needleY}px, 0)`;
    refs.needle.style.opacity = String(clamp01(f.progress / Math.max(1e-3, cfg.look.needleFadePct / 100)));
  }

  // 靠近底部时读数翻到指针上方，避免被容器裁掉
  const above = needleY > geom.vh - 26;
  if (refs.readout && above !== st.readoutAbove) {
    st.readoutAbove = above;
    refs.readout.style.top = above ? "-14px" : "4px";
  }

  const pct = Math.round(100 * f.progress);
  if (pct === st.prevPct) return;
  st.prevPct = pct;
  refs.rail?.setAttribute("aria-valuenow", String(pct));
  const text = String(pct).padStart(3, "0");
  for (let i = 0; i < 3; i++) {
    const digit = text.charCodeAt(i) - 48;
    if (digit === st.prevDigits[i]) continue;
    st.prevDigits[i] = digit;
    const col = refs.digits[i];
    if (col) col.style.transform = `translateY(${-digit}em)`;
  }
};

/** 阻尼推进缩放进度；返回本帧生效的 zoom.p（static 恒为 0） */
const updateZoom = (ctx: RailFrameCtx, dt: number): number => {
  if (ctx.mode === "static") return 0;
  const { zoom } = ctx.shared;
  zoom.target = ctx.st.zoomIntent || zoom.dragging ? 1 : 0;
  zoom.p += (zoom.target - zoom.p) * (1 - Math.exp(-ctx.cfg.motion.zoomLerp * dt));
  if (zoom.target === 0 && zoom.p < 5e-4) zoom.p = 0;
  if (zoom.target === 1 && zoom.p > 0.9995) zoom.p = 1;
  return zoom.p;
};

/** bracket（当前可视区段）与幽灵线（点击落点预览） */
const updateOverlays = (ctx: RailFrameCtx, f: Frame, zp: number) => {
  const { refs, st, geom, cfg } = ctx;
  if (refs.bracket) {
    refs.bracket.style.transform = `translate3d(0, ${f.map.base + (f.scrollTop / geom.docH) * f.map.span}px, 0)`;
    refs.bracket.style.height = `${(geom.vh / geom.docH) * f.map.span}px`;
    refs.bracket.style.opacity = String(zp);
  }
  if (!refs.ghost) return;
  if (st.ghostActive) {
    refs.ghost.style.transform = `translate3d(0, ${st.ghostY}px, 0)`;
    refs.ghost.style.opacity = String(cfg.look.ghostAlpha * (0.2 + 0.8 * zp));
  } else {
    refs.ghost.style.opacity = "0";
  }
};

/** 每条刻度在“文档 1:1 位置”与“整页压缩位置”之间插值，并叠加速度拉伸与数字让位 */
const updateTicks = (ctx: RailFrameCtx, f: Frame, zp: number) => {
  const { refs, st, ticks, geom, cfg, shared } = ctx;
  const { look, motion } = cfg;
  const stretch = motion.velMax > 0 && motion.velRadius > 0;
  const speedT = clamp01(Math.abs(st.vel) / 3000);
  const needleDoc = f.progress * geom.docH;
  const writeWraps = zp > 0 || st.zoomWrote;
  const spans = shared.railOccupancy.spans;

  for (let i = 0; i < ticks.length; i++) {
    const tick: RailTick = ticks[i];
    const docPos = tick.docY - f.scrollTop + f.drift;
    const mapPos = f.map.base + (tick.pct / 100) * f.map.span;

    if (writeWraps) {
      const wrap = refs.wraps[i];
      if (wrap) wrap.style.transform = zp > 0 ? `translate3d(0, ${zp * (mapPos - docPos)}px, 0)` : "";
    }

    const num = refs.nums[i];
    if (num) {
      let visible = 1;
      if (look.yieldPad > 0 && zp < 1) {
        const at = docPos + zp * (mapPos - docPos);
        for (const span of spans) {
          const gap = at < span.top ? span.top - at : at > span.bottom ? at - span.bottom : 0;
          if (gap < look.yieldPad) visible = Math.min(visible, 1 - span.k * (1 - gap / look.yieldPad));
        }
      }
      num.style.opacity = String(look.labelAlpha * (1 - (1 - visible) * (1 - zp)));
    }

    const mark = refs.marks[i];
    if (!mark || !stretch) continue;
    const dist = Math.abs(tick.docY - needleDoc);
    if (dist < motion.velRadius) {
      const falloff = 1 - dist / motion.velRadius;
      const boost = speedT * falloff * falloff;
      mark.style.transform = `scaleX(${1 + motion.velMax * boost})`;
      mark.style.opacity = String(Math.min(1, tick.alpha + 0.6 * boost));
    } else {
      mark.style.transform = "scaleX(1)";
      mark.style.opacity = String(tick.alpha);
    }
  }
  st.zoomWrote = zp > 0;
};

/** 标尺每帧更新（原站 g() 内 ticker 回调）：刻度层随滚动 1:1 平移，指针/里程表/缩放/速度拉伸 */
export const runRailFrame = (ctx: RailFrameCtx, dtMs: number) => {
  const { refs, st, geom, cfg, mode, container } = ctx;
  if (!geom.vh || !geom.docH) return;

  const dt = Math.min(dtMs / 1000, 0.1) || 0.016;
  const scrollTop = container.scrollTop;
  const progress = clamp01(scrollTop / Math.max(1, geom.docH - geom.vh));
  const speed = (scrollTop - st.lastY) / dt;
  st.lastY = scrollTop;
  st.vel += (speed - st.vel) * (1 - Math.exp(-6 * dt));

  const map = rulerMap(geom.vh, cfg.layout.edgePad);
  const frame: Frame = { scrollTop, progress, map, drift: map.drift(progress) };

  if (refs.layer) refs.layer.style.transform = `translate3d(0, ${-scrollTop + frame.drift}px, 0)`;
  updateNeedle(ctx, frame);
  const zp = updateZoom(ctx, dt);
  updateOverlays(ctx, frame, zp);
  if (mode !== "static" && st.introDone && ctx.ticks.length) updateTicks(ctx, frame, zp);
};
