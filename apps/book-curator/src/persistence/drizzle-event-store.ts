import { eq } from "drizzle-orm";

import type { EventStore } from "../application/event-store-ports.ts";
import { funnelEventFromRow, toFunnelEventPayload } from "../domain/funnel.ts";
import type { Database } from "./database.ts";
import { funnelEvents } from "./schema.ts";

export function createDrizzleEventStore(db: Database): EventStore {
  return {
    async append(events) {
      if (events.length === 0) return;

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
