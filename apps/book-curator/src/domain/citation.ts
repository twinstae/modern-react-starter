import type { AnswerValue } from "./answer.ts";
import type { DrawerCode, QuestionSet } from "./question-set.ts";
import type { Contribution, DrawerScores } from "./scoring/index.ts";
import { renderCitation } from "./statement.ts";

/**
 * 추천 서랍에 실제로 기여한 답 하나를 가리킨다. `quote`는 문항 문장이거나
 * 선택지 문장이고, `text`는 질문 세트의 인용 문형에 `quote`를 넣은 문장이다.
 */
export interface Citation {
  readonly question: number;
  readonly drawer: DrawerCode;
  readonly answer: AnswerValue;
  readonly quote: string;
  readonly text: string;
}

/** 추천 서랍에 인용할 만한 긍정 기여가 없을 때 던지는 이름 있는 오류. */
export class NoCitationError extends Error {
  constructor(drawer: DrawerCode) {
    super(`추천 서랍에 인용할 답이 없습니다: ${drawer}`);
    this.name = "NoCitationError";
  }
}

/**
 * 기여 중 가장 큰 값을 고른다. 값이 같으면 문항 순서가 빠른 답을 고른다.
 * 0이나 음수 기여는 권하는 이유로 쓰지 않는다.
 */
export function chooseContribution(
  contributions: readonly Contribution[],
): Contribution | undefined {
  return contributions
    .filter(({ value }) => value > 0)
    .reduce<Contribution | undefined>(
      (best, contribution) =>
        best === undefined ||
        contribution.value > best.value ||
        (contribution.value === best.value && contribution.question < best.question)
          ? contribution
          : best,
      undefined,
    );
}

function quoteOf(questionSet: QuestionSet, contribution: Contribution): string {
  const question = questionSet.questions[contribution.question];
  if (question === undefined) {
    throw new NoCitationError(contribution.drawer);
  }

  if (question.type === "item") return question.text;

  const option = question.options.find(({ id }) => id === contribution.answer);
  if (option === undefined) throw new NoCitationError(contribution.drawer);
  return option.text;
}

/**
 * 추천 서랍의 인용을 고른다. 점수에 실제로 남은 답 중 긍정 기여가 가장 큰 것을 쓰고,
 * 문항형·선택형에 맞는 인용 문형으로 감싼다. 인용할 답이 없으면 만들지 않고 실패한다(I-8).
 */
export function cite(questionSet: QuestionSet, scores: DrawerScores, drawer: DrawerCode): Citation {
  const drawerScore = scores.drawers.find((entry) => entry.drawer === drawer);
  if (drawerScore === undefined) throw new NoCitationError(drawer);

  const contribution = chooseContribution(drawerScore.contributions);
  if (contribution === undefined) throw new NoCitationError(drawer);

  const question = questionSet.questions[contribution.question];
  if (question === undefined) throw new NoCitationError(drawer);

  const quote = quoteOf(questionSet, contribution);
  const template =
    question.type === "item"
      ? questionSet.citationTemplates.item
      : questionSet.citationTemplates.choice;

  return {
    question: contribution.question,
    drawer,
    answer: contribution.answer,
    quote,
    text: renderCitation(template, { quote }),
  };
}
