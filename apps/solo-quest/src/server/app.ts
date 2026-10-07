import { Elysia, status } from "elysia";
import * as v from "valibot";

import { SessionEventSchema, type SessionEvent } from "../domain/session.ts";
import { ShortText } from "../domain/short-text.ts";
import { VersionConflictError, type EventLogStore } from "../domain/event-log-store.ts";
import type { SessionListStore } from "../domain/session-list-store.ts";

export interface AppDeps {
  sessionListStore: SessionListStore;
  eventLogStore: EventLogStore;
  /** 현재 시각 Instant (ISO 문자열) */
  now: () => string;
  generateId: () => string;
}

/** 도메인은 실행하지 않고, 이 세션의 이벤트이고 버전이 expectedVersion + 1부터 1씩 이어지는지만 본다. */
function findEventProblem(sessionId: string, expectedVersion: number, events: SessionEvent[]) {
  const belongsElsewhere = events.some((event) => event.entityId !== sessionId);
  if (belongsElsewhere) return "다른 세션의 이벤트가 섞여 있습니다";
  const isContiguous = events.every((event, i) => event.version === expectedVersion + 1 + i);
  if (!isContiguous) return "이벤트 버전이 expectedVersion 다음부터 1씩 이어지지 않습니다";
  return null;
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
        const problem = findEventProblem(params.id, body.expectedVersion, body.events);
        if (problem) return status(422, problem);
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
