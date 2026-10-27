import { and, asc, eq, inArray } from "drizzle-orm";

import {
  BookNotFoundError,
  DrawerNotFoundError,
  type DrawerStore,
} from "../application/drawer-ports.ts";
import { parseDrawer, type Drawer } from "../domain/drawer.ts";
import type { Database } from "./database.ts";
import { drawerBooks, drawers } from "./schema.ts";

/** 서랍과 책을 Postgres에 둔다. 읽을 때 행을 도메인 서랍으로 파싱한다. */
export function createDrizzleDrawerStore(db: Database): DrawerStore {
  const read = async (ids?: readonly string[]): Promise<Drawer[]> => {
    const drawerRows = await db
      .select()
      .from(drawers)
      .where(ids === undefined ? undefined : inArray(drawers.id, [...ids]))
      .orderBy(asc(drawers.position));
    if (drawerRows.length === 0) return [];
    const bookRows = await db
      .select()
      .from(drawerBooks)
      .where(
        inArray(
          drawerBooks.drawerId,
          drawerRows.map(({ id }) => id),
        ),
      )
      .orderBy(asc(drawerBooks.position));
    return drawerRows.map(({ id, name, questions }) =>
      parseDrawer({
        id,
        name,
        questions,
        books: bookRows
          .filter(({ drawerId }) => drawerId === id)
          .map(({ id: bookId, title, author, publisher }) => ({
            id: bookId,
            title,
            author,
            publisher,
          })),
      }),
    );
  };

  const get = async (id: string): Promise<Drawer> => {
    const [drawer] = await read([id]);
    if (drawer === undefined) throw new DrawerNotFoundError(id);
    return drawer;
  };

  return {
    list: () => read(),
    async create({ id, name }) {
      await db.insert(drawers).values({ id, name, questions: [] });
      return get(id);
    },
    async update(id, { name, questions }) {
      const updated = await db
        .update(drawers)
        .set({
          ...(name === undefined ? {} : { name }),
          ...(questions === undefined ? {} : { questions: [...questions] }),
        })
        .where(eq(drawers.id, id))
        .returning({ id: drawers.id });
      if (updated.length === 0) throw new DrawerNotFoundError(id);
      return get(id);
    },
    async remove(id) {
      const removed = await db
        .delete(drawers)
        .where(eq(drawers.id, id))
        .returning({ id: drawers.id });
      if (removed.length === 0) throw new DrawerNotFoundError(id);
    },
    async addBooks(drawerId, books) {
      await get(drawerId);
      if (books.length > 0) {
        await db.insert(drawerBooks).values(books.map((book) => ({ ...book, drawerId })));
      }
      return get(drawerId);
    },
    async updateBook(drawerId, bookId, { title, author, publisher }) {
      const updated = await db
        .update(drawerBooks)
        .set({ title, author, publisher })
        .where(and(eq(drawerBooks.drawerId, drawerId), eq(drawerBooks.id, bookId)))
        .returning({ id: drawerBooks.id });
      if (updated.length === 0) throw new BookNotFoundError(bookId);
      return get(drawerId);
    },
    async removeBook(drawerId, bookId) {
      const removed = await db
        .delete(drawerBooks)
        .where(and(eq(drawerBooks.drawerId, drawerId), eq(drawerBooks.id, bookId)))
        .returning({ id: drawerBooks.id });
      if (removed.length === 0) throw new BookNotFoundError(bookId);
      return get(drawerId);
    },
  };
}
