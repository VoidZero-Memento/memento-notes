import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { getRepoFileTree } from "@/lib/github/github.service";
import { encodeNotePathForUrl } from "@/lib/github/repo-path";
import { useRepos } from "@/lib/github/ReposContext";
import { NotesWorkspace } from "@/components/notes/NotesWorkspace";

import type { GithubFileTreeNode } from "@/lib/github/github.types";

export const RepoPage = () => {
  const { repoId = "", "*": splatPath } = useParams<{ repoId: string; "*": string }>();
  const navigate = useNavigate();
  const { getById } = useRepos();
  const config = getById(repoId);
  const selectedPath = splatPath ? splatPath : null;

  const handleSelectPath = (path: string) => {
    navigate(`/${repoId}/${encodeNotePathForUrl(path)}`);
  };

  const [tree, setTree] = useState<GithubFileTreeNode[]>([]);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);

  useEffect(() => {
    if (!config) return;

    let cancelled = false;
    setTreeLoading(true);
    setTree([]);
    setTreeError(null);

    const load = async () => {
      try {
        const nextTree = await getRepoFileTree(config);
        if (!cancelled) {
          setTree(nextTree);
          setTreeError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setTree([]);
          setTreeError(error instanceof Error ? error.message : "加载文件树失败");
        }
      } finally {
        if (!cancelled) setTreeLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [config]);

  if (!config) {
    return <Navigate to="/" replace />;
  }

  return (
    <NotesWorkspace
      config={config}
      tree={tree}
      treeError={treeError}
      treeLoading={treeLoading}
      selectedPath={selectedPath}
      onSelectPath={handleSelectPath}
    />
  );
};
