import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { GALLERY_BACKDROP_MS, GALLERY_CHROME_PAD, GALLERY_CHROME_PAD_MOBILE, GALLERY_COMPACT_MAX_WIDTH, GALLERY_FADE_MS } from "@/lib/gallery/constants";
import { fitFrameSize } from "@/lib/gallery/fit-frame";
import { useGalleryStage } from "@/lib/gallery/use-gallery-stage";
import { EmptyState } from "@/components/common/EmptyState";
import { GalleryChrome } from "@/components/gallery/GalleryChrome";
import { LoadingState } from "@/components/notes/LoadingState";

import fx from "./GalleryFx.module.css";
import styles from "./GalleryStage.module.css";

import type { CSSProperties, MouseEvent, PointerEvent, SyntheticEvent, TransitionEvent } from "react";
import type { GalleryLocationState, GallerySlotMotion } from "@/lib/gallery/gallery.types";

const padIndex = (value: number) => String(value).padStart(3, "0");

const slotClass = (motion: GallerySlotMotion) => {
  if (motion === "enter") return `${styles.slot} ${styles.slotEnter}`;
  if (motion === "show") return `${styles.slot} ${styles.slotShow}`;
  return `${styles.slot} ${styles.slotLeave}`;
};

const preventMenu = (event: SyntheticEvent) => {
  event.preventDefault();
};

export const GalleryStage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const wellRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState(false);
  const [maxBox, setMaxBox] = useState({ width: 0, height: 0 });
  const {
    status,
    error,
    slotA,
    slotB,
    backdropA,
    backdropB,
    backdropShowB,
    index,
    total,
    naturalSize,
    busy,
    hasShuffled,
    shuffle,
    settleLeaving,
    retry,
  } = useGalleryStage();

  const compact =
    typeof window !== "undefined" && window.innerWidth <= GALLERY_COMPACT_MAX_WIDTH;
  const chromePad = compact ? GALLERY_CHROME_PAD_MOBILE : GALLERY_CHROME_PAD;

  const handleBack = useCallback(() => {
    const from = (location.state as GalleryLocationState | null)?.from;
    if (from && from !== location.pathname) {
      navigate(from);
      return;
    }
    navigate("/", { replace: true });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleBack();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack]);

  useEffect(() => {
    const el = wellRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const pad =
        window.innerWidth <= GALLERY_COMPACT_MAX_WIDTH
          ? GALLERY_CHROME_PAD_MOBILE
          : GALLERY_CHROME_PAD;
      setMaxBox({
        width: Math.max(0, rect.width - pad * 2),
        height: Math.max(0, rect.height - pad * 2),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [status]);

  const frame = useMemo(
    () => fitFrameSize(naturalSize.width, naturalSize.height, maxBox.width, maxBox.height),
    [maxBox.height, maxBox.width, naturalSize.height, naturalSize.width],
  );

  const fadeVars = {
    "--gallery-fade-ms": `${GALLERY_FADE_MS}ms`,
    "--gallery-backdrop-ms": `${GALLERY_BACKDROP_MS}ms`,
    "--gallery-chrome-pad": `${chromePad}px`,
    "--frame-w": `${frame.width}px`,
    "--frame-h": `${frame.height}px`,
  } as CSSProperties;
  const counter = `${padIndex(index + 1)} / ${padIndex(total)}`;

  const handleShuffle = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    shuffle();
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || busy) return;
    setPressed(true);
  };

  const releasePress = () => setPressed(false);

  const handleSlotTransitionEnd = (event: TransitionEvent<HTMLImageElement>) => {
    if (event.propertyName !== "opacity") return;
    if (!event.currentTarget.classList.contains(styles.slotLeave)) return;
    settleLeaving();
  };

  return (
    <div className={styles.root} style={fadeVars} onContextMenu={preventMenu}>
      {backdropA ? (
        <div
          className={`${styles.backdrop}${backdropShowB ? "" : ` ${styles.backdropShow}`}`}
          style={{ backgroundImage: `url("${backdropA}")` }}
          aria-hidden
        />
      ) : null}
      {backdropB ? (
        <div
          className={`${styles.backdrop}${backdropShowB ? ` ${styles.backdropShow}` : ""}`}
          style={{ backgroundImage: `url("${backdropB}")` }}
          aria-hidden
        />
      ) : null}
      <div className={fx.aurora} aria-hidden />
      <div className={fx.stars} aria-hidden />
      <div className={fx.vignette} aria-hidden />

      <div className={styles.content}>
        {status === "loading" ? <LoadingState label="加载画廊" /> : null}

        {status === "error" ? (
          <EmptyState
            variant="error"
            title="无法打开画廊"
            description={error ?? "图片清单加载失败"}
            actions={[
              { label: "重试", onClick: retry },
              { label: "返回笔记", onClick: handleBack, variant: "secondary" },
            ]}
          />
        ) : null}

        {status === "ready" ? (
          <button
            type="button"
            className={`${styles.stage}${busy ? ` ${styles.stageBusy}` : ""}`}
            aria-label="随机切换图片"
            onClick={handleShuffle}
            onPointerDown={handlePointerDown}
            onPointerUp={releasePress}
            onPointerCancel={releasePress}
            onPointerLeave={releasePress}
            onContextMenu={preventMenu}
            onDragStart={preventMenu}
          >
            <span className={fx.floorGlow} aria-hidden />
            <div className={`${styles.board}${pressed ? ` ${styles.boardPressed}` : ""}`} ref={wellRef}>
              {frame.width > 0 ? (
                <div className={styles.vessel}>
                  <GalleryChrome busy={busy} />
                  <div className={styles.frame}>
                    {slotA.url ? (
                      <img
                        className={slotClass(slotA.motion)}
                        src={slotA.url}
                        alt=""
                        decoding="async"
                        draggable={false}
                        onTransitionEnd={handleSlotTransitionEnd}
                      />
                    ) : null}
                    {slotB.url ? (
                      <img
                        className={slotClass(slotB.motion)}
                        src={slotB.url}
                        alt=""
                        decoding="async"
                        draggable={false}
                        onTransitionEnd={handleSlotTransitionEnd}
                      />
                    ) : null}
                    <span className={styles.hit} aria-hidden />
                  </div>
                </div>
              ) : null}
            </div>
          </button>
        ) : null}
      </div>

      <div className={styles.hud}>
        <button
          type="button"
          className={styles.back}
          aria-label="返回笔记"
          onClick={handleBack}
        >
          <svg className={styles.backIcon} viewBox="0 0 16 16" aria-hidden>
            <path
              d="M10.5 3.5 5.5 8l5 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {status === "ready" ? (
          <span className={styles.counter}>{counter}</span>
        ) : (
          <span />
        )}
        {status === "ready" ? (
          <p
            className={`${styles.hint}${hasShuffled ? ` ${styles.hintGone}` : ""}`}
          >
            点击画面切换
          </p>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
};
