/** 加载页 → 正文背景交接：收到当前图 URL，渲染完成后调用 done */
export type SplashHandoffListener = (url: string, done: () => void) => void;
