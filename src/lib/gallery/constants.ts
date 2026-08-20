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

/** 本会话已通过背景图门禁（与展台同钥，独立会话，互不带过） */
export const GALLERY_BG_GATE_SESSION_KEY = "memento-notes:gallery-bg-gate";
