import { useMemo, useRef } from "react";

import { useRafLoop } from "@/lib/ruler/use-raf-loop";
import { runRailFrame } from "./ruler-rail-frame";
import { useRailIntro } from "./use-rail-intro";
import { useRailPointer } from "./use-rail-pointer";

import styles from "./ScrollRuler.module.css";

import type { RefObject } from "react";
import type { RulerConfig, RulerGeom, RulerMode, RulerShared, ScrollAnimator } from "@/lib/ruler/ruler.types";
import type { RailRefs, RailState, RailTick } from "./ruler-rail.types";

type RulerRailProps = {
  mode: RulerMode;
  config: RulerConfig;
  geom: RulerGeom;
  shared: RulerShared;
  animator: ScrollAnimator;
  scrollRef: RefObject<HTMLElement | null>;
  active: boolean;
};

const DIGIT_COLUMNS = [0, 1, 2];
const DIGITS = "0123456789".split("");

const createRefs = (): RailRefs => ({
  rail: null,
  layer: null,
  bracket: null,
  needle: null,
  readout: null,
  ghost: null,
  ghostLine: null,
  digits: [],
  wraps: [],
  marks: [],
  nums: [],
});

const createState = (): RailState => ({
  vel: 0,
  lastY: 0,
  introDone: true,
  prevDigits: [-1, -1, -1],
  prevPct: -1,
  readoutAbove: false,
  zoomIntent: false,
  zoomTimer: 0,
  zoomWrote: false,
  ghostActive: false,
  ghostY: 0,
  dragStartY: 0,
  dragMoved: 0,
});

const buildTicks = (docH: number, config: RulerConfig): RailTick[] => {
  const { minorPct, labelPct } = config.layout;
  const { majorAlpha, minorAlpha } = config.look;
  const ticks: RailTick[] = [];
  for (let raw = 0; raw <= 100 + 1e-6; raw += minorPct) {
    const pct = Math.round(raw * 100) / 100;
    const major = Math.abs(pct % labelPct) < 1e-6;
    ticks.push({ pct, docY: (pct / 100) * docH, major, alpha: major ? majorAlpha : minorAlpha });
  }
  return ticks;
};

/** 刻度栏：刻度层随滚动 1:1 平移，悬停/按下后压缩成整页地图；所有逐帧写入见 ruler-rail-frame */
export const RulerRail = ({ mode, config, geom, shared, animator, scrollRef, active }: RulerRailProps) => {
  const refs = useRef<RailRefs>(createRefs());
  const st = useRef<RailState>(createState());
  const introPlayed = useRef(false);
  const { layout, look } = config;

  const ticks = useMemo(() => buildTicks(geom.docH, config), [geom.docH, config]);
  useRailIntro({ ticks, mode, cfg: config, refs, st, played: introPlayed });
  const handlers = useRailPointer({ mode, cfg: config, geom, shared, animator, scrollRef, refs, st });

  useRafLoop((_now, dtMs) => {
    const container = scrollRef.current;
    if (!container) return;
    runRailFrame({ refs: refs.current, st: st.current, ticks, geom, cfg: config, mode, shared, container }, dtMs);
  }, active);

  const railClass = mode === "lite" ? `${styles.rail} ${styles.railLite}` : styles.rail;

  return (
    <div
      ref={(el) => {
        refs.current.rail = el;
      }}
      className={railClass}
      style={{ width: layout.railW }}
      role="scrollbar"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      aria-label="文档位置"
      {...handlers}
    >
      <div
        ref={(el) => {
          refs.current.layer = el;
        }}
        aria-hidden
        className={styles.layer}
        style={{ height: geom.docH }}
      >
        {ticks.map((tick, i) => (
          <div
            key={tick.pct}
            ref={(el) => {
              refs.current.wraps[i] = el;
            }}
            className={styles.tickWrap}
            style={{ top: tick.docY }}
          >
            <span
              ref={(el) => {
                refs.current.marks[i] = el;
              }}
              className={styles.tick}
              style={{ width: tick.major ? look.majorLen : look.minorLen }}
            />
            {tick.major ? (
              <span
                ref={(el) => {
                  refs.current.nums[i] = el;
                }}
                className={styles.num}
                style={{ right: look.majorLen + 4, fontSize: layout.labelPx, opacity: look.labelAlpha }}
              >
                {tick.pct}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {mode !== "static" ? (
        <div
          ref={(el) => {
            refs.current.bracket = el;
          }}
          aria-hidden
          className={styles.bracket}
        >
          <span className={styles.bracketFill} style={{ opacity: look.bracketAlpha }} />
        </div>
      ) : null}
      <div
        ref={(el) => {
          refs.current.needle = el;
        }}
        aria-hidden
        className={styles.needle}
      >
        <span className={styles.needleLine} />
        <span
          ref={(el) => {
            refs.current.readout = el;
          }}
          className={styles.readout}
          style={{ fontSize: layout.labelPx }}
        >
          <span className={styles.digits}>
            {DIGIT_COLUMNS.map((col) => (
              <span
                key={col}
                ref={(el) => {
                  refs.current.digits[col] = el;
                }}
                className={styles.digitCol}
              >
                {DIGITS.map((digit) => (
                  <span key={digit}>{digit}</span>
                ))}
              </span>
            ))}
          </span>
          <span className={styles.percent}>%</span>
        </span>
      </div>
      {mode !== "static" ? (
        <div
          ref={(el) => {
            refs.current.ghost = el;
          }}
          aria-hidden
          className={styles.ghost}
        >
          <span
            ref={(el) => {
              refs.current.ghostLine = el;
            }}
            className={styles.ghostLine}
            style={{ height: look.ghostThick, top: -look.ghostThick / 2, opacity: look.ghostAlpha }}
          />
        </div>
      ) : null}
    </div>
  );
};
