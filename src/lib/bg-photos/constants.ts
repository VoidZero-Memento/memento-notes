/** 与 NotesShell 手机断点一致 */
export const MOBILE_BG_MQ = "(max-width: 860px)";

export const OSS_PAGES_BASE = "https://voidzero-memento.github.io/memento-oss";

export const ossFolderJsonUrl = (folder: string): string =>
  `${OSS_PAGES_BASE}/${encodeURIComponent(folder)}.json`;

/** 手机背景轮播间隔 */
export const MOBILE_BG_INTERVAL_MS = 10_000;

/** PC 加载页 / 开启过渡蒙层；正文底改为图集循环，不再用这张 */
export const PC_PAGE_BG_URL =
  "https://memento-static.oss-cn-shenzhen.aliyuncs.com/notes-background2.png";

/** PC 图墙：单格倒牌（旧图 rotateX 倒下）时长 */
export const PC_WALL_FLIP_MS = 650;

/** PC 图墙：波浪里相邻格启动倒牌的间隔 */
export const PC_WALL_STAGGER_MS = 110;

/** PC 图墙：一轮波浪结束后到下一轮开始的停顿 */
export const PC_WALL_WAVE_GAP_MS = 10_000;

/** PC 图墙：一轮新图预载+解码的等待上限，超时则跳过这一轮 */
export const PC_WALL_PRELOAD_TIMEOUT_MS = 6_000;

/** 侧栏 / 手机菜单独立底图轮播间隔 */
export const SIDEBAR_BG_INTERVAL_MS = 5_000;

/** 双槽溶解时长 */
export const MOBILE_BG_FADE_MS = 1_400;

/** 开启背景时最少展示过渡蒙层时长 */
export const MOBILE_BG_TRANSITION_MIN_MS = 3_000;

/** 清单 + 首图等待上限 */
export const MOBILE_BG_PREPARE_TIMEOUT_MS = 10_000;

/** 清单失败时回退 */
export const MOBILE_BG_FALLBACK_URL =
  "https://memento-static.oss-cn-shenzhen.aliyuncs.com/notes-mobile-background1.png";
