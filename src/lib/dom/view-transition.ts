import { flushSync } from "react-dom";

/**
 * 用原生 View Transitions API 包裹一次同步状态更新；不支持的浏览器直接执行更新，不做动画。
 * 必须传入同步函数——异步数据要提前 await 好，再把"更新状态"这一步传进来，
 * 否则浏览器会在数据到达前就把 loading 态当成"新画面"截图，动画就白做了。
 */
export const runWithViewTransition = (update: () => void): void => {
  if (typeof document === "undefined" || typeof document.startViewTransition !== "function") {
    update();
    return;
  }

  document.startViewTransition(() => flushSync(update));
};
