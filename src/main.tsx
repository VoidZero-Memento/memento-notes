import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { preloadUiCjkFonts } from "@/lib/fonts/preload-ui-cjk";
import { readStoredSidebarBg } from "@/lib/prefs/sidebar-bg";
import { dismissSplash, waitAppBgPainted } from "@/lib/splash/splash-gate";
import { waitForSplash } from "@/lib/splash/wait-splash";
import { applyTheme, readStoredTheme } from "@/lib/theme/theme";
import App from "./App";
import "./index.css";

preloadUiCjkFonts();
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

mount();

if (readStoredSidebarBg()) {
  void Promise.all([waitForSplash(), waitAppBgPainted()]).then(dismissSplash);
} else {
  dismissSplash();
}
