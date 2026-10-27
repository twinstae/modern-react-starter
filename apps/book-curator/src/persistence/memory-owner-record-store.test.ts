import { createMemoryHandoverStore } from "./memory-owner-record-store.ts";
import { ownerRecordStoreContract } from "./owner-record-store.contract.ts";

ownerRecordStoreContract("메모리", async () => ({ handovers: createMemoryHandoverStore() }));
