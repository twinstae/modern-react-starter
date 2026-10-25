import { Elysia } from "elysia";

import type { EventStore } from "../application/event-store-ports.ts";
import type { PublishedQuestionSetStore } from "../application/published-question-set-ports.ts";
import { checkHealth } from "../application/check-health.ts";
import { FunnelEventBatchSchema } from "../domain/funnel.ts";
import { HealthSchema } from "../domain/health.ts";
import { KioskCurrentSchema, toKioskCurrentDto } from "../domain/kiosk.ts";

export interface AppDeps {
  /** 현재 시각 ISO 문자열. 테스트는 고정 시각을 넣는다. */
  now: () => string;
  /** 공개 질문 세트 버전 저장소. 테스트는 메모리 구현을 넣는다. */
  publishedQuestionSetStore: PublishedQuestionSetStore;
  /** 추가 전용 퍼널 이벤트 저장소. 테스트는 메모리 구현을 넣는다. */
  eventStore: EventStore;
}

/**
 * 서버 앱. 저장소·시각 같은 의존성은 인자로 받아, 테스트가 메모리 구현과 고정 시각을 주입할 수 있게 한다.
 * 이벤트 API는 요청 헤더를 읽지 않는다(I-12).
 */
export function createApp({ now, publishedQuestionSetStore, eventStore }: AppDeps) {
  return new Elysia({ prefix: "/api" })
    .get("/health", () => checkHealth({ now }), {
      response: HealthSchema,
    })
    .get(
      "/kiosk/current",
      async () => toKioskCurrentDto(await publishedQuestionSetStore.current()),
      { response: KioskCurrentSchema },
    )
    .post(
      "/events",
      async ({ body }) => {
        await eventStore.append(body.events);
        return new Response(null, { status: 204 });
      },
      { body: FunnelEventBatchSchema },
    );
}

export type App = ReturnType<typeof createApp>;
