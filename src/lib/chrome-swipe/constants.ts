/** 避开 iOS 边缘返回 */
export const CHROME_SWIPE_EDGE_PX = 24;

/** 未达此位移前不锁定轴向 */
export const CHROME_SWIPE_LOCK_PX = 12;

/** 横向需明显大于纵向才锁定为清屏 */
export const CHROME_SWIPE_AXIS_RATIO = 1.2;

/** 松手后按进度结算的阈值 */
export const CHROME_SWIPE_SETTLE = 0.42;

/** 快速甩动阈值（px/ms） */
export const CHROME_SWIPE_VELOCITY = 0.45;

export const CHROME_SWIPE_MS = 420;

/** 清屏位移额外带出内边距和卡片阴影，避免露边 */
export const CHROME_SWIPE_EXIT_EXTRA_PX = 96;

/** 到顶/到底后的橡皮筋比例 */
export const CHROME_SWIPE_RUBBER = 0.16;

export const CHROME_SWIPE_TAP_PX = 10;

export const CHROME_SWIPE_HINT_KEY = "memento.chrome-swipe-hint";
