import type { RulerShared } from "./ruler.types";

/** 每个标尺实例独立持有（原站是模块级单例）；rail 与 labels 通过它共享缩放/让位状态 */
export const createRulerShared = (): RulerShared => ({
  zoom: { target: 0, p: 0, dragging: false },
  pointerY: 0,
  railOccupancy: { spans: [] },
});
