import { describe, expect, it } from "vite-plus/test";

import { createApiClient } from "../api-client.ts";
import type { QuestionSetDraftDto } from "../admin-dto.ts";
import { parseKioskCurrent } from "../domain/kiosk.ts";
import { parseBook, type Book, type BookRelevance } from "../domain/book.ts";
import { parseFunnelEvent } from "../domain/funnel.ts";
import {
  DRAWER_CODES,
  parseQuestionSet,
  toQuestionSetDto,
  type DrawerCode,
  type QuestionSet,
} from "../domain/question-set.ts";
import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { parseDrawerStock, type DrawerStockEntry } from "../domain/shelf.ts";
import { answer, back, startTurn } from "../domain/turn.ts";
import { createMemoryEventStore } from "../persistence/memory-event-store.ts";
import { createMemoryPublishedQuestionSetStore } from "../persistence/memory-published-question-set-store.ts";
import {
  createMemoryBookStore,
  createMemoryDrawerStockStore,
} from "../persistence/memory-shelf-store.ts";
import { unwrap } from "../unwrap.ts";
import { createTestServer, signInOperator, TEST_NOW } from "./test-client.ts";

const relevanceFor = (main: DrawerCode): BookRelevance => ({
  B1: main === "B1" ? 5 : 1,
  B2: main === "B2" ? 5 : 1,
  B3: main === "B3" ? 5 : 1,
  B4: main === "B4" ? 5 : 1,
  B5: main === "B5" ? 5 : 1,
  B6: main === "B6" ? 5 : 1,
  B7: main === "B7" ? 5 : 1,
});

const bookFor = (drawer: DrawerCode, index: number): Book =>
  parseBook({
    id: `book-${drawer}-${index}`,
    title: `${drawer} 책 ${index}`,
    author: "테스트 저자",
    relevance: relevanceFor(drawer),
    keywords: [`${drawer}-${index}`],
    reason: "이 서랍에 어울리는 이유",
    question: "함께 생각해 볼 질문",
  });

/** 모든 서랍에 3종씩 있는 서가. 공개 게이트를 통과한다(I-7). */
function fullShelf(): { books: Book[]; stock: DrawerStockEntry[] } {
  const books = DRAWER_CODES.flatMap((drawer) => [1, 2, 3].map((index) => bookFor(drawer, index)));
  const stock = parseDrawerStock(
    books.map((book) => ({
      drawer: book.id.split("-")[1] as DrawerCode,
      bookId: book.id,
      quantity: 1,
    })),
  );
  return { books, stock };
}

const changedFirstQuestion = (set: QuestionSet): QuestionSet =>
  parseQuestionSet({
    ...toQuestionSetDto(set),
    questions: set.questions.map((question, index) =>
      index === 0 && question.type === "item" ? { ...question, text: "고친 첫 문항" } : question,
    ),
  });

async function signedInServer(options: { published?: boolean; shelf?: "full" | "empty" } = {}) {
  const publishedStore = createMemoryPublishedQuestionSetStore();
  if (options.published !== false) await publishedStore.publish(SEED_QUESTION_SET);
  const eventStore = createMemoryEventStore();
  const shelf = options.shelf === "full" ? fullShelf() : { books: [], stock: [] };

  const server = createTestServer({
    publishedQuestionSetStore: publishedStore,
    eventStore,
    bookStore: createMemoryBookStore(shelf.books),
    stockStore: createMemoryDrawerStockStore(shelf.stock),
  });
  const cookie = await signInOperator(server.auth);
  const admin = createApiClient(server.app, { headers: { cookie } });

  return { ...server, admin, cookie, publishedStore, eventStore };
}

const draftOf = async (
  admin: ReturnType<typeof createApiClient>,
  id: string,
): Promise<QuestionSetDraftDto> => unwrap(admin.admin["question-sets"].drafts({ id }).get());

describe("운영자 질문 세트 API", () => {
  it("로그인하지 않으면 초안 API가 401이다", async () => {
    const { api } = createTestServer();

    expect((await api.admin["question-sets"].drafts.get()).status).toBe(401);
    expect((await api.admin["question-sets"].drafts.post({ name: "초안" })).status).toBe(401);
    expect((await api.admin["question-sets"].versions.get()).status).toBe(401);
  });

  it("공개 버전이 없으면 복제는 409, 시드로 만든 초안은 목록과 단건에서 같다", async () => {
    const { admin } = await signedInServer({ published: false });

    const clone = await admin.admin["question-sets"].drafts["from-published"].post();
    expect(clone.status).toBe(409);
    expect(clone.error?.value).toStrictEqual({ code: "NO_PUBLISHED_QUESTION_SET" });

    const created = await unwrap(
      admin.admin["question-sets"].drafts.post({ name: "새 질문 세트" }),
    );
    expect(created.name).toBe("새 질문 세트");
    expect(created.questionSet).toStrictEqual(toQuestionSetDto(SEED_QUESTION_SET));
    expect(created.createdAt).toBe(TEST_NOW);
    expect(created.updatedAt).toBe(TEST_NOW);

    expect(await unwrap(admin.admin["question-sets"].drafts.get())).toStrictEqual([
      {
        id: created.id,
        name: "새 질문 세트",
        questionCount: SEED_QUESTION_SET.questions.length,
        updatedAt: TEST_NOW,
      },
    ]);
    expect(await draftOf(admin, created.id)).toStrictEqual(created);
  });

  it("공개 버전을 복제한 초안을 고쳐 저장하고 다시 불러오면 같다", async () => {
    const { admin } = await signedInServer();

    const cloned = await unwrap(admin.admin["question-sets"].drafts["from-published"].post());
    expect(cloned.name).toBe("공개 버전 1 복제");
    expect(cloned.questionSet).toStrictEqual(toQuestionSetDto(SEED_QUESTION_SET));

    const changed = changedFirstQuestion(SEED_QUESTION_SET);
    const saved = await unwrap(
      admin.admin["question-sets"].drafts({ id: cloned.id }).put({
        name: "고친 질문 세트",
        questionSet: toQuestionSetDto(changed),
      }),
    );
    expect(saved.name).toBe("고친 질문 세트");
    expect(saved.id).toBe(cloned.id);
    expect(saved.createdAt).toBe(cloned.createdAt);

    expect(await draftOf(admin, cloned.id)).toStrictEqual(saved);
  });

  it("엄격하게 파싱하지 못하는 질문 세트는 만들지도 고치지도 않는다", async () => {
    const { admin } = await signedInServer();
    const created = await unwrap(admin.admin["question-sets"].drafts.post({ name: "초안" }));
    const invalid = { drawers: [], questions: [], scoring: { type: "item-mean" } };

    const create = await admin.admin["question-sets"].drafts.post({
      name: "잘못된 초안",
      questionSet: invalid,
    });
    expect(create.status).toBe(422);
    expect(create.error?.value).toStrictEqual({ code: "INVALID_QUESTION_SET" });

    const update = await admin.admin["question-sets"].drafts({ id: created.id }).put({
      questionSet: invalid,
    });
    expect(update.status).toBe(422);
    expect(await draftOf(admin, created.id)).toStrictEqual(created);

    const unknown = await admin.admin["question-sets"].drafts.post({
      name: "모르는 필드",
      questionSet: { ...toQuestionSetDto(SEED_QUESTION_SET), draft: true },
    });
    expect(unknown.status).toBe(422);
  });

  it("점검을 통과하지 못하면 공개를 거부하고 이유 코드를 돌려준다", async () => {
    const { admin, publishedStore } = await signedInServer({ shelf: "full" });
    const cloned = await unwrap(admin.admin["question-sets"].drafts["from-published"].post());
    const baseline = cloned.questionSet.baselines[0];
    if (baseline === undefined) throw new Error("시드 기준 응답이 있어야 합니다");

    await unwrap(
      admin.admin["question-sets"].drafts({ id: cloned.id }).put({
        name: cloned.name,
        questionSet: {
          ...cloned.questionSet,
          baselines: [{ ...baseline, expected: { first: "B1", second: "B6" } }],
        },
      }),
    );

    const report = await unwrap(
      admin.admin["question-sets"].drafts({ id: cloned.id }).report.get(),
    );
    expect(report.canPublish).toBe(false);
    expect(report.report.gate.failures).toContainEqual({
      code: "baseline-mismatch",
      drawers: ["B1", "B6"],
      baselines: ["서윤"],
    });
    expect(report.blockers).toContainEqual({
      code: "baseline-mismatch",
      drawers: ["B1", "B6"],
      baselines: ["서윤"],
    });

    const publish = await admin.admin["question-sets"].drafts({ id: cloned.id }).publish.post();
    expect(publish.status).toBe(422);
    expect(publish.error?.value).toMatchObject({ code: "PUBLISH_BLOCKED" });
    expect(publish.error?.value).toMatchObject({
      blockers: [{ code: "baseline-mismatch", drawers: ["B1", "B6"], baselines: ["서윤"] }],
    });
    expect(await publishedStore.current()).toStrictEqual({
      version: 1,
      questionSet: SEED_QUESTION_SET,
    });
  });

  it("서가 게이트를 통과하지 못하면 서랍 이름과 함께 공개를 거부한다", async () => {
    const { admin, publishedStore } = await signedInServer({ shelf: "empty" });
    const cloned = await unwrap(admin.admin["question-sets"].drafts["from-published"].post());

    const report = await unwrap(
      admin.admin["question-sets"].drafts({ id: cloned.id }).report.get(),
    );
    expect(report.report.gate.passed).toBe(true);
    expect(report.shelfGate.passed).toBe(false);
    expect(report.shelfGate.lacking[0]).toStrictEqual({
      drawer: "B6",
      name: "삶의 방식을 바꾸는 책",
      kinds: 0,
    });
    expect(report.canPublish).toBe(false);
    expect(report.blockers).toStrictEqual([
      { code: "shelf-gate", drawers: ["B6", "B1", "B4", "B2", "B7", "B3", "B5"], baselines: [] },
    ]);

    const publish = await admin.admin["question-sets"].drafts({ id: cloned.id }).publish.post();
    expect(publish.status).toBe(422);
    expect(publish.error?.value).toMatchObject({
      code: "PUBLISH_BLOCKED",
      blockers: [{ code: "shelf-gate" }],
    });
    expect((await publishedStore.list()).map(({ version }) => version)).toStrictEqual([1]);
  });

  it("공개하면 새 버전이 생기고 이전 버전은 그대로다(I-11)", async () => {
    const { admin, publishedStore } = await signedInServer({ shelf: "full" });
    const cloned = await unwrap(admin.admin["question-sets"].drafts["from-published"].post());
    const changed = changedFirstQuestion(SEED_QUESTION_SET);
    await unwrap(
      admin.admin["question-sets"].drafts({ id: cloned.id }).put({
        name: cloned.name,
        questionSet: toQuestionSetDto(changed),
      }),
    );

    const published = await unwrap(
      admin.admin["question-sets"].drafts({ id: cloned.id }).publish.post(),
    );
    expect(published.version).toBe(2);

    expect(await publishedStore.get(1)).toStrictEqual({
      version: 1,
      questionSet: SEED_QUESTION_SET,
    });
    expect((await publishedStore.current())?.version).toBe(2);
    expect((await publishedStore.current())?.questionSet).toStrictEqual(changed);

    expect(await unwrap(admin.admin["question-sets"].versions.get())).toStrictEqual([
      { version: 1, drawerCount: 7, questionCount: 14 },
      { version: 2, drawerCount: 7, questionCount: 14 },
    ]);

    const bundle = parseKioskCurrent(await unwrap(admin.kiosk.current.get()));
    if (bundle.status !== "ready") throw new Error("준비된 묶음이어야 합니다");
    expect(bundle.version).toBe(2);
    expect(bundle.questionSet.questions[0]?.text).toBe("고친 첫 문항");
  });

  it("문항 수가 다른 초안도 점검과 게이트를 통과하면 공개되어 키오스크가 그대로 돈다(I-5)", async () => {
    const { admin } = await signedInServer({ shelf: "full" });
    const cloned = await unwrap(admin.admin["question-sets"].drafts["from-published"].post());
    const extended = parseQuestionSet({
      ...toQuestionSetDto(SEED_QUESTION_SET),
      questions: [
        ...SEED_QUESTION_SET.questions,
        { type: "item", drawer: "B4", reversed: false, text: "사회 문제를 자주 이야기한다" },
      ],
      baselines: [],
    });

    await unwrap(
      admin.admin["question-sets"].drafts({ id: cloned.id }).put({
        name: "문항 15개 초안",
        questionSet: toQuestionSetDto(extended),
      }),
    );

    const report = await unwrap(
      admin.admin["question-sets"].drafts({ id: cloned.id }).report.get(),
    );
    expect(report.canPublish).toBe(true);
    expect(report.blockers).toStrictEqual([]);
    expect(report.report.gate.warnings).toContainEqual({
      code: "item-count-imbalance",
      drawers: ["B6", "B1", "B2", "B7", "B3", "B5"],
      baselines: [],
    });

    expect(
      await unwrap(admin.admin["question-sets"].drafts({ id: cloned.id }).publish.post()),
    ).toStrictEqual({ version: 2 });

    const bundle = parseKioskCurrent(await unwrap(admin.kiosk.current.get()));
    if (bundle.status !== "ready") throw new Error("준비된 묶음이어야 합니다");
    expect(bundle.questionSet.questions).toHaveLength(15);
    expect(bundle.shelf.drawers).toHaveLength(7);

    const started = startTurn("토끼", "session-15");
    const answered = answer(bundle.questionSet, started, 4);
    expect(answered.answers).toStrictEqual([4]);
    expect(back(answered).answers).toStrictEqual([]);
  });

  it("결과 화면 이벤트의 답이 점검 보고의 쌓인 응답에 나타난다", async () => {
    const { admin, eventStore } = await signedInServer({ shelf: "full" });
    const cloned = await unwrap(admin.admin["question-sets"].drafts["from-published"].post());
    const answers = SEED_QUESTION_SET.baselines[0]?.answers ?? [];
    await eventStore.append([
      parseFunnelEvent({
        sessionId: "session-recorded",
        kioskName: "계산대 옆",
        version: 1,
        type: "result_view",
        answers,
        ranking: { first: "B6", second: "B1", similar: false },
        scores: SEED_QUESTION_SET.drawers.map(({ code }) => ({ drawer: code, score: 0, fives: 0 })),
      }),
    ]);

    const report = await unwrap(
      admin.admin["question-sets"].drafts({ id: cloned.id }).report.get(),
    );

    expect(report.report.recorded?.samples).toBe(1);
    expect(report.report.recorded?.byDrawer.find(({ drawer }) => drawer === "B6")).toStrictEqual({
      drawer: "B6",
      firstCount: 1,
      firstRate: 1,
      topTwoCount: 1,
      topTwoRate: 1,
    });
  });

  it("문항 수가 줄어든 초안에는 다른 버전의 긴 답을 섞지 않는다", async () => {
    const { admin, eventStore } = await signedInServer({ shelf: "full" });
    const cloned = await unwrap(admin.admin["question-sets"].drafts["from-published"].post());
    const answers = SEED_QUESTION_SET.baselines[0]?.answers ?? [];
    await eventStore.append([
      parseFunnelEvent({
        sessionId: "session-old-version",
        kioskName: "계산대 옆",
        version: 1,
        type: "result_view",
        answers: [...answers, 4],
        ranking: { first: "B6", second: "B1", similar: false },
        scores: SEED_QUESTION_SET.drawers.map(({ code }) => ({ drawer: code, score: 0, fives: 0 })),
      }),
    ]);

    const data = await unwrap(admin.admin["question-sets"].drafts({ id: cloned.id }).report.get());
    expect(data.report.recorded).toBeUndefined();
  });

  it("없는 초안은 404다", async () => {
    const { admin } = await signedInServer();

    const get = await admin.admin["question-sets"].drafts({ id: "draft-none" }).get();
    expect(get.status).toBe(404);
    expect(get.error?.value).toStrictEqual({ code: "DRAFT_NOT_FOUND" });

    const report = await admin.admin["question-sets"].drafts({ id: "draft-none" }).report.get();
    expect(report.status).toBe(404);
  });
});
