import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { applyFontPreference, readFontPreference } from "./lib/font-preference.ts";
import { getRouter } from "./router.tsx";
import "./styles.css";

// 첫 화면을 그리기 전에 이 태블릿에서 고른 글꼴을 붙인다.
applyFontPreference(readFontPreference());

const container = document.getElementById("app");
if (container === null) throw new Error("#app 요소가 없습니다");

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={getRouter()} />
  </StrictMode>,
);
