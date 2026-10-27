import { describe, expect, it } from "vite-plus/test";

import type { ReadyKioskBundle } from "./kiosk.ts";
import { toPublicShelfDto } from "./kiosk.ts";
import {
  allows,
  CLOSED,
  handedBooksOf,
  homeOf,
  nextKioskSession,
  redirectFor,
  type KioskAction,
  type KioskSession,
} from "./kiosk-session.ts";
import { parseQuestionSet } from "./question-set.ts";
import { SEOYUN_ANSWERS, SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";
import { SHELF_BOOKS, SHELF_STOCK } from "./shelf.fixture.ts";

const questionSet = parseQuestionSet(SEOYUN_SET_INPUT);
const BUNDLE: ReadyKioskBundle = {
  status: "ready",
  version: 3,
  questionSet,
  shelf: toPublicShelfDto(questionSet, { stock: SHELF_STOCK, books: SHELF_BOOKS }),
};
const TOKEN = { token: "owner-token", expiresAt: "2026-10-28T00:10:00.000Z" };

/** 액션을 차례로 적용하고 마지막 세션과 그동안 나간 이벤트 type을 돌려준다. */
function run(actions: readonly KioskAction[], from: KioskSession = CLOSED) {
  let session = from;
  const events: string[] = [];
  for (const action of actions) {
    const transition = nextKioskSession(session, action);
    session = transition.session;
    events.push(...transition.events.map(({ type }) => type));
  }
  return { session, events };
}

const opened: KioskAction = {
  type: "open",
  bundle: BUNDLE,
  sessionId: "session-1",
  kioskName: "계산대 옆",
};
const started: KioskAction = { type: "start", nickname: "토끼", now: 0 };
const firstAnswer: KioskAction = { type: "answer", value: SEOYUN_ANSWERS[0], now: 0 };
const answeredAll: KioskAction[] = SEOYUN_ANSWERS.map((value) => ({
  type: "answer",
  value,
  now: 0,
}));

describe("키오스크 차례", () => {
  it("묶음을 받으면 시작 화면에서 별명을 묻고, 시작하면 첫 질문으로 간다", () => {
    const ready = run([opened]);
    expect(homeOf(ready.session)).toBe("start");
    expect(allows(ready.session, "question")).toBe(false);

    const turn = run([started], ready.session);
    expect(homeOf(turn.session)).toBe("question");
    expect([...ready.events, ...turn.events]).toStrictEqual(["kiosk_ready", "test_start"]);
  });

  it("두 번 열어도 세션은 하나다", () => {
    expect(run([opened, opened]).events).toStrictEqual(["kiosk_ready"]);
  });

  it("마지막 질문에 답하기 전에는 결과를 볼 수 없고, 답하면 결과로 간다", () => {
    const almost = run([opened, started, ...answeredAll.slice(0, -1)]);
    expect(allows(almost.session, "result")).toBe(false);

    const done = run([opened, started, ...answeredAll]);
    expect(homeOf(done.session)).toBe("result");
    expect(done.events.slice(-2)).toStrictEqual(["question_answer", "result_view"]);
  });

  it("질문 중에 뒤로 가면 마지막 답을 지우고 그 질문으로 돌아간다", () => {
    const { session, events } = run([
      opened,
      started,
      ...answeredAll.slice(0, 3),
      { type: "back", now: 0 },
    ]);

    expect(homeOf(session)).toBe("question");
    expect(session.status === "turn" ? session.turn.answers : null).toStrictEqual([5, 4]);
    expect(events.at(-1)).toBe("question_back");
  });

  it("결과를 본 뒤에는 뒤로 가도 답이 바뀌지 않는다", () => {
    const done = run([opened, started, ...answeredAll]).session;

    expect(run([{ type: "back", now: 0 }], done)).toStrictEqual({ session: done, events: [] });
  });

  it("주인 확인은 PIN을 풀어야 열리고, 토큰이 끝나면 다시 닫힌다", () => {
    const result = run([opened, started, ...answeredAll]).session;
    expect(allows(result, "owner-pin")).toBe(true);
    expect(allows(result, "owner-check")).toBe(false);

    const unlocked = run([{ type: "unlock", owner: TOKEN, now: 0 }], result).session;
    expect(allows(unlocked, "owner-check")).toBe(true);

    const expired = run([{ type: "owner_expired" }], unlocked).session;
    expect(redirectFor(expired, "owner-check")).toBe("owner-pin");
    expect(expired.status === "turn" ? expired.owner : null).toStrictEqual({ status: "expired" });
  });

  it("서랍을 건네면 그 서랍의 책을 보여 주고, 산 책은 줄어든 수량으로 남는다", () => {
    const unlocked = run([
      opened,
      started,
      ...answeredAll,
      { type: "unlock", owner: TOKEN, now: 0 },
    ]).session;
    const books = handedBooksOf(BUNDLE, "B6");

    const handed = run([{ type: "hand_over", drawer: "B6", books, now: 0 }], unlocked);
    expect(homeOf(handed.session)).toBe("owner-books");
    expect(allows(handed.session, "result")).toBe(false);
    expect(handed.events).toStrictEqual(["drawer_handover", ...books.map(() => "book_view")]);

    const bought = run(
      [{ type: "purchase", bookId: "book-b6-1", quantity: 1, now: 0 }],
      handed.session,
    );
    expect(bought.session.status === "turn" ? bought.session.handover : null).toStrictEqual({
      drawer: "B6",
      books: books.map((book) => (book.bookId === "book-b6-1" ? { ...book, quantity: 1 } : book)),
      recordedBookIds: ["book-b6-1"],
    });
    expect(bought.events).toStrictEqual(["purchase_record"]);
  });

  it("처음으로 돌아가면 별명·답이 남지 않고, 다시 눌러도 reset은 한 번만 남는다", () => {
    const { session, events } = run([
      opened,
      started,
      firstAnswer,
      { type: "reset", reason: "manual" },
      { type: "reset", reason: "manual" },
    ]);

    expect(session).toStrictEqual(CLOSED);
    expect(homeOf(session)).toBe("start");
    expect(events.filter((type) => type === "reset")).toStrictEqual(["reset"]);
  });
});
