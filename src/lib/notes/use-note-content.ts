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
 * - `selectNote`：由用户点击触发，立刻更新 URL（侧栏选中态跟上），再后台拉内容；
 *   拉取期间保留旧正文并显示 `pending`，拉完后用 `runWithViewTransition` 替换内容，
 *   这样过渡动画截到的仍是新旧两篇真实内容。
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
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestedPathRef.current = null;
  }, [config]);

  // URL 被外部改走（前进/后退）时，取消点击触发的 in-flight 请求
  useEffect(() => {
    if (requestedPathRef.current && requestedPathRef.current !== selectedPath) {
      requestedPathRef.current = null;
      setPending(false);
    }
  }, [selectedPath]);

  const selectNote = async (path: string) => {
    if (path === selectedPath) return;

    requestedPathRef.current = path;
    onSelectPath(path);
    setPending(true);
    setError(null);

    try {
      const raw = await getNoteRawContent(config, path);
      if (requestedPathRef.current !== path) return;
      loadedPathRef.current = path;
      runWithViewTransition(() => {
        setContent(raw);
        setPending(false);
      });
    } catch (err) {
      if (requestedPathRef.current !== path) return;
      loadedPathRef.current = path;
      const message = toErrorMessage(err);
      runWithViewTransition(() => {
        setContent(null);
        setError(message);
        setPending(false);
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
    // 点击选中已立刻改 URL，内容由 selectNote 负责拉取，避免再走 loading 占位
    if (requestedPathRef.current === selectedPath) return;

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
