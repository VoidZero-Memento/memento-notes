/** 切图叠化时长 */
export const GALLERY_FADE_MS = 720;

/** 背景氛围层交叉淡化，略长于切图 */
export const GALLERY_BACKDROP_MS = 1100;

export const GALLERY_CHROME_PAD = 18;

export const GALLERY_CHROME_PAD_MOBILE = 10;

export const GALLERY_COMPACT_MAX_WIDTH = 860;

export const GALLERY_PATH = "/gallery";

/** 本会话已通过画廊门禁（值为 peppered digest，改密钥后自动失效） */
export const GALLERY_GATE_SESSION_KEY = "memento-notes:gallery-gate";

/** 本会话已通过背景图门禁（与画廊同钥，独立会话，互不带过） */
export const GALLERY_BG_GATE_SESSION_KEY = "memento-notes:gallery-bg-gate";
