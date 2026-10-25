import { describe } from "vite-plus/test";

import { createMemoryOwnerAccessStore } from "./memory-owner-access-store.ts";
import { ownerAccessStoreContract } from "./owner-access-store.contract.ts";

describe("메모리 주인 잠금 저장소", () => {
  ownerAccessStoreContract(async () => createMemoryOwnerAccessStore());
});
