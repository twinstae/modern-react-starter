import { createFileRoute } from "@tanstack/react-router";
import { Temporal } from "temporal-polyfill";
import { v7 as uuidv7 } from "uuid";

import { SEED_ORACLES, SEED_VERSION } from "../data/oracle-seed.ts";
import { createDrizzleSessionListStore, openDatabase } from "../persistence/database.ts";
import { createApp } from "../server/app.ts";
import { createFileEventLogStore } from "../persistence/file-event-log-store.ts";
import { createFileOracleStore } from "../persistence/file-oracle-store.ts";

const app = createApp({
  eventLogStore: createFileEventLogStore(".data/sessions"),
  oracleStore: createFileOracleStore(".data/oracles.json", {
    seed: SEED_ORACLES,
    seedVersion: SEED_VERSION,
  }),
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
