import { Elysia } from "elysia";
import * as v from "valibot";

import {
  AdminDrawersSchema,
  AdminErrorSchema,
  AdminMeSchema,
  OwnerPinResultSchema,
  PublishBlockedSchema,
  PublishCheckSchema,
  PublishedVersionSummarySchema,
} from "../admin-dto.ts";
import { checkHealth } from "../application/check-health.ts";
import {
  addBooks,
  checkPublish,
  createDrawer,
  publish,
  PublishBlockedError,
  updateBook,
  updateDrawer,
  type PublishCheck,
} from "../application/drawer-admin.ts";
import {
  BookNotFoundError,
  DrawerNotFoundError,
  type DrawerStore,
} from "../application/drawer-ports.ts";
import type { EventStore } from "../application/event-store-ports.ts";
import { generateOwnerPin, unlockOwner } from "../application/owner-access.ts";
import type { OwnerAccessStore } from "../application/owner-access-ports.ts";
import type { HandoverStore } from "../application/owner-record-ports.ts";
import { recordHandover } from "../application/owner-records.ts";
import type { PublishedVersionStore } from "../application/published-version-ports.ts";
import { BookInputSchema, DrawerSchema, toDrawerDto } from "../domain/drawer.ts";
import { FunnelEventBatchSchema } from "../domain/funnel.ts";
import { HealthSchema } from "../domain/health.ts";
import { KioskCurrentSchema, toKioskCurrentDto } from "../domain/kiosk.ts";
import { OwnerPinSchema } from "../domain/owner-pin.ts";
import {
  HandoverInputSchema,
  HandoverRecordSchema,
  toHandoverRecordDto,
} from "../domain/owner-record.ts";
import { createAuthGuard } from "./auth-guard.ts";
import type { AppAuth } from "./auth.ts";
import type { LogFailure } from "./failure-log.ts";
import { createOwnerGuard } from "./owner-guard.ts";

export interface AppDeps {
  /** 현재 시각 ISO 문자열. 테스트는 고정 시각을 넣는다. */
  now: () => string;
  /** 운영자가 고치는 서랍·문항·책 저장소. */
  drawerStore: DrawerStore;
  /** 공개 버전 저장소. 손님에게는 가장 최근 버전이 나간다. */
  publishedVersionStore: PublishedVersionStore;
  /** 추가 전용 퍼널 이벤트 저장소. */
  eventStore: EventStore;
  /** 운영자 인증. 테스트는 메모리 DB 위의 실제 better-auth를 넣는다. */
  auth: AppAuth;
  /** 주인 PIN과 짧은 토큰의 저장소. */
  ownerAccessStore: OwnerAccessStore;
  /** 주인이 실제로 건넨 서랍의 추가 전용 기록. */
  handoverStore: HandoverStore;
  /** 새 서랍·책 id를 만든다. 테스트는 고정 id 생성기를 넣는다. */
  newId: () => string;
  /** 새 주인 PIN을 만든다. 테스트는 고정 PIN을 넣는다. */
  newOwnerPin?: () => string;
  /** 서버 실패를 남긴다. 운영은 콘솔, 테스트는 배열에 모은다. */
  logFailure: LogFailure;
}

const OwnerPinBodySchema = v.strictObject({ pin: OwnerPinSchema });

const DrawerNameBodySchema = v.strictObject({ name: DrawerSchema.entries.name });

const DrawerChangeBodySchema = v.strictObject({
  name: v.optional(DrawerSchema.entries.name),
  questions: v.optional(DrawerSchema.entries.questions),
});

const BooksBodySchema = v.strictObject({
  books: v.pipe(v.array(BookInputSchema), v.minLength(1)),
});

const OwnerUnlockSchema = v.strictObject({
  token: v.string(),
  expiresAt: v.string(),
});

const OwnerCheckSchema = v.strictObject({ ok: v.literal(true) });

const OwnerErrorSchema = v.strictObject({ code: v.string() });

const toPublishCheckDto = (check: PublishCheck) => ({
  canPublish: check.canPublish,
  failures: check.failures.map(({ code, drawers }) => ({ code, drawers: [...drawers] })),
  warnings: check.warnings.map(({ code, drawers }) => ({ code, drawers: [...drawers] })),
});

/** 없는 서랍·책은 404로 바꾸고, 그 밖의 오류는 그대로 던져 실패 로그에 남긴다. */
const notFound = (error: unknown) => {
  if (error instanceof DrawerNotFoundError) return { code: "DRAWER_NOT_FOUND" } as const;
  if (error instanceof BookNotFoundError) return { code: "BOOK_NOT_FOUND" } as const;
  throw error;
};

/**
 * 서버 앱. 저장소·시각·인증 같은 의존성은 인자로 받아, 테스트가 메모리 구현과 고정 시각을 주입할 수 있게 한다.
 * 손님 API는 로그인 없이, `/api/admin/*`은 운영자 세션으로, `/api/owner/*` 확인은 주인 토큰으로 감싼다.
 * 이벤트 API는 요청 헤더를 읽지 않는다(I-12).
 */
export function createApp({
  now,
  drawerStore,
  publishedVersionStore,
  eventStore,
  auth,
  ownerAccessStore,
  handoverStore,
  newId,
  newOwnerPin,
  logFailure,
}: AppDeps) {
  return new Elysia({ prefix: "/api" })
    .onError(({ code, error, request }) => {
      // 요청 본문·경로가 틀린 것은 손님·운영자의 실수라 남기지 않는다. 응답 스키마가 어긋난 것은 서버 탓이다.
      if (code === "NOT_FOUND" || code === "PARSE") return;
      if (code === "VALIDATION" && error.type !== "response") return;
      const { pathname } = new URL(request.url);
      logFailure({ stage: "요청 처리", detail: `${request.method} ${pathname}`, error });
    })
    .mount(auth.handler)
    .use(createAuthGuard(auth))
    .use(createOwnerGuard(ownerAccessStore, now))
    .get("/health", () => checkHealth({ now }), {
      response: HealthSchema,
    })
    .get("/kiosk/current", async () => toKioskCurrentDto(await publishedVersionStore.current()), {
      response: KioskCurrentSchema,
    })
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
      async () => ({ pin: await generateOwnerPin(ownerAccessStore, newOwnerPin) }),
      { auth: true, response: OwnerPinResultSchema },
    )
    .get("/admin/drawers", async () => (await drawerStore.list()).map(toDrawerDto), {
      auth: true,
      response: AdminDrawersSchema,
    })
    .post(
      "/admin/drawers",
      async ({ body, status }) =>
        status(201, toDrawerDto(await createDrawer(drawerStore, body.name, newId()))),
      { auth: true, body: DrawerNameBodySchema, response: { 201: DrawerSchema } },
    )
    .patch(
      "/admin/drawers/:id",
      async ({ params, body, status }) => {
        try {
          return toDrawerDto(await updateDrawer(drawerStore, params.id, body));
        } catch (error) {
          return status(404, notFound(error));
        }
      },
      {
        auth: true,
        body: DrawerChangeBodySchema,
        response: { 200: DrawerSchema, 404: AdminErrorSchema },
      },
    )
    .delete(
      "/admin/drawers/:id",
      async ({ params, status }) => {
        try {
          await drawerStore.remove(params.id);
          return new Response(null, { status: 204 });
        } catch (error) {
          return status(404, notFound(error));
        }
      },
      { auth: true, response: { 404: AdminErrorSchema } },
    )
    .post(
      "/admin/drawers/:id/books",
      async ({ params, body, status }) => {
        try {
          return status(
            201,
            toDrawerDto(await addBooks(drawerStore, params.id, body.books, newId)),
          );
        } catch (error) {
          return status(404, notFound(error));
        }
      },
      {
        auth: true,
        body: BooksBodySchema,
        response: { 201: DrawerSchema, 404: AdminErrorSchema },
      },
    )
    .put(
      "/admin/drawers/:id/books/:bookId",
      async ({ params, body, status }) => {
        try {
          return toDrawerDto(await updateBook(drawerStore, params.id, params.bookId, body));
        } catch (error) {
          return status(404, notFound(error));
        }
      },
      {
        auth: true,
        body: BookInputSchema,
        response: { 200: DrawerSchema, 404: AdminErrorSchema },
      },
    )
    .delete(
      "/admin/drawers/:id/books/:bookId",
      async ({ params, status }) => {
        try {
          return toDrawerDto(await drawerStore.removeBook(params.id, params.bookId));
        } catch (error) {
          return status(404, notFound(error));
        }
      },
      { auth: true, response: { 200: DrawerSchema, 404: AdminErrorSchema } },
    )
    .get(
      "/admin/publish-check",
      async () => toPublishCheckDto(checkPublish(await drawerStore.list())),
      { auth: true, response: PublishCheckSchema },
    )
    .post(
      "/admin/publish",
      async ({ status }) => {
        try {
          const { version } = await publish(drawerStore, publishedVersionStore);
          return status(201, { version });
        } catch (error) {
          if (!(error instanceof PublishBlockedError)) throw error;
          return status(422, {
            code: "PUBLISH_BLOCKED" as const,
            check: toPublishCheckDto(error.check),
          });
        }
      },
      {
        auth: true,
        response: {
          201: v.strictObject({ version: PublishedVersionSummarySchema.entries.version }),
          422: PublishBlockedSchema,
        },
      },
    )
    .get(
      "/admin/published-versions",
      async () =>
        (await publishedVersionStore.list()).map(({ version, questionSet }) => ({
          version,
          drawerCount: questionSet.drawers.length,
          questionCount: questionSet.questions.length,
        })),
      { auth: true, response: v.array(PublishedVersionSummarySchema) },
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
    })
    .post(
      "/owner/handover",
      async ({ body, status }) => {
        const record = await recordHandover(handoverStore, body);
        return status(201, toHandoverRecordDto(record));
      },
      {
        ownerToken: true,
        body: HandoverInputSchema,
        response: { 201: HandoverRecordSchema },
      },
    );
}

export type App = ReturnType<typeof createApp>;
