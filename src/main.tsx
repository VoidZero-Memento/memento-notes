import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { applyTheme, readThemeFromSearch } from "@/lib/theme/theme";
import App from "./App";
import "./index.css";

applyTheme(readThemeFromSearch());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
