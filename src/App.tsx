import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";

import { GALLERY_PATH } from "@/lib/gallery/constants";
import { useRepos, ReposProvider } from "@/lib/github/ReposContext";
import { AppShell } from "@/components/layout/AppShell";
import { BootErrorState } from "@/components/notes/BootErrorState";
import { LoadingState } from "@/components/notes/LoadingState";
import { NotesShellRoot } from "@/components/notes/NotesShellRoot";
import { GalleryPage } from "@/pages/GalleryPage";
import { RepoPage } from "@/pages/RepoPage";

const AppRoutes = () => {
  const { defaultRepoId, error, loading, retry } = useRepos();
  const [searchParams] = useSearchParams();

  if (loading) {
    return (
      <NotesShellRoot>
        <LoadingState label="加载仓库列表" />
      </NotesShellRoot>
    );
  }

  if (error || !defaultRepoId) {
    return (
      <NotesShellRoot>
        <BootErrorState message={error ?? "未找到可用仓库"} onRetry={retry} />
      </NotesShellRoot>
    );
  }

  const search = searchParams.toString();
  const defaultTo = `/${defaultRepoId}${search ? `?${search}` : ""}`;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultTo} replace />} />
      <Route path="/:repoId/*" element={<RepoPage />} />
    </Routes>
  );
};

const App = () => (
  <ReposProvider>
    <AppShell>
      <Routes>
        <Route path={GALLERY_PATH} element={<GalleryPage />} />
        <Route path="*" element={<AppRoutes />} />
      </Routes>
    </AppShell>
  </ReposProvider>
);

export default App;
