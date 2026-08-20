/** 循环播放时自动切图间隔 */
export const GALLERY_AUTO_INTERVAL_MS = 5_000;

/** 切图叠化时长 */
export const GALLERY_FADE_MS = 420;

/** 背景氛围层交叉淡化，略长于切图 */
export const GALLERY_BACKDROP_MS = 720;

/** 图片与相框之间的留白 */
export const GALLERY_MAT_GAP = 14;

/** 首次进入引导文字显示时长 */
export const GALLERY_HINT_MS = 2200;

/** 进入后辅助 UI 自动淡出 */
export const GALLERY_CHROME_IDLE_MS = 2600;

/** 切图后进度指示器再淡出 */
export const GALLERY_CHROME_PULSE_MS = 1700;

export const STAGE_PATH = "/stage";

export const GALLERY_PATH = "/gallery";

/** 本会话已通过展台门禁（值为 peppered digest，改密钥后自动失效） */
export const STAGE_GATE_SESSION_KEY = "memento-notes:stage-gate";

/** 本会话已通过画廊门禁（值为 peppered digest，改密钥后自动失效） */
export const GALLERY_GATE_SESSION_KEY = "memento-notes:gallery-gate";

/** 本会话已通过背景图门禁（独立会话，改密钥后自动失效） */
export const GALLERY_BG_GATE_SESSION_KEY = "memento-notes:gallery-bg-gate";

export const HALL_COLUMNS = 2;
export const HALL_DESKTOP_COLUMNS = 4;
export const HALL_DESKTOP_MQ = "(min-width: 861px)";
export const HALL_PAD = 14;
/** 桌面展柜留白由外框 padding 承担，与图片间距一致 */
export const HALL_DESKTOP_PAD = 0;
export const HALL_GAP = 16;
export const HALL_DESKTOP_GAP = 24;
export const HALL_DESKTOP_FRAME_PAD = HALL_DESKTOP_GAP;
export const HALL_RADIUS = 10;
export const HALL_MAX_WIDTH = 640;
export const HALL_DESKTOP_MAX_WIDTH = 1100;
export const HALL_OVERSCAN_SCREENS = 1.5;
export const HALL_BG_HOLD_MS = 6500;
export const HALL_BG_FADE_MS = 2000;
export const HALL_FLIP_MS = 380;
export const HALL_ENTER_MS = 280;
export const HALL_PROBE_CONCURRENCY = 8;
export const HALL_PROBE_CACHE_KEY = "memento-notes:hall-sizes-v1";
export const HALL_VIEWER_PAD_X = 22;
export const HALL_VIEWER_PAD_Y = 48;
export const HALL_VIEWER_DESKTOP_PAD_X = 0;
export const HALL_VIEWER_DESKTOP_PAD_Y = 0;
