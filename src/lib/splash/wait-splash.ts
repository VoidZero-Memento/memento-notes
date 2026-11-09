import { readStoredSidebarBg } from "@/lib/prefs/sidebar-bg";

const preparePageBg = () => {
  if (window.matchMedia("(max-width: 860px)").matches) {
    return import("@/lib/bg-photos/prepare-mobile-bg").then((m) => m.prepareMobileBgTransition());
  }
  return import("@/lib/bg-photos/prepare-pc-bg").then((m) => m.preparePcBgTransition());
};

/** 背景开启时等整页底图首帧。开屏进度与退场由 index.html 的加载页收尾。 */
export const waitForSplash = async () => {
  if (!readStoredSidebarBg()) return;
  await preparePageBg();
};
