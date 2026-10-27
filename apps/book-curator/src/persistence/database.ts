import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import * as schema from "./schema.ts";

const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** PGlite DB를 열고 마이그레이션한다. dataDir를 주지 않으면 메모리 DB다. */
export async function openDatabase(dataDir?: string) {
  // PGlite는 상위 디렉터리를 만들지 않는다.
  if (dataDir) await mkdir(dataDir, { recursive: true });
  const db = drizzle({ client: new PGlite(dataDir), schema });
  await migrate(db, { migrationsFolder });
  return db;
}

export type LocalDatabase = Awaited<ReturnType<typeof openDatabase>>;

/** 서버리스 인스턴스가 마이그레이션을 겹쳐 돌리지 않도록 운영 마이그레이션은 `db:migrate`만 한다. */
export async function connectDatabase(url: string, { migrateFirst = false } = {}) {
  const { default: postgres } = await import("postgres");
  const { drizzle: drizzlePostgres } = await import("drizzle-orm/postgres-js");
  // Supabase 트랜잭션 풀러는 prepared statement를 이어 쓰지 못한다.
  const client = postgres(url, { prepare: false });
  const db = drizzlePostgres({ client, schema });
  if (migrateFirst) {
    const { migrate: migratePostgres } = await import("drizzle-orm/postgres-js/migrator");
    await migratePostgres(db, { migrationsFolder });
  }
  return db;
}

/** `POSTGRES_URL`이 있으면 운영 Postgres, 없으면 `.data/pglite`를 연다. */
export async function openConfiguredDatabase(): Promise<{
  db: Database;
  close: () => Promise<void>;
}> {
  const url = process.env.POSTGRES_URL;
  if (url !== undefined && url !== "") {
    const db = await connectDatabase(url);
    return { db, close: () => db.$client.end() };
  }
  const db = await openDatabase(".data/pglite");
  return { db, close: () => db.$client.close() };
}
