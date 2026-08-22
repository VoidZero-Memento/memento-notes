const SCROLL_X = new Set(["auto", "scroll", "overlay"]);

const INTERACTIVE_SELECTOR =
  "a,button,input,textarea,select,label,summary,[role='button'],[role='tab'],[role='menuitem']";

const fromHorizScroller = (start: Element, root: HTMLElement): boolean => {
  let node: Element | null = start;
  while (node && node !== root) {
    if (node instanceof HTMLElement) {
      if (node.scrollWidth > node.clientWidth + 1 && SCROLL_X.has(getComputedStyle(node).overflowX)) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
};

/** 按钮/链接或可横滚容器上的触摸让位，避免清屏抢走点击和内容滚动 */
export const shouldYieldChromeSwipe = (target: EventTarget | null, root: HTMLElement): boolean => {
  const start = target instanceof Element ? target : null;
  if (!start) return false;
  const interactive = start.closest(INTERACTIVE_SELECTOR);
  if (interactive && root.contains(interactive)) return true;
  return fromHorizScroller(start, root);
};
