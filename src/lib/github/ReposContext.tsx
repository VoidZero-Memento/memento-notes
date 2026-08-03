import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { githubOrgConfig } from "@/config/github.config";
import { listOrgRepos } from "./github.service";

import type { ReactNode } from "react";
import type { GithubRepoConfig } from "@/config/github.types";

type ReposContextValue = {
  repos: GithubRepoConfig[];
  loading: boolean;
  error: string | null;
  getById: (id: string) => GithubRepoConfig | undefined;
  defaultRepoId: string | undefined;
  retry: () => void;
};

const ReposContext = createContext<ReposContextValue | null>(null);

export const ReposProvider = ({ children }: { children: ReactNode }) => {
  const [repos, setRepos] = useState<GithubRepoConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextRepos = await listOrgRepos(githubOrgConfig.owner);
        if (!cancelled) {
          setRepos(nextRepos);
          setError(nextRepos.length ? null : "该组织没有可用的公开仓库");
        }
      } catch (loadError) {
        if (!cancelled) {
          setRepos([]);
          setError(loadError instanceof Error ? loadError.message : "加载组织仓库失败");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const value = useMemo<ReposContextValue>(() => {
    const defaultRepoId = repos.find((repo) => repo.id === "python")?.id ?? repos[0]?.id;
    return {
      repos,
      loading,
      error,
      getById: (id) => repos.find((repo) => repo.id === id),
      defaultRepoId,
      retry,
    };
  }, [error, loading, repos, retry]);

  return <ReposContext.Provider value={value}>{children}</ReposContext.Provider>;
};

export const useRepos = (): ReposContextValue => {
  const context = useContext(ReposContext);
  if (!context) {
    throw new Error("useRepos 必须在 ReposProvider 内使用");
  }
  return context;
};
