export type AppBgContextValue = {
  ready: boolean;
  immersive: boolean;
  /** clientX 仅 PC 图墙使用：换被点中的那一格；缺省则轮流换一格 */
  advance: (clientX?: number) => void;
  setImmersive: (next: boolean) => void;
};
