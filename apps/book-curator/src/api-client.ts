import { treaty } from "@elysiajs/eden";

import type { App } from "./server/app.ts";

/**
 * API 클라이언트를 만든다. 브라우저는 origin을, API 테스트는 앱 인스턴스를 넘긴다.
 * 테스트와 브라우저가 같은 설정을 쓰도록 클라이언트는 반드시 이 함수로 만든다.
 */
export function createApiClient(target: string | App) {
  // eden은 ISO 날짜처럼 보이는 문자열을 Date로 바꾼다. 타입은 string으로 남아 런타임과 어긋나므로 끈다.
  return treaty<App>(target as string, { parseDate: false }).api;
}

export const api = createApiClient(
  typeof window === "undefined" ? "localhost" : window.location.origin,
);
