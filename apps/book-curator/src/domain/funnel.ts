import * as v from "valibot";

import { AnswerValueSchema, type AnswerValue } from "./answer.ts";
import { DrawerCodeSchema, TextSchema, type DrawerCode } from "./question-set.ts";
import type { Ranking } from "./rank.ts";
import type { DrawerScores } from "./scoring/index.ts";

/**
 * 이벤트마다 붙는 공통 필드. 별명·이름·연락처·IP·User-Agent 자리는 어디에도 없다(I-12).
 * 버전은 필수다(I-16). 모르는 필드는 엄격 객체가 거부한다.
 */
const commonFields = {
  sessionId: TextSchema,
  kioskName: TextSchema,
  version: v.pipe(v.number(), v.integer(), v.minValue(1)),
};

/** 질문 세트 안에서 문항을 가리키는 키. 질문 스키마에 id가 없어 순서로 만든다. */
export type QuestionId = string;

export function questionIdAt(index: number): QuestionId {
  return `q${index + 1}`;
}

const QuestionIdSchema = TextSchema;
const QuestionIndexSchema = v.pipe(v.number(), v.integer(), v.minValue(0));

/** 결과 화면에 보인 1·2순위와 비슷함 표시. */
export const ResultRankingSchema = v.strictObject({
  first: DrawerCodeSchema,
  second: DrawerCodeSchema,
  similar: v.boolean(),
});

export type ResultRanking = v.InferOutput<typeof ResultRankingSchema>;

/** 결과 화면에 보인 서랍별 점수. 기여 목록은 이벤트에 남기지 않는다. */
export const ResultScoreSchema = v.strictObject({
  drawer: DrawerCodeSchema,
  score: v.number(),
  fives: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

export type ResultScore = v.InferOutput<typeof ResultScoreSchema>;

export const ResetReasonSchema = v.picklist(["completed", "timeout", "manual"]);

export type ResetReason = v.InferOutput<typeof ResetReasonSchema>;

const KioskReadyEventSchema = v.strictObject({
  ...commonFields,
  type: v.literal("kiosk_ready"),
});

const TestStartEventSchema = v.strictObject({
  ...commonFields,
  type: v.literal("test_start"),
});

const QuestionAnswerEventSchema = v.strictObject({
  ...commonFields,
  type: v.literal("question_answer"),
  questionId: QuestionIdSchema,
  answer: AnswerValueSchema,
  questionIndex: QuestionIndexSchema,
});

const QuestionBackEventSchema = v.strictObject({
  ...commonFields,
  type: v.literal("question_back"),
  questionId: QuestionIdSchema,
});

const ResultViewEventSchema = v.strictObject({
  ...commonFields,
  type: v.literal("result_view"),
  answers: v.array(AnswerValueSchema),
  ranking: ResultRankingSchema,
  scores: v.pipe(v.array(ResultScoreSchema), v.minLength(2)),
});

const DrawerHandoverEventSchema = v.strictObject({
  ...commonFields,
  type: v.literal("drawer_handover"),
  recommended: DrawerCodeSchema,
  handed: DrawerCodeSchema,
});

const BookViewEventSchema = v.strictObject({
  ...commonFields,
  type: v.literal("book_view"),
  bookId: TextSchema,
});

const PurchaseRecordEventSchema = v.strictObject({
  ...commonFields,
  type: v.literal("purchase_record"),
  bookId: TextSchema,
  drawer: DrawerCodeSchema,
});

const ResetEventSchema = v.strictObject({
  ...commonFields,
  type: v.literal("reset"),
  reason: ResetReasonSchema,
});

/** PRD UC-10 표의 이벤트 9종. 허용 목록 밖의 type과 필드는 거부한다. */
export const FunnelEventSchema = v.variant("type", [
  KioskReadyEventSchema,
  TestStartEventSchema,
  QuestionAnswerEventSchema,
  QuestionBackEventSchema,
  ResultViewEventSchema,
  DrawerHandoverEventSchema,
  BookViewEventSchema,
  PurchaseRecordEventSchema,
  ResetEventSchema,
]);

export type FunnelEvent = v.InferOutput<typeof FunnelEventSchema>;

export type FunnelEventType = FunnelEvent["type"];

/** API가 받는 이벤트 묶음. 빈 묶음과 모르는 필드를 거부한다. */
export const FunnelEventBatchSchema = v.strictObject({
  events: v.pipe(v.array(FunnelEventSchema), v.minLength(1)),
});

export type FunnelEventBatch = v.InferOutput<typeof FunnelEventBatchSchema>;

export function parseFunnelEvent(value: unknown): FunnelEvent {
  return v.parse(FunnelEventSchema, value);
}

/**
 * 저장소와 API로 나가는 모양을 명시적으로 고른다. 공통 필드를 빼고 이벤트별 필드만
 * 새 객체로 옮기므로, 도메인 값을 그대로 직렬화하지 않는다.
 */
export function toFunnelEventDto(event: FunnelEvent): FunnelEvent {
  const common = {
    sessionId: event.sessionId,
    kioskName: event.kioskName,
    version: event.version,
  };

  switch (event.type) {
    case "kiosk_ready":
      return { ...common, type: "kiosk_ready" };
    case "test_start":
      return { ...common, type: "test_start" };
    case "question_answer":
      return {
        ...common,
        type: "question_answer",
        questionId: event.questionId,
        answer: event.answer,
        questionIndex: event.questionIndex,
      };
    case "question_back":
      return { ...common, type: "question_back", questionId: event.questionId };
    case "result_view":
      return {
        ...common,
        type: "result_view",
        answers: [...event.answers],
        ranking: {
          first: event.ranking.first,
          second: event.ranking.second,
          similar: event.ranking.similar,
        },
        scores: event.scores.map(({ drawer, score, fives }) => ({ drawer, score, fives })),
      };
    case "drawer_handover":
      return {
        ...common,
        type: "drawer_handover",
        recommended: event.recommended,
        handed: event.handed,
      };
    case "book_view":
      return { ...common, type: "book_view", bookId: event.bookId };
    case "purchase_record":
      return {
        ...common,
        type: "purchase_record",
        bookId: event.bookId,
        drawer: event.drawer,
      };
    case "reset":
      return { ...common, type: "reset", reason: event.reason };
  }
}

/**
 * 이벤트 테이블의 payload. 공통 필드(sessionId, kioskName, version, type)는 열로 나가고
 * 이벤트별 필드만 남는다. 읽을 때 공통 필드와 다시 합쳐 엄격 스키마로 파싱한다.
 */
export type FunnelEventPayload =
  | Record<string, never>
  | { readonly questionId: string; readonly answer: AnswerValue; readonly questionIndex: number }
  | { readonly questionId: string }
  | {
      readonly answers: readonly AnswerValue[];
      readonly ranking: ResultRanking;
      readonly scores: readonly ResultScore[];
    }
  | { readonly recommended: DrawerCode; readonly handed: DrawerCode }
  | { readonly bookId: string }
  | { readonly bookId: string; readonly drawer: DrawerCode }
  | { readonly reason: ResetReason };

export function toFunnelEventPayload(event: FunnelEvent): FunnelEventPayload {
  switch (event.type) {
    case "kiosk_ready":
    case "test_start":
      return {};
    case "question_answer":
      return {
        questionId: event.questionId,
        answer: event.answer,
        questionIndex: event.questionIndex,
      };
    case "question_back":
      return { questionId: event.questionId };
    case "result_view":
      return {
        answers: [...event.answers],
        ranking: {
          first: event.ranking.first,
          second: event.ranking.second,
          similar: event.ranking.similar,
        },
        scores: event.scores.map(({ drawer, score, fives }) => ({ drawer, score, fives })),
      };
    case "drawer_handover":
      return { recommended: event.recommended, handed: event.handed };
    case "book_view":
      return { bookId: event.bookId };
    case "purchase_record":
      return { bookId: event.bookId, drawer: event.drawer };
    case "reset":
      return { reason: event.reason };
  }
}

/** 저장소 행(공통 열 + payload)을 도메인 이벤트로 파싱한다. 모르는 payload 필드는 거부된다. */
export function funnelEventFromRow(row: {
  readonly sessionId: string;
  readonly kioskName: string;
  readonly version: number;
  readonly type: string;
  readonly payload: FunnelEventPayload;
}): FunnelEvent {
  const payload: Record<string, unknown> = { ...row.payload };
  return parseFunnelEvent({
    ...payload,
    sessionId: row.sessionId,
    kioskName: row.kioskName,
    version: row.version,
    type: row.type,
  });
}

/** 퍼널 단계. `done`은 차례가 끝나 버린 상태이고, 다음 차례는 새 상태로 연다. */
export type FunnelPhase =
  | "ready"
  | "started"
  | "result"
  | "handover"
  | "book_view"
  | "purchase"
  | "done";

export interface FunnelState {
  readonly phase: FunnelPhase;
  readonly sessionId: string;
  readonly kioskName: string;
  readonly version: number;
  readonly answers: readonly AnswerValue[];
}

export interface FunnelSessionInput {
  readonly sessionId: string;
  readonly kioskName: string;
  readonly version: number;
}

export interface FunnelTransition {
  readonly state: FunnelState;
  readonly events: readonly FunnelEvent[];
}

/**
 * 손님이 화면에서 하는 일. 별명은 들어오지 않는다(I-12). 화면은 의도만 알리고,
 * 어떤 이벤트를 남길지는 이 코어가 정한다.
 */
export type FunnelAction =
  | { readonly type: "start" }
  | {
      readonly type: "answer";
      readonly questionId: QuestionId;
      readonly answer: AnswerValue;
      readonly questionIndex: number;
    }
  | { readonly type: "back"; readonly questionId: QuestionId }
  | { readonly type: "view_result"; readonly ranking: Ranking; readonly scores: DrawerScores }
  | { readonly type: "handover"; readonly recommended: DrawerCode; readonly handed: DrawerCode }
  | { readonly type: "book_view"; readonly bookId: string }
  | { readonly type: "purchase"; readonly bookId: string; readonly drawer: DrawerCode }
  | { readonly type: "reset"; readonly reason: ResetReason };

const commonOf = (state: FunnelState) => ({
  sessionId: state.sessionId,
  kioskName: state.kioskName,
  version: state.version,
});

const unchanged = (state: FunnelState): FunnelTransition => ({ state, events: [] });

/**
 * 새 차례의 퍼널을 연다. 묶음이 준비된 순간 한 번만 불러, 세션마다 `kiosk_ready`를
 * 정확히 하나 남긴다. 세션 ID는 호출하는 쪽이 만든다.
 */
export function openFunnel(input: FunnelSessionInput): FunnelTransition {
  const state: FunnelState = {
    phase: "ready",
    sessionId: input.sessionId,
    kioskName: input.kioskName,
    version: input.version,
    answers: [],
  };

  return {
    state,
    events: [parseFunnelEvent({ ...commonOf(state), type: "kiosk_ready" })],
  };
}

/**
 * UI 의도를 퍼널 상태와 이벤트로 바꾼다. 지금 단계에서 할 수 없는 동작은 이벤트를
 * 만들지 않고 상태도 그대로 둔다. 그래서 무작위 동작열을 넣어도 문법이 깨지지 않는다(I-14).
 * `done` 상태는 다시 쓰지 않는다. 다음 차례는 `openFunnel`로 새로 연다.
 */
export function funnel(state: FunnelState, action: FunnelAction): FunnelTransition {
  if (state.phase === "done") return unchanged(state);

  switch (action.type) {
    case "start": {
      if (state.phase !== "ready") return unchanged(state);
      const next: FunnelState = { ...state, phase: "started" };
      return {
        state: next,
        events: [parseFunnelEvent({ ...commonOf(next), type: "test_start" })],
      };
    }

    case "answer": {
      const index = state.answers.length;
      if (state.phase !== "started") return unchanged(state);
      if (action.questionIndex !== index) return unchanged(state);
      if (action.questionId !== questionIdAt(index)) return unchanged(state);

      const next: FunnelState = { ...state, answers: [...state.answers, action.answer] };
      return {
        state: next,
        events: [
          parseFunnelEvent({
            ...commonOf(next),
            type: "question_answer",
            questionId: action.questionId,
            answer: action.answer,
            questionIndex: index,
          }),
        ],
      };
    }

    case "back": {
      if (state.phase !== "started" || state.answers.length === 0) return unchanged(state);
      const questionId = questionIdAt(state.answers.length - 1);
      if (action.questionId !== questionId) return unchanged(state);

      const next: FunnelState = { ...state, answers: state.answers.slice(0, -1) };
      return {
        state: next,
        events: [
          parseFunnelEvent({
            ...commonOf(next),
            type: "question_back",
            questionId,
          }),
        ],
      };
    }

    case "view_result": {
      if (state.phase !== "started" || state.answers.length === 0) return unchanged(state);

      const next: FunnelState = { ...state, phase: "result" };
      return {
        state: next,
        events: [
          parseFunnelEvent({
            ...commonOf(next),
            type: "result_view",
            answers: [...state.answers],
            ranking: {
              first: action.ranking.first,
              second: action.ranking.second,
              similar: action.ranking.similar,
            },
            scores: action.scores.drawers.map(({ drawer, score, fives }) => ({
              drawer,
              score,
              fives,
            })),
          }),
        ],
      };
    }

    case "handover": {
      if (state.phase !== "result") return unchanged(state);
      const next: FunnelState = { ...state, phase: "handover" };
      return {
        state: next,
        events: [
          parseFunnelEvent({
            ...commonOf(next),
            type: "drawer_handover",
            recommended: action.recommended,
            handed: action.handed,
          }),
        ],
      };
    }

    case "book_view": {
      if (!isAfterHandover(state.phase)) return unchanged(state);
      const next: FunnelState = { ...state, phase: "book_view" };
      return {
        state: next,
        events: [
          parseFunnelEvent({
            ...commonOf(next),
            type: "book_view",
            bookId: action.bookId,
          }),
        ],
      };
    }

    case "purchase": {
      if (!isAfterHandover(state.phase)) return unchanged(state);
      const next: FunnelState = { ...state, phase: "purchase" };
      return {
        state: next,
        events: [
          parseFunnelEvent({
            ...commonOf(next),
            type: "purchase_record",
            bookId: action.bookId,
            drawer: action.drawer,
          }),
        ],
      };
    }

    case "reset": {
      const next: FunnelState = { ...state, phase: "done", answers: [] };
      return {
        state: next,
        events: [
          parseFunnelEvent({
            ...commonOf(next),
            type: "reset",
            reason: action.reason,
          }),
        ],
      };
    }
  }
}

function isAfterHandover(phase: FunnelPhase): boolean {
  return phase === "handover" || phase === "book_view" || phase === "purchase";
}
