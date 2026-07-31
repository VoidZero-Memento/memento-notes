import { useEffect, useRef, useState } from "react";

import { runWithViewTransition } from "@/lib/dom/view-transition";
import { getNoteRawContent } from "@/lib/github/github.service";
import { toast } from "@/lib/toast/toast";

import type { GithubRepoConfig } from "@/config/github.types";

type UseNoteContentResult = {
  content: string | null;
  loading: boolean;
  pending: boolean;
  error: string | null;
  selectNote: (path: string) => Promise<void>;
  retry: () => Promise<void>;
};

/** 延后挂 pending UI，让侧栏选中高亮先完成提交/绘制，避免同帧抢主线程 */
const PENDING_UI_DELAY_MS = 100;

const toErrorMessage = (err: unknown) => (err instanceof Error ? err.message : "加载笔记内容失败");

/**
 * 管理选中笔记的内容加载。
 *
 * - `selectNote`：由用户点击触发，立刻更新 URL（侧栏选中态跟上），再后台拉内容；
 *   `pending` 延后一小段再挂上，避免与高亮切换同帧竞争；短请求可不闪 Loading。
 *   拉完后用 `runWithViewTransition` 替换内容，过渡动画截到的仍是新旧两篇真实内容。
 * - 内部的 `useEffect`：处理非点击触发的加载（首次进入、刷新、浏览器前进后退），
 *   这类场景没有"旧内容"可过渡，走普通 loading 态；用 `requestedPathRef` /
 *   `loadedPathRef` 避免与 `selectNote` 重复请求或互相抢写。
 */
export const useNoteContent = (
  config: GithubRepoConfig,
  selectedPath: string | null,
  onSelectPath: (path: string) => void,
): UseNoteContentResult => {
  const loadedPathRef = useRef<string | null>(null);
  const requestedPathRef = useRef<string | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearPendingTimer = () => {
    if (pendingTimerRef.current === null) return;
    clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = null;
  };

  const schedulePending = (path: string) => {
    clearPendingTimer();
    pendingTimerRef.current = setTimeout(() => {
      pendingTimerRef.current = null;
      if (requestedPathRef.current === path) setPending(true);
    }, PENDING_UI_DELAY_MS);
  };

  useEffect(() => {
    requestedPathRef.current = null;
    inFlightRef.current = false;
    clearPendingTimer();
    setPending(false);
  }, [config]);

  useEffect(() => () => clearPendingTimer(), []);

  // URL 被外部改走（前进/后退）时，取消点击触发的 in-flight 请求
  useEffect(() => {
    if (requestedPathRef.current && requestedPathRef.current !== selectedPath) {
      requestedPathRef.current = null;
      inFlightRef.current = false;
      clearPendingTimer();
      setPending(false);
    }
  }, [selectedPath]);

  const selectNote = async (path: string) => {
    if (path === selectedPath) return;
    // 仅在点击入口拦截，不改侧栏 UI，避免干扰高亮动画
    if (loading || pending || inFlightRef.current) {
      toast.info("正在加载，请稍候");
      return;
    }

    inFlightRef.current = true;
    requestedPathRef.current = path;
    onSelectPath(path);
    setError(null);
    // 点击路径改由 pending 承担，清掉可能残留的 loading，避免双 Spinner
    setLoading(false);
    // 先让选中态进同一轮更新，pending/Loading 延后，避免拖慢高亮
    schedulePending(path);

    try {
      const raw = await getNoteRawContent(config, path);
      clearPendingTimer();
      if (requestedPathRef.current !== path) return;
      loadedPathRef.current = path;
      runWithViewTransition(() => {
        setContent(raw);
        setPending(false);
      });
    } catch (err) {
      clearPendingTimer();
      if (requestedPathRef.current !== path) return;
      loadedPathRef.current = path;
      const message = toErrorMessage(err);
      runWithViewTransition(() => {
        setContent(null);
        setError(message);
        setPending(false);
      });
    } finally {
      inFlightRef.current = false;
    }
  };

  const retry = async () => {
    if (!selectedPath) return;

    const path = selectedPath;
    requestedPathRef.current = path;
    loadedPathRef.current = null;
    clearPendingTimer();
    setLoading(true);
    setPending(false);
    setError(null);
    setContent(null);

    try {
      const raw = await getNoteRawContent(config, path);
      if (requestedPathRef.current !== path) return;
      loadedPathRef.current = path;
      setContent(raw);
    } catch (err) {
      if (requestedPathRef.current !== path) return;
      loadedPathRef.current = path;
      setError(toErrorMessage(err));
    } finally {
      if (requestedPathRef.current === path) setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPath) {
      clearPendingTimer();
      setContent(null);
      setError(null);
      setLoading(false);
      setPending(false);
      loadedPathRef.current = null;
      return;
    }

    if (loadedPathRef.current === selectedPath) return;
    // 点击选中已立刻改 URL，内容由 selectNote 负责拉取，避免再走 loading 占位
    if (requestedPathRef.current === selectedPath) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const raw = await getNoteRawContent(config, selectedPath);
        if (!cancelled) {
          setContent(raw);
          loadedPathRef.current = selectedPath;
        }
      } catch (err) {
        if (!cancelled) {
          setContent(null);
          setError(toErrorMessage(err));
          loadedPathRef.current = selectedPath;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [config, selectedPath]);

  return { content, loading, pending, error, selectNote, retry };
};
