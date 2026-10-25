import { Elysia } from "elysia";
import * as v from "valibot";

import { AdminMeSchema, AdminShelfSchema } from "../admin-dto.ts";
import type { EventStore } from "../application/event-store-ports.ts";
import type { OwnerAccessStore } from "../application/owner-access-ports.ts";
import type { PublishedQuestionSetStore } from "../application/published-question-set-ports.ts";
import { checkHealth } from "../application/check-health.ts";
import { setOwnerPin, unlockOwner } from "../application/owner-access.ts";
import {
  BookNotFoundError,
  createBook,
  listBooks,
  NoPublishedQuestionSetError,
  putDrawerBook,
  readShelf,
  removeDrawerBook,
  updateBook,
} from "../application/shelf-admin.ts";
import type { BookStore, DrawerStockStore } from "../application/shelf-ports.ts";
import { BookInputSchema, BookSchema, toBookDto } from "../domain/book.ts";
import { FunnelEventBatchSchema } from "../domain/funnel.ts";
import { HealthSchema } from "../domain/health.ts";
import { KioskCurrentSchema, toKioskCurrentDto } from "../domain/kiosk.ts";
import { OwnerPinSchema } from "../domain/owner-pin.ts";
import { DrawerCodeSchema } from "../domain/question-set.ts";
import { DrawerQuantitySchema } from "../domain/shelf.ts";
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
  /** 서가의 책 저장소. */
  bookStore: BookStore;
  /** 서랍 속 책과 수량 저장소. */
  stockStore: DrawerStockStore;
  /** 새 책 id를 만든다. 테스트는 고정 id 생성기를 넣는다. */
  newBookId: () => string;
}

const OwnerPinBodySchema = v.strictObject({ pin: OwnerPinSchema });

const DrawerQuantityBodySchema = v.strictObject({ quantity: DrawerQuantitySchema });

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
  bookStore,
  stockStore,
  newBookId,
}: AppDeps) {
  const shelfSource = async () => ({
    stock: await stockStore.list(),
    books: await bookStore.list(),
  });

  return new Elysia({ prefix: "/api" })
    .mount(auth.handler)
    .use(createAuthGuard(auth))
    .use(createOwnerGuard(ownerAccessStore, now))
    .get("/health", () => checkHealth({ now }), {
      response: HealthSchema,
    })
    .get(
      "/kiosk/current",
      async () => toKioskCurrentDto(await publishedQuestionSetStore.current(), await shelfSource()),
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
    .get("/admin/books", async () => (await listBooks(bookStore)).map(toBookDto), {
      auth: true,
      response: v.array(BookSchema),
    })
    .post(
      "/admin/books",
      async ({ body, status }) =>
        status(201, toBookDto(await createBook(bookStore, body, newBookId()))),
      { auth: true, body: BookInputSchema, response: { 201: BookSchema } },
    )
    .put(
      "/admin/books/:id",
      async ({ params, body, status }) => {
        try {
          return toBookDto(await updateBook(bookStore, params.id, body));
        } catch (error) {
          if (error instanceof BookNotFoundError) return status(404, { code: "BOOK_NOT_FOUND" });
          throw error;
        }
      },
      {
        auth: true,
        body: BookInputSchema,
        response: { 200: BookSchema, 404: OwnerErrorSchema },
      },
    )
    .get(
      "/admin/shelf",
      async ({ status }) => {
        try {
          const shelf = await readShelf(bookStore, stockStore, publishedQuestionSetStore);
          return {
            drawers: shelf.drawers.map(({ code, name, mark }) => ({ code, name, mark })),
            books: shelf.books.map(toBookDto),
            stock: [...shelf.stock],
            gate: shelf.gate,
          };
        } catch (error) {
          if (error instanceof NoPublishedQuestionSetError) {
            return status(409, { code: "NO_PUBLISHED_QUESTION_SET" });
          }
          throw error;
        }
      },
      {
        auth: true,
        response: { 200: AdminShelfSchema, 409: OwnerErrorSchema },
      },
    )
    .put(
      "/admin/drawers/:drawer/books/:bookId",
      async ({ params, body, status }) => {
        const drawer = v.safeParse(DrawerCodeSchema, params.drawer);
        if (!drawer.success) return status(404, { code: "UNKNOWN_DRAWER" });

        try {
          await putDrawerBook(bookStore, stockStore, drawer.output, params.bookId, body.quantity);
        } catch (error) {
          if (error instanceof BookNotFoundError) return status(404, { code: "BOOK_NOT_FOUND" });
          throw error;
        }
        return new Response(null, { status: 204 });
      },
      {
        auth: true,
        body: DrawerQuantityBodySchema,
        response: { 404: OwnerErrorSchema },
      },
    )
    .delete(
      "/admin/drawers/:drawer/books/:bookId",
      async ({ params, status }) => {
        const drawer = v.safeParse(DrawerCodeSchema, params.drawer);
        if (!drawer.success) return status(404, { code: "UNKNOWN_DRAWER" });

        try {
          await removeDrawerBook(bookStore, stockStore, drawer.output, params.bookId);
        } catch (error) {
          if (error instanceof BookNotFoundError) return status(404, { code: "BOOK_NOT_FOUND" });
          throw error;
        }
        return new Response(null, { status: 204 });
      },
      { auth: true, response: { 404: OwnerErrorSchema } },
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
