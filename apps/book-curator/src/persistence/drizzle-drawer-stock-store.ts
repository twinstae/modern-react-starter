import { and, asc, eq } from "drizzle-orm";

import type { DrawerStockStore } from "../application/shelf-ports.ts";
import { parseDrawerStockEntry, type DrawerStockEntry } from "../domain/shelf.ts";
import type { Database } from "./database.ts";
import { drawerStock } from "./schema.ts";

type StockRow = typeof drawerStock.$inferSelect;

const toDomain = (row: StockRow): DrawerStockEntry => parseDrawerStockEntry(row);

export function createDrizzleDrawerStockStore(db: Database): DrawerStockStore {
  return {
    async list() {
      const rows = await db
        .select()
        .from(drawerStock)
        .orderBy(asc(drawerStock.drawer), asc(drawerStock.bookId));
      return rows.map(toDomain);
    },
    async setQuantity(drawer, bookId, quantity) {
      const entry = parseDrawerStockEntry({ drawer, bookId, quantity });
      await db
        .insert(drawerStock)
        .values(entry)
        .onConflictDoUpdate({
          target: [drawerStock.drawer, drawerStock.bookId],
          set: { quantity: entry.quantity },
        });
    },
    async remove(drawer, bookId) {
      await db
        .delete(drawerStock)
        .where(and(eq(drawerStock.drawer, drawer), eq(drawerStock.bookId, bookId)));
    },
  };
}
