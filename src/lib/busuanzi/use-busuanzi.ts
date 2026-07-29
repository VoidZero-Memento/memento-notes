import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { refreshBusuanzi } from "./refresh-busuanzi";

/**
 * 在 pathname 变化且统计节点已挂载时刷新不蒜子。
 * 有选中文章时等正文就绪再请求，避免 page_pv 节点未挂载；无文章时只刷全站。
 */
export const useBusuanzi = (articleReady: boolean, hasSelectedPath: boolean) => {
  const { pathname } = useLocation();
  const shouldTrack = !hasSelectedPath || articleReady;

  useEffect(() => {
    if (!shouldTrack) return;

    const timer = window.setTimeout(() => {
      refreshBusuanzi();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [pathname, shouldTrack]);
};
