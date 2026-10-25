import { createFileRoute } from "@tanstack/react-router";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { openDatabase } from "../persistence/database.ts";
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

/**
 * 앱과 DB는 첫 요청 때 한 번만 연다. 모듈을 불러오는 순간 DB를 열면 빌드의
 * 프리렌더가 API를 부르지 않아도 PGlite·마이그레이션 파일을 찾다가 실패한다.
 * PGlite는 한 디렉터리에 하나만 열므로 모든 저장소와 인증이 같은 약속을 쓴다.
 */
let appPromise: Promise<ReturnType<typeof createApp>> | undefined;

function getApp() {
  appPromise ??= (async () => {
    const database = await openDatabase(".data/pglite");
    return createApp({
      now: () => new Date().toISOString(),
      publishedQuestionSetStore: createDrizzlePublishedQuestionSetStore(database),
      eventStore: createDrizzleEventStore(database),
      auth: createAuth(drizzleAdapter(database, { provider: "pg" }), {
        secret: process.env.BETTER_AUTH_SECRET,
      }),
      ownerAccessStore: createDrizzleOwnerAccessStore(database),
      handoverStore: createDrizzleHandoverStore(database),
      purchaseStore: createDrizzlePurchaseStore(database),
      bookStore: createDrizzleBookStore(database),
      stockStore: createDrizzleDrawerStockStore(database),
      questionSetDraftStore: createDrizzleQuestionSetDraftStore(database),
      newBookId: () => `book-${crypto.randomUUID()}`,
      newDraftId: () => `draft-${crypto.randomUUID()}`,
    });
  })();
  return appPromise;
}

const handle = async ({ request }: { request: Request }) => (await getApp()).fetch(request);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle },
  },
});
