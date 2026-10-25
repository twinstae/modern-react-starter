import { createFileRoute } from "@tanstack/react-router";

import { createDrizzlePublishedQuestionSetStore } from "../persistence/drizzle-published-question-set-store.ts";
import { openDatabase } from "../persistence/database.ts";
import { createApp } from "../server/app.ts";

const app = createApp({
  now: () => new Date().toISOString(),
  publishedQuestionSetStore: createDrizzlePublishedQuestionSetStore(openDatabase(".data/pglite")),
});

const handle = ({ request }: { request: Request }) => app.fetch(request);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle },
  },
});
