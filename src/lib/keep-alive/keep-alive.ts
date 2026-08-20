import { createContext, useContext } from "react";

import { GALLERY_PATH, STAGE_PATH } from "@/lib/gallery/constants";

import type { KeepAlivePane } from "./keep-alive.types";

export const KeepAliveActiveContext = createContext(true);

export const useKeepAliveActive = () => useContext(KeepAliveActiveContext);

export const paneOfPath = (pathname: string): KeepAlivePane => {
  if (pathname === GALLERY_PATH) return "gallery";
  if (pathname === STAGE_PATH) return "stage";
  return "notes";
};
