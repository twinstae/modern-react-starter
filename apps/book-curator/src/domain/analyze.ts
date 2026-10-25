import type { AnswerValue } from "./answer.ts";
import { drawerOrder, type DrawerCode, type Question, type QuestionSet } from "./question-set.ts";
import { rank } from "./rank.ts";
import { scoreChoiceWeight } from "./scoring/choice-weight.ts";
import { scoreItemMean } from "./scoring/item-mean.ts";
import type { DrawerScores } from "./scoring/index.ts";

/**
 * 표본 크기. 7서랍·2문항 시드에서 서랍별 1순위 비율의 표본 오차가 1% 안쪽이라
 * 점검 결과가 흔들리지 않는다. 같은 시드 난수를 넣으면 늘 같은 표본이다.
 */
export const SAMPLE_SIZE = 4000;

/** PRD 부록 A-3의 쏠림 기준. 서랍마다 1순위 비율이 이 범위 안이어야 한다. */
export const FIRST_RATE_MIN = 0.1;
export const FIRST_RATE_MAX = 0.18;

/** 한 서랍의 표본 분포. 비율은 0~1이고 `count / samples`다. */
export interface DrawerRate {
  readonly drawer: DrawerCode;
  readonly firstCount: number;
  readonly firstRate: number;
  readonly topTwoCount: number;
  readonly topTwoRate: number;
}

/** 무작위 표본 또는 쌓인 응답 하나의 분포. 화면이 그대로 그릴 수 있는 숫자만 담는다. */
export interface DistributionReport {
  readonly samples: number;
  readonly decidedCount: number;
  readonly decidedRate: number;
  readonly undecidedCount: number;
  readonly undecidedRate: number;
  readonly tieBrokenByOrderCount: number;
  readonly tieBrokenByOrderRate: number;
  readonly similarCount: number;
  readonly similarRate: number;
  readonly byDrawer: readonly DrawerRate[];
}

/** 서랍 하나의 문항 수. 문항형만 센다(선택형은 별도 문항이다). */
export interface DrawerStructure {
  readonly drawer: DrawerCode;
  readonly itemCount: number;
}

/** 기준 응답의 기대 순위와 실제 순위. */
export interface BaselineResult {
  readonly name: string;
  readonly expectedFirst: DrawerCode;
  readonly expectedSecond: DrawerCode;
  readonly actualFirst: DrawerCode;
  readonly actualSecond: DrawerCode;
  readonly matches: boolean;
}

/** 질문 세트의 구조. 문항 수 균형, 빈 서랍, 기준 응답 일치를 본다. */
export interface StructureReport {
  readonly drawers: readonly DrawerStructure[];
  readonly emptyDrawers: readonly DrawerCode[];
  readonly itemCountMin: number;
  readonly itemCountMax: number;
  readonly itemCountImbalance: number;
  readonly balanced: boolean;
  readonly baselines: readonly BaselineResult[];
}

/** 점검에서 막는 이유와 경고의 종류. 화면은 코드로 문장을 고른다. */
export const GATE_ISSUE_CODES = [
  "sample-undecided",
  "sample-skew",
  "recorded-skew",
  "empty-drawer",
  "item-count-imbalance",
  "baseline-mismatch",
] as const;

export type GateIssueCode = (typeof GATE_ISSUE_CODES)[number];

export interface GateIssue {
  readonly code: GateIssueCode;
  readonly drawers: readonly DrawerCode[];
  readonly baselines: readonly string[];
}

/** 공개를 막는 실패와, 알리기만 하는 경고를 나눈다. 통과는 실패가 없을 때만이다. */
export interface GateReport {
  readonly passed: boolean;
  readonly failures: readonly GateIssue[];
  readonly warnings: readonly GateIssue[];
}

/** 공개 점검 보고. 표본과 쌓인 응답, 구조, 게이트를 한 값에 담는다. */
export interface SetReport {
  readonly sampleSize: number;
  readonly sample: DistributionReport;
  readonly recorded?: DistributionReport;
  readonly structure: StructureReport;
  readonly gate: GateReport;
}

const ratio = (count: number, total: number): number => (total === 0 ? 0 : count / total);

const score = (set: QuestionSet, answers: readonly AnswerValue[]): DrawerScores =>
  set.scoring.type === "item-mean" ? scoreItemMean(set, answers) : scoreChoiceWeight(set, answers);

const randomAnswer = (question: Question, rng: () => number): AnswerValue => {
  if (question.type === "item") {
    return 1 + Math.min(4, Math.max(0, Math.floor(rng() * 5)));
  }

  const index = Math.min(
    question.options.length - 1,
    Math.max(0, Math.floor(rng() * question.options.length)),
  );
  const option = question.options[index] ?? question.options[0];
  if (option === undefined) throw new Error("선택형 질문에 선택지가 없습니다");
  return option.id;
};

/** 질문마다 형식에 맞는 답을 하나씩 뽑는다. 소비하는 난수 순서는 질문 순서 그대로다. */
const sampleAnswers = (set: QuestionSet, rng: () => number): AnswerValue[] =>
  set.questions.map((question) => randomAnswer(question, rng));

const tieBrokenByOrder = (scores: DrawerScores, first: DrawerCode, second: DrawerCode): boolean => {
  const firstScore = scores.drawers.find(({ drawer }) => drawer === first);
  const secondScore = scores.drawers.find(({ drawer }) => drawer === second);
  if (firstScore === undefined || secondScore === undefined) return false;
  return firstScore.score === secondScore.score && firstScore.fives === secondScore.fives;
};

/**
 * 답 목록들을 같은 지표로 센다. 빈 목록이면 모든 비율이 0이다.
 * 결정 실패는 순위가 던졌을 때만 생기므로, 정상 질문 세트에서는 언제나 0이다.
 */
const distribution = (
  set: QuestionSet,
  answerLists: readonly (readonly AnswerValue[])[],
): DistributionReport => {
  const order = drawerOrder(set);
  const firstCounts = new Map<DrawerCode, number>(set.drawers.map(({ code }) => [code, 0]));
  const topTwoCounts = new Map<DrawerCode, number>(set.drawers.map(({ code }) => [code, 0]));
  let decided = 0;
  let tieOrder = 0;
  let similar = 0;

  for (const answers of answerLists) {
    const scores = score(set, answers);
    const ranking = rank(scores, order);
    decided += 1;
    if (tieBrokenByOrder(scores, ranking.first, ranking.second)) tieOrder += 1;
    if (ranking.similar) similar += 1;
    firstCounts.set(ranking.first, (firstCounts.get(ranking.first) ?? 0) + 1);
    topTwoCounts.set(ranking.first, (topTwoCounts.get(ranking.first) ?? 0) + 1);
    topTwoCounts.set(ranking.second, (topTwoCounts.get(ranking.second) ?? 0) + 1);
  }

  const samples = answerLists.length;
  const undecided = samples - decided;

  return {
    samples,
    decidedCount: decided,
    decidedRate: ratio(decided, samples),
    undecidedCount: undecided,
    undecidedRate: ratio(undecided, samples),
    tieBrokenByOrderCount: tieOrder,
    tieBrokenByOrderRate: ratio(tieOrder, samples),
    similarCount: similar,
    similarRate: ratio(similar, samples),
    byDrawer: set.drawers.map(({ code }) => {
      const firstCount = firstCounts.get(code) ?? 0;
      const topTwoCount = topTwoCounts.get(code) ?? 0;
      return {
        drawer: code,
        firstCount,
        firstRate: ratio(firstCount, samples),
        topTwoCount,
        topTwoRate: ratio(topTwoCount, samples),
      };
    }),
  };
};

const structureOf = (set: QuestionSet): StructureReport => {
  const order = drawerOrder(set);
  const drawers = set.drawers.map(({ code }) => ({
    drawer: code,
    itemCount: set.questions.filter(
      (question) => question.type === "item" && question.drawer === code,
    ).length,
  }));
  const counts = drawers.map(({ itemCount }) => itemCount);
  const itemCountMin = counts.length === 0 ? 0 : Math.min(...counts);
  const itemCountMax = counts.length === 0 ? 0 : Math.max(...counts);

  return {
    drawers,
    emptyDrawers: drawers.filter(({ itemCount }) => itemCount === 0).map(({ drawer }) => drawer),
    itemCountMin,
    itemCountMax,
    itemCountImbalance: itemCountMax - itemCountMin,
    balanced: itemCountMin === itemCountMax,
    baselines: set.baselines.map(({ name, answers, expected }) => {
      const ranking = rank(score(set, answers), order);
      return {
        name,
        expectedFirst: expected.first,
        expectedSecond: expected.second,
        actualFirst: ranking.first,
        actualSecond: ranking.second,
        matches: ranking.first === expected.first && ranking.second === expected.second,
      };
    }),
  };
};

const skewedDrawers = (report: DistributionReport): DrawerCode[] =>
  report.byDrawer
    .filter(({ firstRate }) => firstRate < FIRST_RATE_MIN || firstRate > FIRST_RATE_MAX)
    .map(({ drawer }) => drawer);

const gateOf = (
  sample: DistributionReport,
  recorded: DistributionReport | undefined,
  structure: StructureReport,
): GateReport => {
  const failures: GateIssue[] = [];
  const warnings: GateIssue[] = [];

  if (sample.undecidedCount > 0) {
    failures.push({ code: "sample-undecided", drawers: [], baselines: [] });
  }

  const sampleSkew = skewedDrawers(sample);
  if (sampleSkew.length > 0) {
    failures.push({ code: "sample-skew", drawers: sampleSkew, baselines: [] });
  }

  if (recorded !== undefined && recorded.samples > 0) {
    const recordedSkew = skewedDrawers(recorded);
    if (recordedSkew.length > 0) {
      warnings.push({ code: "recorded-skew", drawers: recordedSkew, baselines: [] });
    }
  }

  if (structure.emptyDrawers.length > 0) {
    failures.push({ code: "empty-drawer", drawers: structure.emptyDrawers, baselines: [] });
  }

  if (!structure.balanced) {
    warnings.push({
      code: "item-count-imbalance",
      drawers: structure.drawers
        .filter(({ itemCount }) => itemCount < structure.itemCountMax)
        .map(({ drawer }) => drawer),
      baselines: [],
    });
  }

  if (structure.baselines.some(({ matches }) => !matches)) {
    const mismatched = structure.baselines.filter(({ matches }) => !matches);
    failures.push({
      code: "baseline-mismatch",
      drawers: mismatched.flatMap(({ expectedFirst, expectedSecond }) => [
        expectedFirst,
        expectedSecond,
      ]),
      baselines: mismatched.map(({ name }) => name),
    });
  }

  return { passed: failures.length === 0, failures, warnings };
};

/**
 * 질문 세트를 점검한다. 표본은 주입한 난수로 만들고, 쌓인 응답이 있으면 같은 지표를
 * 나란히 낸다. 같은 시드의 새 난수를 넣으면 같은 보고가 나온다.
 * 쌓인 응답의 쏠림은 지금은 경고다. R-3에 따라 50~100건이 쌓이면 실제 분포를 기준으로 본다.
 */
export function analyze(
  set: QuestionSet,
  rng: () => number,
  recorded?: readonly (readonly AnswerValue[])[],
): SetReport {
  const sample = distribution(
    set,
    Array.from({ length: SAMPLE_SIZE }, () => sampleAnswers(set, rng)),
  );
  const recordedReport = recorded === undefined ? undefined : distribution(set, recorded);
  const structure = structureOf(set);

  return {
    sampleSize: SAMPLE_SIZE,
    sample,
    ...(recordedReport === undefined ? {} : { recorded: recordedReport }),
    structure,
    gate: gateOf(sample, recordedReport, structure),
  };
}
