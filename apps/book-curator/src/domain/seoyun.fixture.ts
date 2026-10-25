/**
 * PRD 부록 A-3의 기준 응답 예시. 서윤은 B6 문항을 가장 높게, B1 문항을 그다음으로 답한다.
 * 시드 질문 세트(TICKET-00003)가 아니라 코어 예시 테스트용 최소 세트다.
 */
export const SEOYUN_SET_INPUT = {
  drawers: [
    { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
    { code: "B1", name: "나를 들여다보는 책", order: 1 },
    { code: "B2", name: "관계를 다시 생각하는 책", order: 2 },
  ],
  questions: [
    { type: "item", drawer: "B6", reversed: false, text: "요즘 생활에서 무언가를 바꾸고 싶다" },
    { type: "item", drawer: "B1", reversed: false, text: "나는 어떤 사람인지 자주 생각한다" },
    { type: "item", drawer: "B2", reversed: false, text: "요즘 사람들과의 거리가 고민이다" },
    { type: "item", drawer: "B6", reversed: false, text: "읽은 책을 삶에 가져와 써 보고 싶다" },
    { type: "item", drawer: "B1", reversed: false, text: "내 마음이 무엇을 원하는지 알고 싶다" },
  ],
  scoring: { type: "item-mean" },
  baselines: [],
} as const;

/** B6 평균 4.5, B1 평균 3.5, B2 평균 2. */
export const SEOYUN_ANSWERS = [5, 4, 2, 4, 3] as const;
