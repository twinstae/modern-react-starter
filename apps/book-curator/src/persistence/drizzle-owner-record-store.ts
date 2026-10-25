import { asc, eq } from "drizzle-orm";

import type { HandoverStore, PurchaseStore } from "../application/owner-record-ports.ts";
import {
  parseHandoverInput,
  parseHandoverRecord,
  parsePurchaseInput,
  parsePurchaseRecord,
  type HandoverRecord,
  type PurchaseRecord,
} from "../domain/owner-record.ts";
import type { Database } from "./database.ts";
import { handovers, purchases } from "./schema.ts";

type HandoverRow = typeof handovers.$inferSelect;
type PurchaseRow = typeof purchases.$inferSelect;

const toHandover = (row: HandoverRow): HandoverRecord => parseHandoverRecord(row);
const toPurchase = (row: PurchaseRow): PurchaseRecord => parsePurchaseRecord(row);

/**
 * PGlite/Postgres 열쇠 건넴 저장소. 행을 고치거나 지우지 않고 더하기만 한다.
 * id는 DB가 만들고, 읽을 때는 넣은 순서를 지킨다.
 */
export function createDrizzleHandoverStore(dbSource: Database | Promise<Database>): HandoverStore {
  let opened: Promise<Database> | undefined;
  const database = (): Promise<Database> => (opened ??= Promise.resolve(dbSource));

  return {
    async append(input) {
      const parsed = parseHandoverInput(input);
      const db = await database();
      const [row] = await db.insert(handovers).values(parsed).returning();
      if (row === undefined) throw new Error("열쇠 건넴 기록을 저장하지 못했습니다");
      return toHandover(row);
    },
    async list(sessionId) {
      const db = await database();
      const rows =
        sessionId === undefined
          ? await db.select().from(handovers).orderBy(asc(handovers.id))
          : await db
              .select()
              .from(handovers)
              .where(eq(handovers.sessionId, sessionId))
              .orderBy(asc(handovers.id));
      return rows.map(toHandover);
    },
  };
}

/** PGlite/Postgres 산 책 저장소. 추가 전용이다. */
export function createDrizzlePurchaseStore(dbSource: Database | Promise<Database>): PurchaseStore {
  let opened: Promise<Database> | undefined;
  const database = (): Promise<Database> => (opened ??= Promise.resolve(dbSource));

  return {
    async append(input) {
      const parsed = parsePurchaseInput(input);
      const db = await database();
      const [row] = await db.insert(purchases).values(parsed).returning();
      if (row === undefined) throw new Error("산 책 기록을 저장하지 못했습니다");
      return toPurchase(row);
    },
    async list(sessionId) {
      const db = await database();
      const rows =
        sessionId === undefined
          ? await db.select().from(purchases).orderBy(asc(purchases.id))
          : await db
              .select()
              .from(purchases)
              .where(eq(purchases.sessionId, sessionId))
              .orderBy(asc(purchases.id));
      return rows.map(toPurchase);
    },
  };
}
