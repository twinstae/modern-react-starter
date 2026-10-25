import { parseQuestionSet, type QuestionSet } from "./question-set.ts";

/**
 * MVP 시드 질문 세트. PRD 부록 B의 서랍 7개에 문항 2개씩(`item-mean`)을 둔다.
 *
 * - 문항 문장과 서랍의 표시·이유는 아직 가정한 초안이다. 가정이라는 표시는
 *   `docs/SEED-QUESTIONS.md`·`docs/OPEN-QUESTIONS.md`에만 두고, 손님에게 보이는 값에는
 *   `[가정]` 같은 편집용 접두어를 넣지 않는다. 최종 문구는 책방 주인 선생님과 정한다.
 * - 권하는 이유(`reason`)는 인용 문형 뒤에 이어 읽히도록 "그 마음이 …"로 시작하고
 *   책 제목은 넣지 않는다.
 * - 서랍 순서는 코드 순서가 아니라 동점을 나눠 갖도록 섞었다. B6이 0, B1이 1이다.
 * - 서윤의 기준 응답은 B6 평균 4.5, B1 평균 3.5로 1순위 B6, 2순위 B1을 기대한다.
 * - 문항 순서도 서랍이 몰리지 않게 섞었다. 답 목록은 이 순서에 맞춘다.
 */
export const SEED_QUESTION_SET_INPUT = {
  drawers: [
    {
      code: "B6",
      name: "삶의 방식을 바꾸는 책",
      order: 0,
      mark: "1번 · 열쇠 1",
      reason: "그 마음이 생활의 작은 습관부터 하나씩 바꾸는 책으로 이어집니다",
    },
    {
      code: "B1",
      name: "나를 들여다보는 책",
      order: 1,
      mark: "2번 · 열쇠 2",
      reason: "그 마음이 나를 천천히 들여다보는 책으로 이어집니다",
    },
    {
      code: "B4",
      name: "사회를 이해하는 책",
      order: 2,
      mark: "3번 · 열쇠 3",
      reason: "그 마음이 세상이 돌아가는 방식을 더 깊이 이해하는 책으로 이어집니다",
    },
    {
      code: "B2",
      name: "관계를 다시 생각하는 책",
      order: 3,
      mark: "4번 · 열쇠 4",
      reason: "그 마음이 가까운 사람과의 거리를 다시 보는 책으로 이어집니다",
    },
    {
      code: "B7",
      name: "잠시 멈춰 생각하는 책",
      order: 4,
      mark: "5번 · 열쇠 5",
      reason: "그 마음이 잠시 멈추어 곱씹는 책으로 이어집니다",
    },
    {
      code: "B3",
      name: "다른 삶을 만나는 책",
      order: 5,
      mark: "6번 · 열쇠 6",
      reason: "그 마음이 나와 다른 삶을 만나는 책으로 이어집니다",
    },
    {
      code: "B5",
      name: "세계를 넓혀 보는 책",
      order: 6,
      mark: "7번 · 열쇠 7",
      reason: "그 마음이 내가 사는 세계를 넓혀 보는 책으로 이어집니다",
    },
  ],
  questions: [
    {
      type: "item",
      drawer: "B6",
      reversed: false,
      text: "요즘 생활에서 무언가를 바꾸고 싶다",
    },
    {
      type: "item",
      drawer: "B1",
      reversed: false,
      text: "나는 어떤 사람인지 자주 생각한다",
    },
    {
      type: "item",
      drawer: "B4",
      reversed: false,
      text: "요즘 사회의 불평등이나 제도 문제가 마음에 걸린다",
    },
    {
      type: "item",
      drawer: "B2",
      reversed: false,
      text: "요즘 가까운 사람과의 거리가 고민이다",
    },
    {
      type: "item",
      drawer: "B7",
      reversed: false,
      text: "잠시 멈추고 생각할 여유가 필요하다",
    },
    {
      type: "item",
      drawer: "B3",
      reversed: false,
      text: "나와 다른 삶을 사는 사람의 이야기가 궁금하다",
    },
    {
      type: "item",
      drawer: "B5",
      reversed: false,
      text: "역사나 문화, 과학처럼 넓은 세계를 알고 싶다",
    },
    {
      type: "item",
      drawer: "B1",
      reversed: false,
      text: "내 마음이 무엇을 원하는지 알고 싶다",
    },
    {
      type: "item",
      drawer: "B6",
      reversed: false,
      text: "읽은 책을 삶에 가져와 써 보고 싶다",
    },
    {
      type: "item",
      drawer: "B3",
      reversed: false,
      text: "내가 당연하게 여긴 삶의 방식을 다시 보고 싶다",
    },
    {
      type: "item",
      drawer: "B5",
      reversed: false,
      text: "내가 사는 세계의 배경을 이해하는 책을 읽고 싶다",
    },
    {
      type: "item",
      drawer: "B7",
      reversed: false,
      text: "예술이나 철학처럼 천천히 곱씹는 이야기가 끌린다",
    },
    {
      type: "item",
      drawer: "B2",
      reversed: false,
      text: "관계에서 내가 어떤 태도를 취하는지 돌아보고 싶다",
    },
    {
      type: "item",
      drawer: "B4",
      reversed: false,
      text: "뉴스나 사회 문제를 더 깊이 이해하고 싶다",
    },
  ],
  scoring: { type: "item-mean" },
  statementTemplate: "{nickname} 님에게는 지금 {drawer:이/가} 필요한 상태입니다",
  citationTemplates: {
    item: "‘{quote}’에 그렇다고 답하신",
    choice: "‘{quote}’를 고르신",
  },
  baselines: [
    {
      name: "서윤",
      answers: [5, 4, 2, 3, 2, 2, 2, 3, 4, 2, 1, 1, 2, 2],
      expected: { first: "B6", second: "B1" },
    },
  ],
} as const;

export const SEED_QUESTION_SET: QuestionSet = parseQuestionSet(SEED_QUESTION_SET_INPUT);

/** 시드 점검에 쓰는 고정 난수 시드. 79는 책방 이름에서 가져왔다. */
export const SEED_RANDOM_SEED = 79;
