import { afterEach } from "vite-plus/test";
// siheom 0.4.0은 jest-dom을 스스로 등록하지 않는다. 브라우저 모드의 toHaveTextContent는
// 전체 일치라, 부분 일치는 jest-dom의 matcher로 맞춘다.
import "@testing-library/jest-dom/vitest";
import { cleanupReactRoots } from "@siheom/react";
import { configure } from "@testing-library/dom";

import { applyFontPreference, DEFAULT_FONT_ID } from "./lib/font-preference.ts";
import "./styles.css";

declare global {
  // React 19 browser tests need an explicit act environment flag.
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// 앱(main.tsx)처럼 기본 글꼴을 붙인다. 붙이지 않으면 테마 기본값의 첫 글꼴(손글씨 KimYui)을
// CDN에서 받으러 가, 테스트가 네트워크에 기대고 앱과 다른 글꼴로 그린다.
applyFontPreference(DEFAULT_FONT_ID);

// siheom의 찾기·기다리기는 Testing Library의 waitFor를 쓴다. 기본 1초는 전체 테스트를 함께
// 돌릴 때 lazy 모듈을 처음 불러오는 시간보다 짧다.
configure({ asyncUtilTimeout: 3000 });

afterEach(async () => {
  await cleanupReactRoots();
});
