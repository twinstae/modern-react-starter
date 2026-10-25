import { createFileRoute } from "@tanstack/react-router";

import { createDrizzleEventStore } from "../persistence/drizzle-event-store.ts";
import { createDrizzlePublishedQuestionSetStore } from "../persistence/drizzle-published-question-set-store.ts";
import { openDatabase } from "../persistence/database.ts";
import { createApp } from "../server/app.ts";

// PGlite는 한 디렉터리에 하나만 연다. 공개 버전과 이벤트 저장소가 같은 약속을 함께 쓴다.
const database = openDatabase(".data/pglite");

const app = createApp({
  now: () => new Date().toISOString(),
  publishedQuestionSetStore: createDrizzlePublishedQuestionSetStore(database),
  eventStore: createDrizzleEventStore(database),
});

const handle = ({ request }: { request: Request }) => app.fetch(request);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle },
  },
});
