import { describe } from "vite-plus/test";

import { createMemoryQuestionSetDraftStore } from "./memory-question-set-draft-store.ts";
import { questionSetDraftStoreContract } from "./question-set-draft-store.contract.ts";

describe("메모리 질문 세트 초안", () => {
  questionSetDraftStoreContract("메모리", async () => createMemoryQuestionSetDraftStore());
});
