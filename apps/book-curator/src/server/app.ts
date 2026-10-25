import { Elysia } from "elysia";
import * as v from "valibot";

import type { EventStore } from "../application/event-store-ports.ts";
import type { OwnerAccessStore } from "../application/owner-access-ports.ts";
import type { PublishedQuestionSetStore } from "../application/published-question-set-ports.ts";
import { checkHealth } from "../application/check-health.ts";
import { setOwnerPin, unlockOwner } from "../application/owner-access.ts";
import { FunnelEventBatchSchema } from "../domain/funnel.ts";
import { HealthSchema } from "../domain/health.ts";
import { KioskCurrentSchema, toKioskCurrentDto } from "../domain/kiosk.ts";
import { OwnerPinSchema } from "../domain/owner-pin.ts";
import { createAuthGuard } from "./auth-guard.ts";
import type { AppAuth } from "./auth.ts";
import { createOwnerGuard } from "./owner-guard.ts";

export interface AppDeps {
  /** 현재 시각 ISO 문자열. 테스트는 고정 시각을 넣는다. */
  now: () => string;
  /** 공개 질문 세트 버전 저장소. 테스트는 메모리 구현을 넣는다. */
  publishedQuestionSetStore: PublishedQuestionSetStore;
  /** 추가 전용 퍼널 이벤트 저장소. 테스트는 메모리 구현을 넣는다. */
  eventStore: EventStore;
  /** 운영자 인증. 테스트는 메모리 DB 위의 실제 better-auth를 넣는다. */
  auth: AppAuth;
  /** 주인 PIN과 짧은 토큰의 저장소. */
  ownerAccessStore: OwnerAccessStore;
}

const AdminMeSchema = v.strictObject({
  user: v.strictObject({
    id: v.string(),
    name: v.string(),
    email: v.string(),
  }),
});

const OwnerPinBodySchema = v.strictObject({ pin: OwnerPinSchema });

const OwnerUnlockSchema = v.strictObject({
  token: v.string(),
  expiresAt: v.string(),
});

const OwnerCheckSchema = v.strictObject({ ok: v.literal(true) });

const OwnerErrorSchema = v.strictObject({ code: v.string() });

/**
 * 서버 앱. 저장소·시각·인증 같은 의존성은 인자로 받아, 테스트가 메모리 구현과 고정 시각을 주입할 수 있게 한다.
 * 손님 API는 로그인 없이, `/api/admin/*`은 운영자 세션으로, `/api/owner/*` 확인은 주인 토큰으로 감싼다.
 * 이벤트 API는 요청 헤더를 읽지 않는다(I-12).
 */
export function createApp({
  now,
  publishedQuestionSetStore,
  eventStore,
  auth,
  ownerAccessStore,
}: AppDeps) {
  return new Elysia({ prefix: "/api" })
    .mount(auth.handler)
    .use(createAuthGuard(auth))
    .use(createOwnerGuard(ownerAccessStore, now))
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
    )
    .get(
      "/admin/me",
      ({ user }) => ({ user: { id: user.id, name: user.name, email: user.email } }),
      { auth: true, response: AdminMeSchema },
    )
    .post(
      "/admin/owner-pin",
      async ({ body }) => {
        await setOwnerPin(ownerAccessStore, body.pin);
        return new Response(null, { status: 204 });
      },
      { auth: true, body: OwnerPinBodySchema },
    )
    .post(
      "/owner/unlock",
      async ({ body, status }) => {
        const result = await unlockOwner(ownerAccessStore, body.pin, now());
        if (result.status === "no-pin") return status(409, { code: "PIN_NOT_SET" });
        if (result.status === "locked") return status(423, { code: "OWNER_LOCKED" });
        if (result.status === "invalid") return status(401, { code: "INVALID_PIN" });
        return { token: result.token, expiresAt: result.expiresAt };
      },
      {
        body: OwnerPinBodySchema,
        response: {
          200: OwnerUnlockSchema,
          401: OwnerErrorSchema,
          409: OwnerErrorSchema,
          423: OwnerErrorSchema,
        },
      },
    )
    .get("/owner/check", () => ({ ok: true as const }), {
      ownerToken: true,
      response: OwnerCheckSchema,
    });
}

export type App = ReturnType<typeof createApp>;
