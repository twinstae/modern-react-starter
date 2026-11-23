import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { applyFontPreference, readFontPreference } from "./lib/font-preference.ts";
import { getRouter } from "./router.tsx";
// 글꼴 파일을 앱과 함께 묶어 인터넷 없이도 같은 글꼴로 그린다.
import "@fontsource-variable/noto-sans-kr";
import "@fontsource-variable/noto-serif-kr";
import "./styles.css";

// 첫 화면을 그리기 전에 이 태블릿에서 고른 글꼴을 붙인다.
applyFontPreference(readFontPreference());

const container = document.getElementById("app");
if (container === null) throw new Error("#app 요소가 없습니다");

// 설치한 앱이 인터넷 없이 열리도록 모든 파일을 캐시하는 서비스 워커. 개발 서버에서는 켜지 않는다.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={getRouter()} />
  </StrictMode>,
);
