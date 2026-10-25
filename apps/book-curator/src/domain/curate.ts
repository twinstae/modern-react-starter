import type { AnswerValue } from "./answer.ts";
import { cite, type Citation } from "./citation.ts";
import type { Drawer, DrawerCode, QuestionSet } from "./question-set.ts";
import { drawerOrder } from "./question-set.ts";
import { rank, type Ranking } from "./rank.ts";
import { scoreChoiceWeight } from "./scoring/choice-weight.ts";
import { scoreItemMean } from "./scoring/item-mean.ts";
import type { DrawerScores } from "./scoring/index.ts";
import { parseNickname, renderStatement } from "./statement.ts";

/**
 * 손님에게 보이는 큐레이션 결과. 점수·서랍 코드·다른 서랍의 책이 없다(I-9).
 * 책을 권하는 이유는 서가를 아는 TICKET-00005/00007이 더한다.
 */
export interface CustomerCuration {
  readonly firstStatement: string;
  readonly secondStatement: string;
  readonly recommendedDrawerName: string;
  readonly recommendedStatement: string;
  readonly citation: string;
}

/**
 * 내부 큐레이션. 손님 view model과 함께 순위·점수·서랍 정의를 들고 있어
 * 주인 확인(TICKET-00005)이 서가를 붙일 수 있다. 서가 자체는 모른다.
 */
export interface Curation {
  readonly drawers: readonly Drawer[];
  readonly scores: DrawerScores;
  readonly ranking: Ranking;
  readonly statements: {
    readonly first: string;
    readonly second: string;
    readonly recommended: string;
  };
  readonly citation: Citation;
  readonly customer: CustomerCuration;
}

function score(questionSet: QuestionSet, answers: readonly AnswerValue[]): DrawerScores {
  return questionSet.scoring.type === "item-mean"
    ? scoreItemMean(questionSet, answers)
    : scoreChoiceWeight(questionSet, answers);
}

function drawerOf(questionSet: QuestionSet, code: DrawerCode): Drawer {
  const drawer = questionSet.drawers.find((entry) => entry.code === code);
  if (drawer === undefined) throw new Error(`질문 세트에 없는 서랍입니다: ${code}`);
  return drawer;
}

function statementFor(questionSet: QuestionSet, drawer: Drawer, nickname: string): string {
  return renderStatement(drawer.statement ?? questionSet.statementTemplate, {
    drawerName: drawer.name,
    nickname,
  });
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
  const scores = score(questionSet, answers);
  const ranking = rank(scores, drawerOrder(questionSet));

  const firstDrawer = drawerOf(questionSet, ranking.first);
  const secondDrawer = drawerOf(questionSet, ranking.second);
  const first = statementFor(questionSet, firstDrawer, parsedNickname);
  const second = statementFor(questionSet, secondDrawer, parsedNickname);
  const citation = cite(questionSet, scores, ranking.first);

  return {
    drawers: questionSet.drawers,
    scores,
    ranking,
    statements: { first, second, recommended: first },
    citation,
    customer: {
      firstStatement: first,
      secondStatement: second,
      recommendedDrawerName: firstDrawer.name,
      recommendedStatement: first,
      citation: citation.text,
    },
  };
}
