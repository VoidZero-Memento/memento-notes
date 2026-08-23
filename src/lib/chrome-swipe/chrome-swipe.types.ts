export type ChromeSwipeOptions = {
  /** 手势是否可用（如仅手机+已开背景） */
  enabled: boolean;
  /** 临时阻断（抽屉打开等）；清屏后不阻断轻触换图 / 右滑恢复 */
  blocked?: boolean;
  /** 清屏后轻触背景换图 */
  onClearTap?: () => void;
};

export type ChromeSwipeApi = {
  surfaceRef: { current: HTMLDivElement | null };
  progress: number;
  dragging: boolean;
  cleared: boolean;
};
