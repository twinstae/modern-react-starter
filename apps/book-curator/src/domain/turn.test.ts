import { describe, expect, it } from "vite-plus/test";

import { InvalidAnswerError } from "./answer.ts";
import { parseQuestionSet } from "./question-set.ts";
import { back, answer, endTurn, startTurn, type Turn } from "./turn.ts";

const SET = parseQuestionSet({
  drawers: [
    { id: "B6", name: "삶의 방식을 바꾸는 책" },
    { id: "B1", name: "나를 들여다보는 책" },
  ],
  questions: [
    { drawer: "B6", text: "요즘 생활에서 무언가를 바꾸고 싶다" },
    { drawer: "B1", text: "나는 어떤 사람인지 자주 생각한다" },
    { drawer: "B1", text: "지금 그대로가 좋다" },
  ],
});

const SESSION = "session-1";

const turnOf = (...answers: Turn["answers"]): Turn =>
  answers.reduce((turn, value) => answer(SET, turn, value), startTurn("토끼", SESSION));

describe("Turn", () => {
  it("별명과 세션 id로 열고 답이 아직 없다", () => {
    expect(startTurn("토끼", SESSION)).toStrictEqual({
      sessionId: SESSION,
      nickname: "토끼",
      answers: [],
    });
  });

  it("세션 id가 다르면 다른 차례다", () => {
    expect(startTurn("토끼", "session-1")).not.toStrictEqual(startTurn("토끼", "session-2"));
  });

  it("답을 차례로 붙이고 세션 id와 별명은 그대로다", () => {
    expect(turnOf(5, 3, 2)).toStrictEqual({
      sessionId: SESSION,
      nickname: "토끼",
      answers: [5, 3, 2],
    });
  });

  it("되돌아가면 마지막 답만 버리고 세션 id와 별명은 남는다", () => {
    expect(back(turnOf(5, 3))).toStrictEqual({
      sessionId: SESSION,
      nickname: "토끼",
      answers: [5],
    });
  });

  it("답이 없을 때 되돌아가도 그대로다", () => {
    expect(back(startTurn("토끼", SESSION))).toStrictEqual(startTurn("토끼", SESSION));
  });

  it.each([
    ["0", 0],
    ["6", 6],
    ["정수가 아님", 2.5],
    ["문자열", "5"],
  ])("%s을 답하면 거부한다", (_name, value) => {
    expect(() => answer(SET, startTurn("토끼", SESSION), value)).toThrow(InvalidAnswerError);
  });

  it("모든 질문에 답한 뒤에는 더 답할 수 없다", () => {
    expect(() => answer(SET, turnOf(5, 3, 2), 4)).toThrow(InvalidAnswerError);
  });

  it("차례를 끝내면 앞 손님의 별명·답이 없고 다음 차례는 새 세션 id다(I-13)", () => {
    const finished = turnOf(5, 3, 2);

    expect(endTurn()).toBeUndefined();

    const next = startTurn("다른 손님", "session-2");
    expect(next.sessionId).not.toBe(finished.sessionId);
    expect(next).toStrictEqual({
      sessionId: "session-2",
      nickname: "다른 손님",
      answers: [],
    });
  });

  it("답하기와 되돌아가기를 섞어도 최종 답 목록은 마지막 답과 같다(I-3)", () => {
    const wandered = back(answer(SET, back(turnOf(5, 3)), 3));

    expect(wandered).toStrictEqual(turnOf(5));
  });
});
