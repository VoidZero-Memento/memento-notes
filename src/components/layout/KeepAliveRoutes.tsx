import { useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { GALLERY_PATH, STAGE_PATH } from "@/lib/gallery/constants";
import { useRepos } from "@/lib/github/ReposContext";
import { KeepAliveActiveContext, paneOfPath } from "@/lib/keep-alive/keep-alive";
import { BootErrorState } from "@/components/notes/BootErrorState";
import { LoadingState } from "@/components/notes/LoadingState";
import { NotesShellRoot } from "@/components/notes/NotesShellRoot";
import { GalleryPage } from "@/pages/GalleryPage";
import { RepoPage } from "@/pages/RepoPage";
import { StagePage } from "@/pages/StagePage";

import styles from "./KeepAliveRoutes.module.css";

import type { ReactNode } from "react";
import type { Location } from "react-router-dom";
import type { KeepAlivePane } from "@/lib/keep-alive/keep-alive.types";

type AlivePaneProps = {
  active: boolean;
  children: ReactNode;
};

type NotesRoutesProps = {
  active: boolean;
  location: Location;
};

type VisitedPanes = Record<KeepAlivePane, boolean>;

const AlivePane = ({ active, children }: AlivePaneProps) => (
  <div
    className={active ? `${styles.pane} ${styles.paneActive}` : styles.pane}
    aria-hidden={!active}
    {...(active ? {} : { inert: true })}
  >
    <KeepAliveActiveContext.Provider value={active}>{children}</KeepAliveActiveContext.Provider>
  </div>
);

const NotesRoutes = ({ active, location }: NotesRoutesProps) => {
  const { defaultRepoId, error, loading, retry } = useRepos();

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

  const defaultTo = `/${defaultRepoId}${location.search}`;

  return (
    <Routes location={location}>
      <Route path="/" element={active ? <Navigate to={defaultTo} replace /> : null} />
      <Route path="/:repoId/*" element={<RepoPage />} />
    </Routes>
  );
};

export const KeepAliveRoutes = () => {
  const location = useLocation();
  const pane = paneOfPath(location.pathname);
  const notesLocationRef = useRef<Location | null>(null);
  const galleryLocationRef = useRef<Location | null>(null);
  const stageLocationRef = useRef<Location | null>(null);
  const [visited, setVisited] = useState<VisitedPanes>(() => ({
    gallery: pane === "gallery",
    notes: pane === "notes",
    stage: pane === "stage",
  }));

  if (!visited[pane]) setVisited({ ...visited, [pane]: true });
  if (pane === "notes") notesLocationRef.current = location;
  if (pane === "gallery") galleryLocationRef.current = location;
  if (pane === "stage") stageLocationRef.current = location;

  const notesLocation = notesLocationRef.current;
  const galleryLocation = galleryLocationRef.current;
  const stageLocation = stageLocationRef.current;

  return (
    <>
      {notesLocation && (visited.notes || pane === "notes") ? (
        <AlivePane active={pane === "notes"}>
          <NotesRoutes active={pane === "notes"} location={notesLocation} />
        </AlivePane>
      ) : null}
      {galleryLocation && (visited.gallery || pane === "gallery") ? (
        <AlivePane active={pane === "gallery"}>
          <Routes location={galleryLocation}>
            <Route path={GALLERY_PATH} element={<GalleryPage />} />
          </Routes>
        </AlivePane>
      ) : null}
      {stageLocation && (visited.stage || pane === "stage") ? (
        <AlivePane active={pane === "stage"}>
          <Routes location={stageLocation}>
            <Route path={STAGE_PATH} element={<StagePage />} />
          </Routes>
        </AlivePane>
      ) : null}
    </>
  );
};
