import type { Drawer } from "./drawer.ts";
import { questionSetFrom, type QuestionSet } from "./question-set.ts";

/**
 * 개발·데모용 시드 서랍. PRD 부록 B의 서랍 7개에 문항 2개씩, 예시 책 3권씩을 둔다.
 *
 * - 문항 문장은 아직 가정한 초안이다. 가정이라는 표시는 `docs/SEED-QUESTIONS.md`·
 *   `docs/OPEN-QUESTIONS.md`에만 두고, 손님에게 보이는 값에는 넣지 않는다.
 * - 서랍 순서는 동점을 나눠 갖도록 섞었다. 동점이 끝까지 가면 앞 서랍이 이긴다.
 * - 예시 책은 운영자가 CSV로 실제 책을 올리기 전까지 주인 확인 화면을 채우는 자리다.
 */
const drawer = (id: string, name: string, questions: [string, string]): Drawer => ({
  id,
  name,
  questions,
  books: [1, 2, 3].map((n) => ({
    id: `${id}-book-${n}`,
    title: `${name} ${n}`,
    author: "책방79-1",
    publisher: "",
  })),
});

export const SEED_DRAWERS: readonly Drawer[] = [
  drawer("B6", "삶의 방식을 바꾸는 책", [
    "요즘 생활에서 뭔가를 바꾸고 싶다",
    "읽은 책을 삶에 써 보고 싶다",
  ]),
  drawer("B1", "나를 들여다보는 책", [
    "나는 어떤 사람인지 자주 생각한다",
    "내 마음이 무엇을 원하는지 알고 싶다",
  ]),
  drawer("B4", "사회를 이해하는 책", [
    "요즘 사회 문제가 자꾸 마음에 걸린다",
    "뉴스에서 본 문제를 더 알고 싶다",
  ]),
  drawer("B2", "관계를 다시 생각하는 책", [
    "요즘 가까운 사람과의 거리가 고민이다",
    "관계에서 내 태도를 돌아보고 싶다",
  ]),
  drawer("B7", "잠시 멈춰 생각하는 책", [
    "잠시 멈추고 생각할 시간이 필요하다",
    "예술이나 철학 이야기가 끌린다",
  ]),
  drawer("B3", "다른 삶을 만나는 책", [
    "나와 다른 삶을 사는 사람이 궁금하다",
    "내가 당연하게 여긴 삶을 다시 보고 싶다",
  ]),
  drawer("B5", "세계를 넓혀 보는 책", [
    "역사나 과학 이야기가 궁금하다",
    "내가 사는 세계가 어떻게 돌아가는지 알고 싶다",
  ]),
];

export const SEED_QUESTION_SET: QuestionSet = questionSetFrom(SEED_DRAWERS);

/** 시드 점검에 쓰는 고정 난수 시드. 79는 책방 이름에서 가져왔다. */
export const SEED_RANDOM_SEED = 79;
