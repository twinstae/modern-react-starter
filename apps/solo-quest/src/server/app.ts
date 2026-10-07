import { Elysia, status } from "elysia";
import * as v from "valibot";

import { SessionEventSchema } from "../domain/session.ts";
import { ShortText } from "../domain/short-text.ts";
import { VersionConflictError, type EventLogStore } from "./event-log-store.ts";
import type { SessionListStore } from "./session-list-store.ts";

export interface AppDeps {
  sessionListStore: SessionListStore;
  eventLogStore: EventLogStore;
  /** 현재 시각 Instant (ISO 문자열) */
  now: () => string;
  generateId: () => string;
}

/**
 * 서버 앱. 저장소 같은 의존성은 인자로 받아, 테스트가 메모리 구현을 주입할 수 있게 한다.
 */
export function createApp({ sessionListStore, eventLogStore, now, generateId }: AppDeps) {
  return new Elysia({ prefix: "/api" })
    .get("/health", () => ({ status: "ok" as const }))
    .get("/sessions", () => sessionListStore.list())
    .post(
      "/sessions",
      async ({ body }) => {
        const session = { id: generateId(), title: body.title, createdAt: now() };
        await sessionListStore.add(session);
        return session;
      },
      { body: v.object({ title: ShortText }) },
    )
    .get("/sessions/:id", async ({ params }) => {
      const session = await sessionListStore.get(params.id);
      return session ?? status(404, "세션이 없습니다");
    })
    .get("/sessions/:id/events", async ({ params }) => {
      if (!(await sessionListStore.get(params.id))) return status(404, "세션이 없습니다");
      return eventLogStore.read(params.id);
    })
    .post(
      "/sessions/:id/events",
      async ({ params, body }) => {
        if (!(await sessionListStore.get(params.id))) return status(404, "세션이 없습니다");
        try {
          await eventLogStore.append(params.id, body.expectedVersion, body.events);
        } catch (error) {
          if (error instanceof VersionConflictError) return status(409, error.message);
          throw error;
        }
        return new Response(null, { status: 204 });
      },
      {
        body: v.object({
          expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0)),
          events: v.array(SessionEventSchema),
        }),
      },
    );
}

export type App = ReturnType<typeof createApp>;
