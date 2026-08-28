export const blurActiveInside = (root: Element | null | undefined) => {
  const active = document.activeElement;
  if (active instanceof HTMLElement && root?.contains(active)) active.blur();
};
