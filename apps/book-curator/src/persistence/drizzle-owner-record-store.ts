import { asc, eq } from "drizzle-orm";

import type { HandoverStore } from "../application/owner-record-ports.ts";
import {
  parseHandoverInput,
  parseHandoverRecord,
  type HandoverRecord,
} from "../domain/owner-record.ts";
import type { Database } from "./database.ts";
import { handovers } from "./schema.ts";

type HandoverRow = typeof handovers.$inferSelect;

const toHandover = (row: HandoverRow): HandoverRecord => parseHandoverRecord(row);

/**
 * 열쇠 건넴 저장소. 행을 고치거나 지우지 않고 더하기만 한다.
 * id는 DB가 만들고, 읽을 때는 넣은 순서를 지킨다.
 */
export function createDrizzleHandoverStore(db: Database): HandoverStore {
  return {
    async append(input) {
      const parsed = parseHandoverInput(input);
      const [row] = await db.insert(handovers).values(parsed).returning();
      if (row === undefined) throw new Error("열쇠 건넴 기록을 저장하지 못했습니다");
      return toHandover(row);
    },
    async list(sessionId) {
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
