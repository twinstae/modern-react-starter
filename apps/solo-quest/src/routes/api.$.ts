import { createFileRoute } from "@tanstack/react-router";
import { Temporal } from "temporal-polyfill";
import { v7 as uuidv7 } from "uuid";

import { createDrizzleSessionListStore, openDatabase } from "../persistence/database.ts";
import { createApp } from "../server/app.ts";
import { createFileEventLogStore } from "../persistence/file-event-log-store.ts";

const app = createApp({
  eventLogStore: createFileEventLogStore(".data/sessions"),
  sessionListStore: createDrizzleSessionListStore(openDatabase(".data/pglite")),
  now: () => Temporal.Now.instant().toString(),
  generateId: uuidv7,
});

const handle = ({ request }: { request: Request }) => app.fetch(request);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle },
  },
});
