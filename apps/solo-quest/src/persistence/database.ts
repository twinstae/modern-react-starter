import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { Temporal } from "temporal-polyfill";

import type { SessionListStore, SessionSummary } from "../server/session-list-store.ts";
import * as schema from "./schema.ts";

const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));

/** PGlite DB를 열고 마이그레이션한다. dataDir를 주지 않으면 메모리 DB다. */
export async function openDatabase(dataDir?: string) {
  // PGlite는 상위 디렉터리를 만들지 않는다
  if (dataDir) await mkdir(dataDir, { recursive: true });
  const db = drizzle({ client: new PGlite(dataDir), schema });
  await migrate(db, { migrationsFolder });
  return db;
}

export type Database = Awaited<ReturnType<typeof openDatabase>>;

const toSummary = (row: typeof schema.sessions.$inferSelect): SessionSummary => ({
  id: row.id,
  title: row.title,
  createdAt: Temporal.Instant.fromEpochMilliseconds(row.createdAt.getTime()).toString(),
});

/** DB가 아직 열리는 중이어도(Promise) 저장소를 바로 만들 수 있다. */
export function createDrizzleSessionListStore(
  database: Database | Promise<Database>,
): SessionListStore {
  const ready = Promise.resolve(database);

  return {
    async add(session) {
      const db = await ready;
      await db.insert(schema.sessions).values({
        ...session,
        createdAt: new Date(Temporal.Instant.from(session.createdAt).epochMilliseconds),
      });
    },
    async get(id) {
      const db = await ready;
      const [row] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id));
      return row ? toSummary(row) : null;
    },
    async list() {
      const db = await ready;
      const rows = await db.select().from(schema.sessions).orderBy(desc(schema.sessions.createdAt));
      return rows.map(toSummary);
    },
  };
}
