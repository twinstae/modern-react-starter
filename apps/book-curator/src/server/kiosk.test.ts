import { describe, expect, it } from "vite-plus/test";

import {
  parseQuestionSet,
  toQuestionSetDto,
  type QuestionSet,
} from "../domain/question-set.ts";
import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { createMemoryPublishedQuestionSetStore } from "../persistence/memory-published-question-set-store.ts";
import { unwrap } from "../unwrap.ts";
import { createTestClient } from "./test-client.ts";

const changedFirstQuestion = (set: QuestionSet): QuestionSet =>
  parseQuestionSet({
    ...toQuestionSetDto(set),
    questions: set.questions.map((question, index) =>
      index === 0 && question.type === "item"
        ? { ...question, text: "[가정] 새 버전의 첫 문항" }
        : question,
    ),
  });

describe("키오스크 공개 묶음 API", () => {
  it("공개 버전이 없으면 준비 중이라고 답한다", async () => {
    const client = createTestClient();

    expect(await unwrap(client.kiosk.current.get())).toStrictEqual({ status: "preparing" });
  });

  it("공개 버전이 있으면 버전과 질문 세트를 묶어 준다", async () => {
    const store = createMemoryPublishedQuestionSetStore();
    await store.publish(SEED_QUESTION_SET);
    const client = createTestClient({ publishedQuestionSetStore: store });

    const bundle = await unwrap(client.kiosk.current.get());
    expect(bundle.status).toBe("ready");
    if (bundle.status !== "ready") throw new Error("준비된 묶음이어야 합니다");

    expect(bundle.version).toBe(1);
    expect(bundle.questionSet.questions).toHaveLength(SEED_QUESTION_SET.questions.length);
    expect(bundle.questionSet.drawers.map(({ code }) => code)).toStrictEqual(
      SEED_QUESTION_SET.drawers.map(({ code }) => code),
    );
  });

  it("묶음에는 관리자용 기준 응답과 주인용 서랍 표시가 없다", async () => {
    const store = createMemoryPublishedQuestionSetStore();
    await store.publish(SEED_QUESTION_SET);
    const client = createTestClient({ publishedQuestionSetStore: store });

    const bundle = await unwrap(client.kiosk.current.get());
    if (bundle.status !== "ready") throw new Error("준비된 묶음이어야 합니다");

    expect("baselines" in bundle.questionSet).toBe(false);
    expect(bundle.questionSet.drawers.every((drawer) => !("mark" in drawer))).toBe(true);
  });

  it("새 버전을 공개해도 이전 공개 행은 그대로다(I-11)", async () => {
    const store = createMemoryPublishedQuestionSetStore();
    const first = await store.publish(SEED_QUESTION_SET);
    const client = createTestClient({ publishedQuestionSetStore: store });

    const second = await store.publish(changedFirstQuestion(SEED_QUESTION_SET));
    const bundle = await unwrap(client.kiosk.current.get());

    expect(bundle.status).toBe("ready");
    if (bundle.status !== "ready") throw new Error("준비된 묶음이어야 합니다");
    expect(bundle.version).toBe(second.version);
    expect(await store.get(first.version)).toStrictEqual(first);
  });
});
