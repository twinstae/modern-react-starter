import { createFileRoute } from "@tanstack/react-router";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { openConfiguredDatabase } from "../persistence/database.ts";
import { createDrizzleBookStore } from "../persistence/drizzle-book-store.ts";
import { createDrizzleDrawerStockStore } from "../persistence/drizzle-drawer-stock-store.ts";
import { createDrizzleEventStore } from "../persistence/drizzle-event-store.ts";
import { createDrizzleOwnerAccessStore } from "../persistence/drizzle-owner-access-store.ts";
import {
  createDrizzleHandoverStore,
  createDrizzlePurchaseStore,
} from "../persistence/drizzle-owner-record-store.ts";
import { createDrizzlePublishedQuestionSetStore } from "../persistence/drizzle-published-question-set-store.ts";
import { createDrizzleQuestionSetDraftStore } from "../persistence/drizzle-question-set-draft-store.ts";
import { createApp } from "../server/app.ts";
import { createAuth } from "../server/auth.ts";
import { consoleFailureLog } from "../server/failure-log.ts";
import { createLazyApp } from "../server/lazy-app.ts";

/**
 * 앱과 DB는 첫 요청 때 한 번만 연다. 모듈을 불러오는 순간 DB를 열면 빌드의
 * 프리렌더가 API를 부르지 않아도 PGlite·마이그레이션 파일을 찾다가 실패한다.
 * PGlite는 한 디렉터리에 하나만 열므로 모든 저장소와 인증이 같은 DB를 쓴다.
 * 여는 과정은 단계마다 이름을 붙여 Vercel 로그에서 어느 단계가 실패했는지 보이게 한다.
 */
const getApp = createLazyApp({
  logFailure: consoleFailureLog,
  steps: async (step) => {
    const { db: database, description } = await step("DB 연결", openConfiguredDatabase);
    console.info(`[book-curator] DB 연결: ${description}`);
    const auth = await step("인증 준비", async () =>
      createAuth(drizzleAdapter(database, { provider: "pg" }), {
        secret: process.env.BETTER_AUTH_SECRET,
      }),
    );
    return step("앱 조립", async () =>
      createApp({
        now: () => new Date().toISOString(),
        publishedQuestionSetStore: createDrizzlePublishedQuestionSetStore(database),
        eventStore: createDrizzleEventStore(database),
        auth,
        ownerAccessStore: createDrizzleOwnerAccessStore(database),
        handoverStore: createDrizzleHandoverStore(database),
        purchaseStore: createDrizzlePurchaseStore(database),
        bookStore: createDrizzleBookStore(database),
        stockStore: createDrizzleDrawerStockStore(database),
        questionSetDraftStore: createDrizzleQuestionSetDraftStore(database),
        newBookId: () => `book-${crypto.randomUUID()}`,
        newDraftId: () => `draft-${crypto.randomUUID()}`,
        logFailure: consoleFailureLog,
      }),
    );
  },
});

const handle = async ({ request }: { request: Request }) => (await getApp()).fetch(request);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle },
  },
});
