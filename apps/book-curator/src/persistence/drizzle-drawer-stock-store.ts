import { and, asc, eq, sql } from "drizzle-orm";

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
    async decrease(drawer, bookId, by) {
      if (!Number.isInteger(by) || by < 1) {
        throw new Error("줄일 수량은 1 이상의 정수여야 합니다");
      }
      const [row] = await db
        .update(drawerStock)
        .set({ quantity: sql`greatest(${drawerStock.quantity} - ${by}, 0)` })
        .where(and(eq(drawerStock.drawer, drawer), eq(drawerStock.bookId, bookId)))
        .returning({ quantity: drawerStock.quantity });
      return row?.quantity ?? 0;
    },
    async remove(drawer, bookId) {
      await db
        .delete(drawerStock)
        .where(and(eq(drawerStock.drawer, drawer), eq(drawerStock.bookId, bookId)));
    },
  };
}
