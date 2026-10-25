import { eq } from "drizzle-orm";

import type { EventStore } from "../application/event-store-ports.ts";
import { funnelEventFromRow, toFunnelEventPayload } from "../domain/funnel.ts";
import type { Database } from "./database.ts";
import { funnelEvents } from "./schema.ts";

/**
 * PGlite/Postgres 이벤트 저장소. 라우트가 DB를 비동기로 열 수 있도록 완성된 DB와
 * 그 DB의 약속을 모두 받는다. 공개 버전 저장소와 같은 약속을 넘겨 PGlite를 한 번만 연다.
 */
export function createDrizzleEventStore(dbSource: Database | Promise<Database>): EventStore {
  let opened: Promise<Database> | undefined;
  const database = (): Promise<Database> => (opened ??= Promise.resolve(dbSource));

  return {
    async append(events) {
      if (events.length === 0) return;

      const db = await database();
      await db.insert(funnelEvents).values(
        events.map((event) => ({
          sessionId: event.sessionId,
          kioskName: event.kioskName,
          version: event.version,
          type: event.type,
          payload: toFunnelEventPayload(event),
        })),
      );
    },
    async list(sessionId) {
      const db = await database();
      const rows =
        sessionId === undefined
          ? await db.select().from(funnelEvents).orderBy(funnelEvents.id)
          : await db
              .select()
              .from(funnelEvents)
              .where(eq(funnelEvents.sessionId, sessionId))
              .orderBy(funnelEvents.id);

      return rows.map((row) =>
        funnelEventFromRow({
          sessionId: row.sessionId,
          kioskName: row.kioskName,
          version: row.version,
          type: row.type,
          payload: row.payload,
        }),
      );
    },
  };
}
