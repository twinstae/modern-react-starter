import fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";

import { curate } from "./curate.ts";
import {
  funnel,
  type FunnelAction,
  type FunnelEvent,
  type FunnelState,
  openFunnel,
  parseFunnelEvent,
  questionIdAt,
} from "./funnel.ts";
import { funnelActionArbitrary } from "./funnel.arbitrary.ts";
import { parseQuestionSet } from "./question-set.ts";

const SET = parseQuestionSet({
  drawers: [
    { id: "B6", name: "삶의 방식을 바꾸는 책" },
    { id: "B1", name: "나를 들여다보는 책" },
  ],
  questions: [
    { drawer: "B6", text: "요즘 생활을 바꾸고 싶다" },
    { drawer: "B1", text: "나를 들여다보고 싶다" },
  ],
});

const SESSION = "session-1";
const KIOSK = "계산대 옆";
const VERSION = 7;

const common = {
  sessionId: SESSION,
  kioskName: KIOSK,
  version: VERSION,
} as const;

function open(): FunnelState {
  return openFunnel({ sessionId: SESSION, kioskName: KIOSK, version: VERSION }).state;
}

function step(state: FunnelState, action: FunnelAction) {
  return funnel(state, action);
}

describe("퍼널 이벤트 스키마", () => {
  it("이벤트에 별명 자리가 없고 더한 필드는 거부한다(I-12)", () => {
    const event = { ...common, type: "test_start" };

    expect(() => parseFunnelEvent({ ...event, nickname: "토끼" })).toThrow();
    expect(() => parseFunnelEvent({ ...event, name: "서윤" })).toThrow();
    expect(() => parseFunnelEvent({ ...event, phone: "010-0000-0000" })).toThrow();
    expect(() => parseFunnelEvent({ ...event, userAgent: "UA" })).toThrow();
    expect(parseFunnelEvent(event)).toStrictEqual(event);
  });

  it("버전이 빠진 이벤트는 거부한다(I-16)", () => {
    expect(() =>
      parseFunnelEvent({ sessionId: SESSION, kioskName: KIOSK, type: "test_start" }),
    ).toThrow();
    expect(() => parseFunnelEvent({ ...common, version: 0, type: "test_start" })).toThrow();
  });

  it("허용 목록 밖의 이벤트 종류는 거부한다", () => {
    expect(() => parseFunnelEvent({ ...common, type: "nickname_saved" })).toThrow();
  });
});

describe("퍼널 상태기계", () => {
  it("한 차례의 이벤트를 퍼널 순서대로 정확히 낸다(I-14)", () => {
    const opened = openFunnel({ sessionId: SESSION, kioskName: KIOSK, version: VERSION });
    expect(opened.state.phase).toBe("ready");

    const started = step(opened.state, { type: "start" });
    expect(started.state.phase).toBe("started");

    const first = step(started.state, {
      type: "answer",
      questionId: questionIdAt(0),
      answer: 5,
      questionIndex: 0,
    });

    const backed = step(first.state, { type: "back", questionId: questionIdAt(0) });
    expect(backed.state.answers).toStrictEqual([]);

    const changed = step(backed.state, {
      type: "answer",
      questionId: questionIdAt(0),
      answer: 4,
      questionIndex: 0,
    });

    const second = step(changed.state, {
      type: "answer",
      questionId: questionIdAt(1),
      answer: 3,
      questionIndex: 1,
    });

    const curation = curate(SET, [4, 3], "토끼");
    const result = step(second.state, {
      type: "view_result",
      ranking: curation.ranking,
      scores: curation.scores,
    });

    const reset = step(result.state, { type: "reset", reason: "manual" });
    expect(reset.state.phase).toBe("done");
    expect(reset.state.answers).toStrictEqual([]);

    expect([
      ...opened.events,
      ...started.events,
      ...first.events,
      ...backed.events,
      ...changed.events,
      ...second.events,
      ...result.events,
      ...reset.events,
    ]).toStrictEqual([
      { ...common, type: "kiosk_ready" },
      { ...common, type: "test_start" },
      { ...common, type: "question_answer", questionId: "q1", answer: 5, questionIndex: 0 },
      { ...common, type: "question_back", questionId: "q1" },
      { ...common, type: "question_answer", questionId: "q1", answer: 4, questionIndex: 0 },
      { ...common, type: "question_answer", questionId: "q2", answer: 3, questionIndex: 1 },
      {
        ...common,
        type: "result_view",
        answers: [4, 3],
        ranking: { first: "B6", second: "B1", similar: false },
        scores: [
          { drawer: "B6", score: 4, fives: 0 },
          { drawer: "B1", score: 3, fives: 0 },
        ],
      },
      { ...common, type: "reset", reason: "manual" },
    ]);
    expect(JSON.stringify([...opened.events, ...result.events])).not.toContain("토끼");
  });

  it("시작 전 답하기·되돌아가기·결과 보기는 이벤트 없이 무시한다", () => {
    const state = open();
    const attempts: FunnelAction[] = [
      { type: "answer", questionId: "q1", answer: 5, questionIndex: 0 },
      { type: "back", questionId: "q1" },
      {
        type: "view_result",
        ranking: { first: "B6", second: "B1", similar: false },
        scores: curate(SET, [5, 4], "토끼").scores,
      },
      { type: "handover", recommended: "B6", handed: "B6" },
      { type: "book_view", bookId: "book-1" },
      { type: "purchase", bookId: "book-1", drawer: "B6" },
    ];

    for (const action of attempts) {
      const transition = step(state, action);
      expect(transition.events).toStrictEqual([]);
      expect(transition.state).toStrictEqual(state);
    }
  });

  it("시작한 뒤에는 다시 시작할 수 있고, 답이 없으면 되돌아갈 수 없다", () => {
    const started = step(open(), { type: "start" });
    const again = step(started.state, { type: "start" });
    expect(again.events).toStrictEqual([]);
    expect(again.state).toStrictEqual(started.state);

    const back = step(started.state, { type: "back", questionId: "q1" });
    expect(back.events).toStrictEqual([]);
    expect(back.state).toStrictEqual(started.state);
  });

  it("결과 뒤에 건넴·책 보기·구매를 순서대로 남긴다", () => {
    const curation = curate(SET, [5, 4], "토끼");
    const result = step(
      step(
        step(step(open(), { type: "start" }).state, {
          type: "answer",
          questionId: "q1",
          answer: 5,
          questionIndex: 0,
        }).state,
        { type: "answer", questionId: "q2", answer: 4, questionIndex: 1 },
      ).state,
      { type: "view_result", ranking: curation.ranking, scores: curation.scores },
    );

    const handover = step(result.state, { type: "handover", recommended: "B6", handed: "B1" });
    const viewed = step(handover.state, { type: "book_view", bookId: "book-1" });
    const purchased = step(viewed.state, { type: "purchase", bookId: "book-1", drawer: "B1" });
    const reset = step(purchased.state, { type: "reset", reason: "completed" });

    expect(handover.events[0]?.type).toBe("drawer_handover");
    expect(viewed.events[0]?.type).toBe("book_view");
    expect(purchased.events[0]?.type).toBe("purchase_record");
    expect(reset.events[0]).toStrictEqual({ ...common, type: "reset", reason: "completed" });
  });

  it("끝난 뒤의 동작은 이벤트를 만들지 않고, 다음 차례는 새 세션으로 연다", () => {
    const reset = step(open(), { type: "reset", reason: "manual" });
    expect(reset.state.phase).toBe("done");
    expect(step(reset.state, { type: "start" }).events).toStrictEqual([]);

    const next = openFunnel({ sessionId: "session-2", kioskName: KIOSK, version: VERSION });
    expect(next.events).toStrictEqual([
      {
        sessionId: "session-2",
        kioskName: KIOSK,
        version: VERSION,
        type: "kiosk_ready",
      },
    ]);
  });

  it("무작위 UI 동작열이 만든 이벤트열은 늘 퍼널 문법을 지킨다(I-14)", () => {
    fc.assert(
      fc.property(fc.array(funnelActionArbitrary, { maxLength: 40 }), (actions) => {
        let sessionIndex = 0;
        let opened = openFunnel({
          sessionId: `session-${sessionIndex}`,
          kioskName: KIOSK,
          version: VERSION,
        });
        let state = opened.state;
        const events: FunnelEvent[] = [...opened.events];

        for (const action of actions) {
          if (state.phase === "done") {
            sessionIndex += 1;
            opened = openFunnel({
              sessionId: `session-${sessionIndex}`,
              kioskName: KIOSK,
              version: VERSION,
            });
            state = opened.state;
            events.push(...opened.events);
          }

          const transition = step(state, action);
          state = transition.state;
          events.push(...transition.events);
        }

        expect(events[0]?.type).toBe("kiosk_ready");
        assertFunnelGrammar(events);
      }),
      { numRuns: 100 },
    );
  });
});

const GRAMMAR_STAGE = {
  ready: 0,
  started: 1,
  result: 2,
  handover: 3,
} as const;

/** 이벤트열이 세션마다 ready → start → … → reset 순서를 지키는지 확인한다. */
function assertFunnelGrammar(events: readonly FunnelEvent[]): void {
  const bySession = new Map<string, FunnelEvent[]>();
  for (const event of events) {
    const own = bySession.get(event.sessionId);
    if (own === undefined) bySession.set(event.sessionId, [event]);
    else own.push(event);
  }

  for (const own of bySession.values()) {
    let stage: number = GRAMMAR_STAGE.ready;
    expect(own[0]?.type).toBe("kiosk_ready");

    for (let index = 1; index < own.length; index += 1) {
      const event = own[index];
      if (event === undefined) throw new Error("이벤트가 비어 있습니다");

      if (event.type === "reset") {
        expect(index).toBe(own.length - 1);
        continue;
      }

      switch (event.type) {
        case "kiosk_ready":
          throw new Error("세션 안에서 kiosk_ready가 두 번 나왔습니다");
        case "test_start":
          expect(stage).toBe(GRAMMAR_STAGE.ready);
          stage = GRAMMAR_STAGE.started;
          break;
        case "question_answer":
        case "question_back":
          expect(stage).toBe(GRAMMAR_STAGE.started);
          break;
        case "result_view":
          expect(stage).toBe(GRAMMAR_STAGE.started);
          stage = GRAMMAR_STAGE.result;
          break;
        case "drawer_handover":
          expect(stage).toBe(GRAMMAR_STAGE.result);
          stage = GRAMMAR_STAGE.handover;
          break;
        case "book_view":
        case "purchase_record":
          expect(stage).toBe(GRAMMAR_STAGE.handover);
          break;
      }
    }
  }
}
