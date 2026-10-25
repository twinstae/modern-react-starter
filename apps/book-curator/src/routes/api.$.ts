import { createFileRoute } from "@tanstack/react-router";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { openDatabase } from "../persistence/database.ts";
import { createDrizzleBookStore } from "../persistence/drizzle-book-store.ts";
import { createDrizzleDrawerStockStore } from "../persistence/drizzle-drawer-stock-store.ts";
import { createDrizzleEventStore } from "../persistence/drizzle-event-store.ts";
import { createDrizzleOwnerAccessStore } from "../persistence/drizzle-owner-access-store.ts";
import { createDrizzlePublishedQuestionSetStore } from "../persistence/drizzle-published-question-set-store.ts";
import { createApp } from "../server/app.ts";
import { createAuth } from "../server/auth.ts";

// PGlite는 한 디렉터리에 하나만 연다. 인증·저장소가 모두 같은 DB 약속을 함께 쓴다.
const database = await openDatabase(".data/pglite");

const app = createApp({
  now: () => new Date().toISOString(),
  publishedQuestionSetStore: createDrizzlePublishedQuestionSetStore(database),
  eventStore: createDrizzleEventStore(database),
  auth: createAuth(drizzleAdapter(database, { provider: "pg" }), {
    secret: process.env.BETTER_AUTH_SECRET,
  }),
  ownerAccessStore: createDrizzleOwnerAccessStore(database),
  bookStore: createDrizzleBookStore(database),
  stockStore: createDrizzleDrawerStockStore(database),
  newBookId: () => `book-${crypto.randomUUID()}`,
});

const handle = ({ request }: { request: Request }) => app.fetch(request);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle },
  },
});
