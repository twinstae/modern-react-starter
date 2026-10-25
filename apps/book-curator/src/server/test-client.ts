import { createApiClient } from "../api-client.ts";
import { createMemoryEventStore } from "../persistence/memory-event-store.ts";
import { createMemoryOwnerAccessStore } from "../persistence/memory-owner-access-store.ts";
import { createMemoryPublishedQuestionSetStore } from "../persistence/memory-published-question-set-store.ts";
import {
  createMemoryBookStore,
  createMemoryDrawerStockStore,
} from "../persistence/memory-shelf-store.ts";
import { createApp, type AppDeps } from "./app.ts";
import { createMemoryAuth } from "./auth.ts";

export const TEST_NOW = "2026-10-25T00:00:00.000Z";

const TEST_OPERATOR = {
  email: "owner@example.com",
  password: "bookshop-79-1",
  name: "책방 주인",
};

/**
 * API 테스트용 서버. 저장소·인증·시각은 메모리 구현과 고정 시각이 기본이고,
 * 필요한 것만 바꿔 끼운다. 인증은 메모리 DB 위의 실제 better-auth라 로그인 쿠키를 얻을 수 있다.
 */
export function createTestServer(deps: Partial<AppDeps> = {}) {
  const auth = deps.auth ?? createMemoryAuth();
  const ownerAccessStore = deps.ownerAccessStore ?? createMemoryOwnerAccessStore();
  const bookStore = deps.bookStore ?? createMemoryBookStore();
  const stockStore = deps.stockStore ?? createMemoryDrawerStockStore();
  let nextBookId = 1;
  const app = createApp({
    now: () => TEST_NOW,
    publishedQuestionSetStore: createMemoryPublishedQuestionSetStore(),
    eventStore: createMemoryEventStore(),
    newBookId: () => `book-test-${nextBookId++}`,
    ...deps,
    auth,
    ownerAccessStore,
    bookStore,
    stockStore,
  });

  return { app, api: createApiClient(app), auth, ownerAccessStore, bookStore, stockStore };
}

/**
 * API 테스트용 클라이언트. 브라우저와 같은 createApiClient에 앱 인스턴스를 넘겨 HTTP 없이 부른다.
 * 로그인이 필요한 테스트는 `createTestServer`에서 쿠키를 얻어 헤더로 넘긴다.
 */
export function createTestClient(deps: Partial<AppDeps> = {}) {
  return createTestServer(deps).api;
}

/** 테스트에서 운영자 계정을 만들고, 로그인 응답의 쿠키를 `cookie` 헤더 값으로 돌려준다. */
export async function signInOperator(
  auth: ReturnType<typeof createMemoryAuth>,
  credentials: { email: string; password: string; name?: string } = TEST_OPERATOR,
): Promise<string> {
  await auth.api.signUpEmail({
    body: {
      name: credentials.name ?? TEST_OPERATOR.name,
      email: credentials.email,
      password: credentials.password,
    },
  });
  const response = await auth.api.signInEmail({
    body: { email: credentials.email, password: credentials.password },
    asResponse: true,
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie === null) throw new Error("로그인 응답에 쿠키가 없습니다");
  return setCookie.split(";")[0] ?? "";
}

export { TEST_OPERATOR };
