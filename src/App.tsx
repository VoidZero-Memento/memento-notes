import { Navigate, Route, Routes } from "react-router-dom";

import { useRepos, ReposProvider } from "@/lib/github/ReposContext";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/notes/LoadingState";
import { RepoPage } from "@/pages/RepoPage";
import styles from "@/components/notes/NotesShell.module.css";

const AppRoutes = () => {
  const { defaultRepoId, error, loading } = useRepos();

  if (loading) {
    return <LoadingState label="加载仓库列表" />;
  }

  if (error || !defaultRepoId) {
    return <p className={styles.error}>{error ?? "未找到可用仓库"}</p>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${defaultRepoId}`} replace />} />
      <Route path="/:repoId" element={<RepoPage />} />
    </Routes>
  );
};

const App = () => (
  <ReposProvider>
    <AppShell>
      <AppRoutes />
    </AppShell>
  </ReposProvider>
);

export default App;
