import { asc, eq } from "drizzle-orm";

import type { BookStore } from "../application/shelf-ports.ts";
import { parseBook, type Book } from "../domain/book.ts";
import type { Database } from "./database.ts";
import { books } from "./schema.ts";

type BookRow = typeof books.$inferSelect;

const toDomain = (row: BookRow): Book => parseBook(row);

const toRow = (book: Book): typeof books.$inferInsert => ({
  id: book.id,
  title: book.title,
  author: book.author,
  relevance: book.relevance,
  keywords: book.keywords,
  reason: book.reason,
  question: book.question,
});

export function createDrizzleBookStore(db: Database): BookStore {
  return {
    async list() {
      const rows = await db.select().from(books).orderBy(asc(books.id));
      return rows.map(toDomain);
    },
    async get(id) {
      const [row] = await db.select().from(books).where(eq(books.id, id));
      return row === undefined ? null : toDomain(row);
    },
    async save(book) {
      const row = toRow(book);
      await db
        .insert(books)
        .values(row)
        .onConflictDoUpdate({
          target: books.id,
          set: {
            title: row.title,
            author: row.author,
            relevance: row.relevance,
            keywords: row.keywords,
            reason: row.reason,
            question: row.question,
          },
        });
    },
  };
}
