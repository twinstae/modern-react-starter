import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

import type { BookRelevance } from "../domain/book.ts";
import type { DrawerCode } from "../domain/question-set.ts";

/** 책. 서랍별 관련도와 핵심 단어는 모양이 고정된 JSON으로 저장한다. */
export const books = pgTable("books", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  relevance: jsonb("relevance").$type<BookRelevance>().notNull(),
  keywords: jsonb("keywords").$type<string[]>().notNull(),
  reason: text("reason").notNull(),
  question: text("question").notNull(),
});

/** 서랍 하나에 든 책과 수량. 같은 책을 여러 서랍에 둘 수 있다. */
export const drawerStock = pgTable(
  "drawer_stock",
  {
    drawer: text("drawer").$type<DrawerCode>().notNull(),
    bookId: text("book_id").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.drawer, table.bookId] }),
    check("drawer_stock_quantity_non_negative", sql`${table.quantity} >= 0`),
  ],
);
