import { drawerStoreContract } from "./drawer-store.contract.ts";
import { createMemoryDrawerStore } from "./memory-drawer-store.ts";
import { createMemoryPublishedVersionStore } from "./memory-published-version-store.ts";
import { publishedVersionStoreContract } from "./published-version-store.contract.ts";

drawerStoreContract("메모리", async () => createMemoryDrawerStore());
publishedVersionStoreContract("메모리", async () => createMemoryPublishedVersionStore());
