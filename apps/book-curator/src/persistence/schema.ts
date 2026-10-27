import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import type { FunnelEventPayload, FunnelEventType } from "../domain/funnel.ts";
import type { PublishedSnapshot } from "../domain/kiosk.ts";
import type { DrawerId } from "../domain/question-set.ts";

// better-auth 표도 같은 마이그레이션에 들어가도록 여기서 다시 내보낸다.
export * from "./auth-schema.ts";

/**
 * 서랍. `position`은 만든 순서이고 운영 화면 순서이자 동점 규칙의 순서다.
 * 문항은 순서 있는 문장 목록이라 통째로 읽고 쓴다.
 */
export const drawers = pgTable("drawers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  position: serial("position").notNull(),
  questions: jsonb("questions").$type<string[]>().notNull(),
});

/** 서랍에 든 책. 한 책은 한 서랍에만 들고, 서랍을 지우면 함께 지워진다. */
export const drawerBooks = pgTable("drawer_books", {
  id: text("id").primaryKey(),
  drawerId: text("drawer_id")
    .notNull()
    .references(() => drawers.id, { onDelete: "cascade" }),
  position: serial("position").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  publisher: text("publisher").notNull(),
});

/**
 * 공개 버전. 공개하는 순간의 질문 세트와 서랍 속 책을 통째로 얼린다(I-11).
 * 가장 큰 버전이 손님에게 나간다. 버전 번호는 예전 표의 번호 뒤를 잇는다.
 */
export const publishedVersions = pgTable(
  "published_versions",
  {
    version: integer("version").primaryKey(),
    snapshot: jsonb("snapshot").$type<PublishedSnapshot>().notNull(),
  },
  (table) => [check("published_versions_version_positive", sql`${table.version} > 0`)],
);

// 아래 books·drawer_stock·question_set_drafts·published_question_sets·purchases 표는
// 서랍별 관련도·수량·초안이 있던 예전 모델의 것이다. 운영 기록을 지우지 않으려 남기고,
// 앱은 더 쓰지 않는다. 예전 공개 버전 번호만 새 버전 번호가 겹치지 않게 읽는다.

/** 예전 모델의 책. */
export const books = pgTable("books", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  relevance: jsonb("relevance").notNull(),
  keywords: jsonb("keywords").$type<string[]>().notNull(),
  reason: text("reason").notNull(),
  question: text("question").notNull(),
});

/**
 * 공개된 질문 세트 한 버전. 버전 번호가 기본 키이고 본문은 통째로 읽고 쓴다.
 * 공개한 행은 고치지 않고 새 버전을 더한다(I-11).
 */
export const publishedQuestionSets = pgTable(
  "published_question_sets",
  {
    version: integer("version").primaryKey(),
    questionSet: jsonb("question_set").notNull(),
  },
  (table) => [check("published_question_sets_version_positive", sql`${table.version} > 0`)],
);

/** 지금 손님에게 보여 주는 공개 버전을 가리키는 한 줄. */
export const publishedQuestionSetPointer = pgTable("published_question_set_pointer", {
  id: text("id").primaryKey(),
  version: integer("version").notNull(),
});

/**
 * 아직 공개하지 않은 질문 세트 초안. 공개 버전과 달리 고칠 수 있다.
 * 본문은 통째로 읽고 쓰는 jsonb다.
 */
export const questionSetDrafts = pgTable("question_set_drafts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  questionSet: jsonb("question_set").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** 서랍 하나에 든 책과 수량. 같은 책을 여러 서랍에 둘 수 있다. */
export const drawerStock = pgTable(
  "drawer_stock",
  {
    drawer: text("drawer").$type<DrawerId>().notNull(),
    bookId: text("book_id").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.drawer, table.bookId] }),
    check("drawer_stock_quantity_non_negative", sql`${table.quantity} >= 0`),
  ],
);

/**
 * 퍼널 이벤트. 추가 전용이고 id가 들어온 순서를 지킨다. 공통 필드는 열로, 이벤트별
 * 필드는 payload jsonb로 나눈다. 별명·이름·연락처·IP·User-Agent 열은 없다(I-12).
 */
export const funnelEvents = pgTable(
  "funnel_events",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    kioskName: text("kiosk_name").notNull(),
    version: integer("version").notNull(),
    type: text("type").$type<FunnelEventType>().notNull(),
    payload: jsonb("payload").$type<FunnelEventPayload>().notNull(),
  },
  (table) => [check("funnel_events_version_positive", sql`${table.version} > 0`)],
);

/**
 * 주인 PIN과 연속 실패 상태를 담는 한 줄. PIN은 해시만 둔다.
 * 시각은 애플리케이션이 주입한 ISO 문자열 그대로 비교할 수 있게 문자열로 읽는다.
 */
export const ownerAccess = pgTable(
  "owner_access",
  {
    id: text("id").primaryKey(),
    pinHash: text("pin_hash").notNull(),
    failedAttempts: integer("failed_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    check("owner_access_failed_attempts_non_negative", sql`${table.failedAttempts} >= 0`),
  ],
);

/** 주인 토큰의 해시와 만료 시각. 원문 토큰은 저장하지 않는다. */
export const ownerTokens = pgTable("owner_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
});

/**
 * 주인이 실제로 건넨 서랍의 기록. 추가 전용이고, 추천 서랍과 건넨 서랍을 함께 남긴다(R-7).
 * 별명·이름 열은 없다(I-12). 버전은 필수다(I-16).
 */
export const handovers = pgTable(
  "handovers",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    version: integer("version").notNull(),
    recommended: text("recommended").$type<DrawerId>().notNull(),
    handed: text("handed").$type<DrawerId>().notNull(),
  },
  (table) => [check("handovers_version_positive", sql`${table.version} > 0`)],
);

/** 주인이 기록한 산 책. 추가 전용이고 서랍 속 수량과 별개로 정답을 남긴다. */
export const purchases = pgTable(
  "purchases",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    version: integer("version").notNull(),
    drawer: text("drawer").$type<DrawerId>().notNull(),
    bookId: text("book_id").notNull(),
  },
  (table) => [check("purchases_version_positive", sql`${table.version} > 0`)],
);
