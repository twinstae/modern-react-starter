import { adminAccessStoreContract } from "./admin-access-store.contract.ts";
import { createMemoryAdminAccessStore } from "./memory-admin-access-store.ts";

adminAccessStoreContract("메모리", async () => createMemoryAdminAccessStore());
