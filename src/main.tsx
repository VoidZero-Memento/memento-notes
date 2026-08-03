import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { readStoredSidebarBg } from "@/lib/prefs/sidebar-bg";
import { waitForSplash } from "@/lib/splash/wait-splash";
import { applyTheme, readStoredTheme } from "@/lib/theme/theme";
import App from "./App";
import "./index.css";

applyTheme(readStoredTheme());

const mount = () => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
};

if (readStoredSidebarBg()) {
  void waitForSplash().then(mount);
} else {
  mount();
}
