import fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";

import type { AnswerValue } from "./answer.ts";
import { analyze } from "./analyze.ts";
import { cite, NoCitationError } from "./citation.ts";
import { curate } from "./curate.ts";
import { drawerBooksView } from "./owner-view.ts";
import {
  drawerOrder,
  parseQuestionSet,
  parseQuestionSetJson,
  toQuestionSetJson,
  type DrawerCode,
  type QuestionSet,
} from "./question-set.ts";
import {
  answeredQuestionSetArbitrary,
  curatableAnsweredQuestionSetArbitrary,
  interactionSequenceArbitrary,
  questionSetArbitrary,
} from "./question-set.arbitrary.ts";
import { shelvedAnsweredQuestionSetArbitrary } from "./shelf.arbitrary.ts";
import { seededRng } from "./random.ts";
import { rank } from "./rank.ts";
import { scoreChoiceWeight } from "./scoring/choice-weight.ts";
import { scoreItemMean } from "./scoring/item-mean.ts";
import { parseDrawerScores, type DrawerScores } from "./scoring/index.ts";
import { answer, back, startTurn } from "./turn.ts";

const score = (questionSet: QuestionSet, answers: readonly AnswerValue[]): DrawerScores =>
  questionSet.scoring.type === "item-mean"
    ? scoreItemMean(questionSet, answers)
    : scoreChoiceWeight(questionSet, answers);

const scoreOf = (scores: DrawerScores, drawer: DrawerCode): number => {
  const found = scores.drawers.find((entry) => entry.drawer === drawer);
  if (found === undefined) throw new Error(`서랍 점수가 없습니다: ${drawer}`);
  return found.score;
};

const scoresByDrawer = (scores: DrawerScores) =>
  new Map(scores.drawers.map(({ drawer, score }) => [drawer, score]));

const shapeOf = (scores: DrawerScores) => ({
  keys: Object.keys(scores).sort(),
  drawers: scores.drawers.map(({ drawer }) => drawer),
  drawerKeys: scores.drawers.map((drawer) => Object.keys(drawer).sort()),
});

describe("큐레이션 코어 속성", () => {
  it("무작위 질문 세트와 답에서도 1·2순위는 늘 서로 다른 두 서랍이다(I-1, I-5)", () => {
    fc.assert(
      fc.property(answeredQuestionSetArbitrary, ({ questionSet, answers }) => {
        const ranking = rank(score(questionSet, answers), drawerOrder(questionSet));
        const codes = questionSet.drawers.map(({ code }) => code);

        expect(ranking.first).not.toBe(ranking.second);
        expect(codes).toContain(ranking.first);
        expect(codes).toContain(ranking.second);
      }),
    );
  });

  it("답하기·되돌아가기 무작위열의 결과는 최종 답을 바로 한 결과와 같다(I-3)", () => {
    fc.assert(
      fc.property(interactionSequenceArbitrary, ({ questionSet, interactions }) => {
        let turn = startTurn("토끼", "session-1");
        const finalAnswers: AnswerValue[] = [];

        for (const interaction of interactions) {
          if (interaction.type === "answer") {
            turn = answer(questionSet, turn, interaction.value);
            finalAnswers.push(interaction.value);
          } else {
            turn = back(turn);
            finalAnswers.pop();
          }
        }

        expect(turn.answers).toStrictEqual(finalAnswers);
        expect(rank(score(questionSet, turn.answers), drawerOrder(questionSet))).toStrictEqual(
          rank(score(questionSet, finalAnswers), drawerOrder(questionSet)),
        );
      }),
    );
  });

  it("한 서랍의 문항 답을 올리면 그 서랍 점수는 내려가지 않는다(반대 문항 제외)", () => {
    fc.assert(
      fc.property(answeredQuestionSetArbitrary, ({ questionSet, answers }) => {
        const before = scoreItemMean(questionSet, answers);

        questionSet.questions.forEach((question, index) => {
          if (question.type !== "item" || question.reversed) return;
          const value = answers[index];
          if (typeof value !== "number" || value === 5) return;

          const raised = [...answers];
          raised[index] = value + 1;
          const after = scoreItemMean(questionSet, raised);

          expect(scoreOf(after, question.drawer)).toBeGreaterThanOrEqual(
            scoreOf(before, question.drawer),
          );
        });
      }),
    );
  });

  it("문항 순서를 바꿔도 서랍 점수는 같다", () => {
    const permutedArbitrary = answeredQuestionSetArbitrary.chain(({ questionSet, answers }) =>
      fc
        .shuffledSubarray([...questionSet.questions.keys()], {
          minLength: questionSet.questions.length,
          maxLength: questionSet.questions.length,
        })
        .map((order) => ({ questionSet, answers, order })),
    );

    fc.assert(
      fc.property(permutedArbitrary, ({ questionSet, answers, order }) => {
        const permutedSet = parseQuestionSet({
          drawers: questionSet.drawers,
          questions: order.map((index) => questionSet.questions[index]),
          scoring: questionSet.scoring,
        });
        const permutedAnswers = order.map((index) => answers[index]);

        expect(scoresByDrawer(scoreItemMean(permutedSet, permutedAnswers))).toStrictEqual(
          scoresByDrawer(scoreItemMean(questionSet, answers)),
        );
      }),
    );
  });

  it("item-mean과 choice-weight는 같은 서랍 점수 모양을 내고 순위는 점수에만 달린다(I-6)", () => {
    fc.assert(
      fc.property(answeredQuestionSetArbitrary, ({ questionSet, answers }) => {
        const itemScores = scoreItemMean(questionSet, answers);
        const choiceScores = scoreChoiceWeight(questionSet, answers);

        expect(shapeOf(itemScores)).toStrictEqual(shapeOf(choiceScores));
        expect(parseDrawerScores(itemScores)).toStrictEqual(itemScores);
        expect(parseDrawerScores(choiceScores)).toStrictEqual(choiceScores);

        const relabeled = parseDrawerScores({
          scoring: "learned",
          drawers: itemScores.drawers.map((drawer) => ({ ...drawer, contributions: [] })),
        });
        const order = drawerOrder(questionSet);

        expect(rank(relabeled, order)).toStrictEqual(rank(itemScores, order));
      }),
    );
  });

  it("관리자 서랍 순서는 점수와 5의 수가 모두 같을 때만 순위를 바꾼다(I-4)", () => {
    fc.assert(
      fc.property(answeredQuestionSetArbitrary, ({ questionSet, answers }) => {
        const scores = score(questionSet, answers);
        const order = drawerOrder(questionSet);
        const ranking = rank(scores, order);
        const first = scores.drawers.find(({ drawer }) => drawer === ranking.first);
        const second = scores.drawers.find(({ drawer }) => drawer === ranking.second);
        if (first === undefined || second === undefined) throw new Error("순위 서랍이 없습니다");

        const swapped = order.map((drawer) =>
          drawer === ranking.first
            ? ranking.second
            : drawer === ranking.second
              ? ranking.first
              : drawer,
        );
        const flipped = rank(scores, swapped);

        if (first.score === second.score && first.fives === second.fives) {
          expect([flipped.first, flipped.second]).toStrictEqual([ranking.second, ranking.first]);
        } else {
          expect(flipped.first).toBe(ranking.first);
        }
      }),
    );
  });

  it("공개 점검을 통과한 질문 세트는 어떤 답 목록에서도 순위가 정해진다(I-1, I-5)", () => {
    fc.assert(
      fc.property(answeredQuestionSetArbitrary, ({ questionSet, answers }) => {
        const report = analyze(questionSet, seededRng(79));

        if (!report.gate.passed) return;

        const ranking = rank(score(questionSet, answers), drawerOrder(questionSet));
        const codes = questionSet.drawers.map(({ code }) => code);

        expect(ranking.first).not.toBe(ranking.second);
        expect(codes).toContain(ranking.first);
        expect(codes).toContain(ranking.second);
      }),
      { numRuns: 30 },
    );
  });

  it("같은 입력은 같은 순위를 내고 질문 세트 JSON 왕복이 같다(I-2)", () => {
    fc.assert(
      fc.property(answeredQuestionSetArbitrary, ({ questionSet, answers }) => {
        const order = drawerOrder(questionSet);
        expect(rank(score(questionSet, answers), order)).toStrictEqual(
          rank(score(questionSet, answers), order),
        );
      }),
    );

    fc.assert(
      fc.property(questionSetArbitrary, (questionSet) => {
        expect(parseQuestionSetJson(toQuestionSetJson(questionSet))).toStrictEqual(questionSet);
      }),
    );
  });

  it("인용된 답은 손님이 실제로 한 답이고 추천 서랍에 가장 크게 기여한다(I-8)", () => {
    fc.assert(
      fc.property(curatableAnsweredQuestionSetArbitrary, ({ questionSet, answers }) => {
        const curation = curate(questionSet, answers, "토끼");
        const { citation, ranking, scores } = curation;
        const drawerScore = scores.drawers.find(({ drawer }) => drawer === ranking.first);
        if (drawerScore === undefined) throw new Error("추천 서랍 점수가 없습니다");

        const contribution = drawerScore.contributions.find(
          ({ question }) => question === citation.question,
        );
        if (contribution === undefined) throw new Error("인용한 답의 기여가 없습니다");

        const bestPositive = drawerScore.contributions.reduce(
          (best, { value }) => (value > 0 && value > best ? value : best),
          0,
        );

        expect(citation.drawer).toBe(ranking.first);
        expect(answers[citation.question]).toBe(citation.answer);
        expect(contribution.answer).toBe(citation.answer);
        expect(contribution.value).toBeGreaterThan(0);
        expect(contribution.value).toBe(bestPositive);
      }),
    );
  });

  it("추천 서랍에 긍정 기여가 없으면 인용을 지어내지 않고 이름 있는 오류로 실패한다(I-8)", () => {
    fc.assert(
      fc.property(answeredQuestionSetArbitrary, ({ questionSet, answers }) => {
        const scores = score(questionSet, answers);
        const ranking = rank(scores, drawerOrder(questionSet));
        const drawerScore = scores.drawers.find(({ drawer }) => drawer === ranking.first);
        if (drawerScore === undefined) throw new Error("추천 서랍 점수가 없습니다");

        const positive = drawerScore.contributions.filter(({ value }) => value > 0);
        if (positive.length > 0) return;

        expect(() => cite(questionSet, scores, ranking.first)).toThrow(NoCitationError);
      }),
    );
  });

  it("큐레이션 결과는 결정적이고 손님 view model에 점수와 서랍 코드가 없다(I-2, I-9)", () => {
    fc.assert(
      fc.property(curatableAnsweredQuestionSetArbitrary, ({ questionSet, answers }) => {
        const first = curate(questionSet, answers, "토끼");
        const second = curate(questionSet, answers, "토끼");

        expect(first.customer).toStrictEqual(second.customer);
        expect(first.customer.firstStatement).toContain("토끼 님");
        expect(JSON.stringify(first.customer)).not.toMatch(/\bB[1-7]\b/);
        expect(Object.keys(first.customer).sort()).toStrictEqual([
          "citation",
          "firstStatement",
          "recommendedDrawerName",
          "recommendedMark",
          "recommendedReason",
          "recommendedStatement",
          "secondStatement",
        ]);
      }),
    );
  });

  it("무작위 서가와 순위에서도 손님 view model에는 건넨 서랍의 책만 있다(I-9)", () => {
    fc.assert(
      fc.property(shelvedAnsweredQuestionSetArbitrary, ({ questionSet, answers, books, stock }) => {
        const curation = curate(questionSet, answers, "토끼");
        const handed = questionSet.drawers.find(({ code }) => code === curation.ranking.first);
        if (handed === undefined) throw new Error("추천 서랍이 질문 세트에 없습니다");

        const view = drawerBooksView(handed, stock, books);
        const expected = stock
          .filter((entry) => entry.drawer === handed.code)
          .map((entry) => {
            const book = books.find(({ id }) => id === entry.bookId);
            if (book === undefined) throw new Error("서가에 없는 책입니다");
            return {
              title: book.title,
              author: book.author,
              reason: book.reason,
              question: book.question,
              quantity: entry.quantity,
            };
          });

        expect(view).toStrictEqual(expected);
        expect(Object.keys(view[0] ?? {}).sort()).toStrictEqual([
          "author",
          "quantity",
          "question",
          "reason",
          "title",
        ]);
        expect(JSON.stringify(view)).not.toMatch(/\bB[1-7]\b/);

        const viewTitles = new Set(view.map(({ title }) => title));
        const handedTitles = new Set(expected.map(({ title }) => title));
        for (const entry of stock) {
          if (entry.drawer === handed.code) continue;
          const book = books.find(({ id }) => id === entry.bookId);
          if (book === undefined) throw new Error("서가에 없는 책입니다");
          if (handedTitles.has(book.title)) continue;
          expect(viewTitles.has(book.title)).toBe(false);
        }
      }),
    );
  });
});
