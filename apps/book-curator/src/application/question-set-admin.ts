import type { AnswerValue } from "../domain/answer.ts";
import { answerValueFor } from "../domain/answer.ts";
import { analyze, type GateIssue, type GateIssueCode, type SetReport } from "../domain/analyze.ts";
import type { FunnelEvent } from "../domain/funnel.ts";
import { parseQuestionSet, type DrawerCode, type QuestionSet } from "../domain/question-set.ts";
import { seededRng } from "../domain/random.ts";
import { SEED_QUESTION_SET, SEED_RANDOM_SEED } from "../domain/seed-question-set.ts";
import { checkShelfGate, type ShelfGateResult } from "../domain/shelf.ts";
import type { EventStore } from "./event-store-ports.ts";
import type { PublishedQuestionSetStore } from "./published-question-set-ports.ts";
import type { QuestionSetDraft, QuestionSetDraftStore } from "./question-set-draft-ports.ts";
import type { DrawerStockStore } from "./shelf-ports.ts";
import { NoPublishedQuestionSetError } from "./shelf-admin.ts";

/** 없는 초안을 읽거나 고치려 할 때 던진다. */
export class DraftNotFoundError extends Error {
  readonly id: string;

  constructor(id: string) {
    super(`없는 질문 세트 초안입니다: ${id}`);
    this.name = "DraftNotFoundError";
    this.id = id;
  }
}

/** 공개된 질문 세트가 없어 초안으로 복제할 수 없을 때는 `shelf-admin`의 같은 오류를 쓴다. */

/** 공개를 막는 이유 하나. 점검 실패는 그대로, 서가 게이트는 `shelf-gate`로 모은다. */
export interface PublishBlocker {
  readonly code: GateIssueCode | "shelf-gate";
  readonly drawers: readonly DrawerCode[];
  readonly baselines: readonly string[];
}

/** 초안 점검 응답. 화면은 이 값만 보고 공개 버튼을 막는다. */
export interface DraftReport {
  readonly draft: QuestionSetDraft;
  readonly report: SetReport;
  readonly shelfGate: ShelfGateResult;
  readonly canPublish: boolean;
  readonly blockers: readonly PublishBlocker[];
}

/** 점검은 통과했지만 서버의 공개 재점검에서 막혔을 때 던진다. */
export class PublishBlockedError extends Error {
  readonly blockers: readonly PublishBlocker[];
  readonly shelfGate: ShelfGateResult;

  constructor(blockers: readonly PublishBlocker[], shelfGate: ShelfGateResult) {
    super("공개 점검을 통과하지 못했습니다");
    this.name = "PublishBlockedError";
    this.blockers = blockers;
    this.shelfGate = shelfGate;
  }
}

export interface CreateDraftInput {
  readonly name: string;
  readonly questionSet?: unknown;
}

export interface SaveDraftInput {
  readonly name?: string;
  readonly questionSet: unknown;
}

const blockerOfIssue = (issue: GateIssue): PublishBlocker => ({
  code: issue.code,
  drawers: [...issue.drawers],
  baselines: [...issue.baselines],
});

/** 점검 실패와 서가 게이트를 공개를 막는 이유 목록으로 모은다. 경고는 막지 않는다. */
export function publishBlockers(report: SetReport, shelfGate: ShelfGateResult): PublishBlocker[] {
  const blockers = report.gate.failures.map(blockerOfIssue);
  if (!shelfGate.passed) {
    blockers.push({
      code: "shelf-gate",
      drawers: shelfGate.lacking.map(({ drawer }) => drawer),
      baselines: [],
    });
  }
  return blockers;
}

/**
 * 쌓인 응답 중 결과 화면 이벤트의 답만 꺼낸다. 별명 자리는 이벤트에 없다(I-12).
 * 다른 버전에서 남은 답은 지금 초안의 질문과 형식·길이가 맞을 때만 쓴다. 맞지 않는
 * 답을 그대로 채점하면 보고가 500으로 죽거나 다른 질문의 답으로 섞인다.
 */
export function recordedAnswers(events: readonly FunnelEvent[], set: QuestionSet): AnswerValue[][] {
  return events.flatMap((event) => {
    if (event.type !== "result_view") return [];
    const fits = event.answers.every((answer, index) => {
      const question = set.questions[index];
      if (question === undefined) return false;
      try {
        answerValueFor(question, answer);
        return true;
      } catch {
        return false;
      }
    });
    return fits ? [[...event.answers]] : [];
  });
}

export function draftQuestionCount(set: QuestionSet): number {
  return set.questions.length;
}

export async function listDrafts(store: QuestionSetDraftStore): Promise<QuestionSetDraft[]> {
  return store.list();
}

/** 이름과 질문 세트로 초안을 만든다. 질문 세트를 주지 않으면 시드에서 시작한다. */
export async function createDraft(
  store: QuestionSetDraftStore,
  input: CreateDraftInput,
  id: string,
  now: string,
): Promise<QuestionSetDraft> {
  const questionSet =
    input.questionSet === undefined ? SEED_QUESTION_SET : parseQuestionSet(input.questionSet);
  const draft: QuestionSetDraft = {
    id,
    name: input.name,
    questionSet,
    createdAt: now,
    updatedAt: now,
  };

  await store.create(draft);
  return draft;
}

/** 지금 공개 중인 질문 세트를 복제해 초안을 만든다. 공개 버전 자체는 건드리지 않는다(I-11). */
export async function clonePublishedDraft(
  store: QuestionSetDraftStore,
  publishedStore: PublishedQuestionSetStore,
  id: string,
  now: string,
): Promise<QuestionSetDraft> {
  const published = await publishedStore.current();
  if (published === null) throw new NoPublishedQuestionSetError();

  return createDraft(
    store,
    {
      name: `공개 버전 ${published.version} 복제`,
      questionSet: published.questionSet,
    },
    id,
    now,
  );
}

export async function getDraft(
  store: QuestionSetDraftStore,
  id: string,
): Promise<QuestionSetDraft> {
  const draft = await store.get(id);
  if (draft === null) throw new DraftNotFoundError(id);
  return draft;
}

/** 초안을 저장한다. 질문 세트는 경계에서 엄격하게 파싱하고 id는 그대로 둔다. */
export async function saveDraft(
  store: QuestionSetDraftStore,
  id: string,
  input: SaveDraftInput,
  now: string,
): Promise<QuestionSetDraft> {
  const current = await getDraft(store, id);
  const saved: QuestionSetDraft = {
    ...current,
    name: input.name ?? current.name,
    questionSet: parseQuestionSet(input.questionSet),
    updatedAt: now,
  };

  await store.save(saved);
  return saved;
}

/**
 * 초안을 점검한다. 표본은 서버가 고정 시드로 다시 만들고, 쌓인 응답은 이벤트 저장소의
 * `result_view` 답을 쓴다. 서가 게이트는 초안의 서랍 이름과 지금 서가로 본다.
 */
export async function readDraftReport(
  store: QuestionSetDraftStore,
  eventStore: EventStore,
  stockStore: DrawerStockStore,
  id: string,
): Promise<DraftReport> {
  const draft = await getDraft(store, id);
  const [events, stock] = await Promise.all([eventStore.list(), stockStore.list()]);
  const recorded = recordedAnswers(events, draft.questionSet);
  const report = analyze(
    draft.questionSet,
    seededRng(SEED_RANDOM_SEED),
    recorded.length === 0 ? undefined : recorded,
  );
  const shelfGate = checkShelfGate(stock, draft.questionSet.drawers);
  const blockers = publishBlockers(report, shelfGate);

  return { draft, report, shelfGate, canPublish: blockers.length === 0, blockers };
}

/**
 * 공개한다. 화면의 점검을 믿지 않고 서버에서 같은 `analyze`와 서가 게이트를 다시 돌린다.
 * 통과하면 새 버전 행을 만들고 공개 포인터만 옮긴다. 초안과 이전 버전은 그대로다(I-11).
 */
export async function publishDraft(
  store: QuestionSetDraftStore,
  publishedStore: PublishedQuestionSetStore,
  eventStore: EventStore,
  stockStore: DrawerStockStore,
  id: string,
): Promise<{ readonly version: number }> {
  const checked = await readDraftReport(store, eventStore, stockStore, id);
  if (!checked.canPublish) {
    throw new PublishBlockedError(checked.blockers, checked.shelfGate);
  }

  const published = await publishedStore.publish(checked.draft.questionSet);
  return { version: published.version };
}
