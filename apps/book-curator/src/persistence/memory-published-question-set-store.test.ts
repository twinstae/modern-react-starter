import { createMemoryPublishedQuestionSetStore } from "./memory-published-question-set-store.ts";
import { publishedQuestionSetStoreContract } from "./published-question-set-store.contract.ts";

publishedQuestionSetStoreContract("메모리", async () => createMemoryPublishedQuestionSetStore());
