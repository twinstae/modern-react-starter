import type { AnswerValue } from "./answer.ts";
import { cite, type Citation } from "./citation.ts";
import type { DrawerId, QuestionSet, QuestionSetDrawer } from "./question-set.ts";
import { drawerOrder } from "./question-set.ts";
import { rank, type Ranking } from "./rank.ts";
import { scoreItemMean } from "./scoring/item-mean.ts";
import type { DrawerScores } from "./scoring/index.ts";
import {
  parseNickname,
  renderStatement,
  SECOND_STATEMENT_TEMPLATE,
  STATEMENT_TEMPLATE,
} from "./statement.ts";

/** 손님에게 보이는 큐레이션 결과. 점수·서랍 id·서랍 속 책이 없다(I-9). */
export interface CustomerCuration {
  readonly firstStatement: string;
  readonly secondStatement: string;
  readonly recommendedDrawerName: string;
  readonly citation: string;
}

/** 내부 큐레이션. 손님 view model과 함께 순위·점수를 들고 있어 주인 확인이 쓴다. */
export interface Curation {
  readonly drawers: readonly QuestionSetDrawer[];
  readonly scores: DrawerScores;
  readonly ranking: Ranking;
  readonly statements: { readonly first: string; readonly second: string };
  readonly citation: Citation;
  readonly customer: CustomerCuration;
}

function drawerOf(questionSet: QuestionSet, id: DrawerId): QuestionSetDrawer {
  const drawer = questionSet.drawers.find((entry) => entry.id === id);
  if (drawer === undefined) throw new Error(`질문 세트에 없는 서랍입니다: ${id}`);
  return drawer;
}

/**
 * 답 목록을 순위·상태 문장·추천 서랍·인용으로 바꾼다. 같은 입력은 같은 결과를 낸다(I-2).
 * 추천 서랍에 인용할 답이 없으면 인용을 지어내지 않고 `NoCitationError`로 실패한다(I-8).
 */
export function curate(
  questionSet: QuestionSet,
  answers: readonly AnswerValue[],
  nickname: string,
): Curation {
  const parsedNickname = parseNickname(nickname);
  const scores = scoreItemMean(questionSet, answers);
  const ranking = rank(scores, drawerOrder(questionSet));

  const firstDrawer = drawerOf(questionSet, ranking.first);
  const secondDrawer = drawerOf(questionSet, ranking.second);
  const first = renderStatement(STATEMENT_TEMPLATE, {
    drawerName: firstDrawer.name,
    nickname: parsedNickname,
  });
  const second = renderStatement(SECOND_STATEMENT_TEMPLATE, {
    drawerName: secondDrawer.name,
    nickname: parsedNickname,
  });
  const citation = cite(questionSet, scores, ranking.first);

  return {
    drawers: questionSet.drawers,
    scores,
    ranking,
    statements: { first, second },
    citation,
    customer: {
      firstStatement: first,
      secondStatement: second,
      recommendedDrawerName: firstDrawer.name,
      citation: citation.text,
    },
  };
}
