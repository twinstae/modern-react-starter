import { Elysia, status } from "elysia";
import * as v from "valibot";

import { ShortText } from "../domain/short-text.ts";
import type { SessionListStore } from "./session-list-store.ts";

export interface AppDeps {
  sessionListStore: SessionListStore;
  /** 현재 시각 Instant (ISO 문자열) */
  now: () => string;
  generateId: () => string;
}

/**
 * 서버 앱. 저장소 같은 의존성은 인자로 받아, 테스트가 메모리 구현을 주입할 수 있게 한다.
 */
export function createApp({ sessionListStore, now, generateId }: AppDeps) {
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
    });
}

export type App = ReturnType<typeof createApp>;
