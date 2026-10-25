import type { DrawerCode } from "./question-set.ts";
import type { DrawerScores } from "./scoring/index.ts";

/**
 * 1·2순위 점수 차이가 이 값 이하이면 "비슷함"으로 표시한다.
 * 표시일 뿐 순위를 바꾸지 않는다. 운영하며 조정할 수 있는 작은 값이다.
 */
export const SIMILAR_SCORE_GAP = 0.5;

/** 서랍 1·2순위와 "비슷함" 표시. 순위를 정하는 데 점수와 5의 수, 서랍 순서만 쓴다. */
export interface Ranking {
  readonly first: DrawerCode;
  readonly second: DrawerCode;
  readonly similar: boolean;
}

const orderIndex = (order: readonly DrawerCode[], drawer: DrawerCode): number => {
  const index = order.indexOf(drawer);
  return index === -1 ? order.length : index;
};

/**
 * 서랍 점수에서 1·2순위를 정한다. 높은 점수 → 유효한 5가 많은 쪽 →
 * 관리자가 정한 서랍 순서. 점수와 순서가 끝까지 같아도 서랍 코드로 안정 정렬해
 * 같은 입력이 늘 같은 순위를 낸다(I-2, I-4).
 */
export function rank(scores: DrawerScores, order: readonly DrawerCode[]): Ranking {
  const [first, second] = [...scores.drawers].sort(
    (a, b) =>
      b.score - a.score ||
      b.fives - a.fives ||
      orderIndex(order, a.drawer) - orderIndex(order, b.drawer) ||
      a.drawer.localeCompare(b.drawer),
  );

  if (first === undefined || second === undefined) {
    throw new Error("순위를 정하려면 서랍 점수가 둘 이상이어야 합니다");
  }

  return {
    first: first.drawer,
    second: second.drawer,
    similar: first.score - second.score <= SIMILAR_SCORE_GAP,
  };
}
