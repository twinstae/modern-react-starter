import { createMemoryBookStore, createMemoryDrawerStockStore } from "./memory-shelf-store.ts";
import { shelfStoreContract } from "./shelf-store.contract.ts";

shelfStoreContract("메모리", async () => ({
  books: createMemoryBookStore(),
  stock: createMemoryDrawerStockStore(),
}));
