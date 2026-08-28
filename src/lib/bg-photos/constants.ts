/** 与 NotesShell 手机断点一致 */
export const MOBILE_BG_MQ = "(max-width: 860px)";

export const OSS_PAGES_BASE = "https://voidzero-memento.github.io/memento-oss";

export const ossFolderJsonUrl = (folder: string): string =>
  `${OSS_PAGES_BASE}/${encodeURIComponent(folder)}.json`;

/** 手机背景轮播间隔 */
export const MOBILE_BG_INTERVAL_MS = 10_000;

/** PC 正文底写死两张图 */
export const PC_BG_URLS = [
  "https://my-aesthetic-gallery.oss-cn-shenzhen.aliyuncs.com/fav/009.jpg",
  "https://my-aesthetic-gallery.oss-cn-shenzhen.aliyuncs.com/fav/001.png",
] as const;

/** PC 正文底轮播间隔 */
export const PC_BG_INTERVAL_MS = 60_000;

/** 双槽溶解时长 */
export const MOBILE_BG_FADE_MS = 1_400;

/** 开启背景时最少展示过渡蒙层时长 */
export const MOBILE_BG_TRANSITION_MIN_MS = 3_000;

/** 清单 + 首图等待上限 */
export const MOBILE_BG_PREPARE_TIMEOUT_MS = 10_000;

/** 手机 CSS 默认底图（清单失败时回退） */
export const MOBILE_BG_FALLBACK_URL =
  "https://my-ledger.oss-cn-shenzhen.aliyuncs.com/banner8.png";
