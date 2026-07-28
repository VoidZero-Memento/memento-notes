import { useEffect, useRef, useState } from "react";

import { runWithViewTransition } from "@/lib/dom/view-transition";
import { getNoteRawContent } from "@/lib/github/github.service";

import type { GithubRepoConfig } from "@/config/github.types";

type UseNoteContentResult = {
  content: string | null;
  loading: boolean;
  pending: boolean;
  error: string | null;
  selectNote: (path: string) => Promise<void>;
  retry: () => Promise<void>;
};

const toErrorMessage = (err: unknown) => (err instanceof Error ? err.message : "加载笔记内容失败");

/**
 * 管理选中笔记的内容加载。
 *
 * - `selectNote`：由用户点击触发，先把新内容拉取完成，再用 `runWithViewTransition`
 *   把"内容替换 + 通知外部更新 URL"合并成一次同步更新，这样浏览器截图到的
 *   才是新旧两篇笔记的真实内容，过渡动画才有意义；拉取期间保留旧内容显示（`pending`），
 *   不会被 loading 占位打断。
 * - 内部的 `useEffect`：处理非点击触发的加载（首次进入、刷新、浏览器前进后退），
 *   这类场景没有"旧内容"可过渡，走普通 loading 态即可；用 `loadedPathRef` 避免
 *   跟 `selectNote` 已经加载好的内容重复请求。
 */
export const useNoteContent = (
  config: GithubRepoConfig,
  selectedPath: string | null,
  onSelectPath: (path: string) => void,
): UseNoteContentResult => {
  const loadedPathRef = useRef<string | null>(null);
  const requestedPathRef = useRef<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestedPathRef.current = null;
  }, [config]);

  const selectNote = async (path: string) => {
    if (path === selectedPath) return;

    requestedPathRef.current = path;
    setPending(true);
    setError(null);

    try {
      const raw = await getNoteRawContent(config, path);
      if (requestedPathRef.current !== path) return;
      loadedPathRef.current = path;
      runWithViewTransition(() => {
        setContent(raw);
        setPending(false);
        onSelectPath(path);
      });
    } catch (err) {
      if (requestedPathRef.current !== path) return;
      loadedPathRef.current = path;
      const message = toErrorMessage(err);
      runWithViewTransition(() => {
        setContent(null);
        setError(message);
        setPending(false);
        onSelectPath(path);
      });
    }
  };

  const retry = async () => {
    if (!selectedPath) return;

    const path = selectedPath;
    requestedPathRef.current = path;
    loadedPathRef.current = null;
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
      setContent(null);
      setError(null);
      setLoading(false);
      setPending(false);
      loadedPathRef.current = null;
      return;
    }

    if (loadedPathRef.current === selectedPath) return;

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
