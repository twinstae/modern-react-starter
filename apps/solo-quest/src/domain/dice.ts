import * as v from "valibot";

/** 한 판정에서 굴릴 수 있는 주사위 수의 상한 */
export const MAX_DICE = 100;
/** 주사위 하나의 면 수 상한 */
export const MAX_SIDES = 1000;

/** 굴리기 전의 항. 빼는 항은 sign이 -1이다. */
export type DiceTerm =
  | { type: "dice"; sign: 1 | -1; count: number; sides: number }
  | { type: "fate"; sign: 1 | -1; count: number }
  | { type: "constant"; sign: 1 | -1; value: number };

export type NotationResult = { ok: true; terms: DiceTerm[] } | { ok: false; message: string };

const DICE_TERM = /^(\d*)d(\d+)$/i;
const FATE_TERM = /^(\d*)df$/i;

/** 항 목록에서 굴릴 주사위 수 */
const countDice = (terms: DiceTerm[]) =>
  terms.reduce((sum, term) => sum + (term.type === "constant" ? 0 : term.count), 0);
const CONSTANT_TERM = /^\d+$/;

/**
 * 표기를 항 목록으로 바꾼다. 항은 `NdM`, `NdF`(N을 생략하면 1)나 정수 상수이고 `+`/`-`로 잇는다.
 * 대소문자는 구분하지 않는다.
 */
export function parseNotation(text: string): NotationResult {
  const invalid: NotationResult = {
    ok: false,
    message: `주사위 표기가 올바르지 않습니다: ${text}`,
  };

  const terms: DiceTerm[] = [];
  // 부호 앞에서 잘라 부호가 항에 붙게 한다: "3d6-2+1d4" → "3d6", "-2", "+1d4"
  for (const [index, token] of text.split(/(?=[+-])/).entries()) {
    const hasSign = token.startsWith("+") || token.startsWith("-");
    if (index === 0 && hasSign) return invalid;
    const sign = token.startsWith("-") ? -1 : 1;
    const body = hasSign ? token.slice(1) : token;

    const diceMatch = DICE_TERM.exec(body);
    const fateMatch = FATE_TERM.exec(body);
    if (fateMatch) {
      const count = fateMatch[1] === "" ? 1 : Number(fateMatch[1]);
      if (count < 1) return invalid;
      terms.push({ type: "fate", sign, count });
    } else if (diceMatch) {
      const count = diceMatch[1] === "" ? 1 : Number(diceMatch[1]);
      const sides = Number(diceMatch[2]);
      if (count < 1 || sides < 1) return invalid;
      terms.push({ type: "dice", sign, count, sides });
    } else if (CONSTANT_TERM.test(body)) {
      terms.push({ type: "constant", sign, value: Number(body) });
    } else {
      return invalid;
    }
  }

  if (countDice(terms) > MAX_DICE) {
    return { ok: false, message: `주사위는 모두 ${MAX_DICE}개까지 굴릴 수 있습니다` };
  }
  if (terms.some((term) => term.type === "dice" && term.sides > MAX_SIDES)) {
    return { ok: false, message: `주사위 면은 ${MAX_SIDES}개까지 쓸 수 있습니다` };
  }
  return { ok: true, terms };
}

/** 비교 연산자. `>`, `>=`는 액션 점수가 커야, `<`, `<=`는 작아야 이긴다. */
export const COMPARE_OPS = [">", ">=", "<", "<="] as const;

export type CompareOp = (typeof COMPARE_OPS)[number];

/** 비교 판정의 목표. 도전 주사위는 하나씩 견주고, 목표치는 한 번 견준다. */
export type Against =
  | { type: "dice"; count: number; sides: number }
  | { type: "number"; value: number };

/** 비교 판정에서 액션 점수를 견줄 방법. `cap`은 액션 점수의 상한이다. */
export interface Check {
  op: CompareOp;
  cap?: number;
  against: Against;
}

/** 굴리기 전의 판정. 비교 판정이면 `check`가 있고, `terms`는 액션 쪽이다. */
export interface RollPlan {
  terms: DiceTerm[];
  check?: Check;
}

export type RollPlanResult = { ok: true; plan: RollPlan } | { ok: false; message: string };

const CAP_TOKEN = /^max(\d+)$/i;
const TARGET_NUMBER = /^\d+(\*\d+)*$/;

const isCompareOp = (token: string | undefined): token is CompareOp =>
  COMPARE_OPS.some((op) => op === token);

/** 목표를 읽는다. `NdM` 하나는 도전 주사위, 정수나 정수의 곱은 목표치다. */
function parseAgainst(text: string): Against | undefined {
  if (TARGET_NUMBER.test(text)) {
    return { type: "number", value: text.split("*").reduce((a, b) => a * Number(b), 1) };
  }
  const parsed = parseNotation(text);
  const [term] = parsed.ok ? parsed.terms : [];
  if (!parsed.ok || parsed.terms.length !== 1 || term?.type !== "dice" || term.sign !== 1) {
    return undefined;
  }
  return { type: "dice", count: term.count, sides: term.sides };
}

/**
 * 판정 표기를 판정 계획으로 바꾼다. `<표기>[ max<N>][ <비교> <목표>]`이고, 비교가 없으면 표기 그대로다.
 * 낱말은 공백으로 가르고, 대소문자는 구분하지 않는다.
 */
export function parseRoll(text: string): RollPlanResult {
  const [action = "", ...rest] = text.trim().split(/\s+/);
  const parsed = parseNotation(action);
  if (!parsed.ok) return parsed;
  if (rest.length === 0) return { ok: true, plan: { terms: parsed.terms } };

  const capMatch = CAP_TOKEN.exec(rest[0] ?? "");
  const cap = capMatch ? Number(capMatch[1]) : undefined;
  const [op, targetText, ...extra] = capMatch ? rest.slice(1) : rest;
  if (!isCompareOp(op) || extra.length > 0) {
    return { ok: false, message: `판정 표기가 올바르지 않습니다: ${text}` };
  }
  if (cap !== undefined && cap < 1) {
    return { ok: false, message: "max 뒤에는 1 이상의 상한을 적어주세요" };
  }

  const against = parseAgainst(targetText ?? "");
  if (!against) {
    return {
      ok: false,
      message: "목표에는 2d10 같은 도전 주사위 하나나 9, 3*3 같은 목표치를 적어주세요",
    };
  }
  const targetDice = against.type === "dice" ? against.count : 0;
  if (countDice(parsed.terms) + targetDice > MAX_DICE) {
    return { ok: false, message: `주사위는 모두 ${MAX_DICE}개까지 굴릴 수 있습니다` };
  }
  return {
    ok: true,
    plan: { terms: parsed.terms, check: { op, ...(cap !== undefined && { cap }), against } },
  };
}

const Sign = v.picklist([1, -1]);
const Positive = v.pipe(v.number(), v.integer(), v.minValue(1));

/** 굴린 뒤의 항. 주사위 값을 그대로 들고 있어, 기록을 다시 굴리지 않고 보여 줄 수 있다. */
export const RolledTerm = v.variant("type", [
  v.object({
    type: v.literal("dice"),
    sign: Sign,
    sides: Positive,
    values: v.array(Positive),
  }),
  /** Fate 주사위. 값은 -1, 0, +1이다. */
  v.object({
    type: v.literal("fate"),
    sign: Sign,
    values: v.array(v.picklist([-1, 0, 1])),
  }),
  v.object({
    type: v.literal("constant"),
    sign: Sign,
    value: v.pipe(v.number(), v.integer(), v.minValue(0)),
  }),
]);

export type RolledTerm = v.InferOutput<typeof RolledTerm>;

/** 굴린 뒤의 비교. 도전 주사위는 굴린 값을 들고 있다. 판정 값은 저장하지 않고 `judgeRoll`로 계산한다. */
export const RolledCheck = v.object({
  op: v.picklist(COMPARE_OPS),
  cap: v.optional(Positive),
  against: v.variant("type", [
    v.object({ type: v.literal("dice"), sides: Positive, values: v.array(Positive) }),
    v.object({ type: v.literal("number"), value: v.pipe(v.number(), v.integer(), v.minValue(0)) }),
  ]),
});

export type RolledCheck = v.InferOutput<typeof RolledCheck>;

export interface RollResult {
  terms: RolledTerm[];
  /** 액션 쪽 합계. 상한을 적용하기 전이다. */
  total: number;
  check?: RolledCheck;
}

/** 0 이상 1 미만의 값을 내는 함수 */
export type Random = () => number;

/** 굴린 항이 합계에 더하는 값. 빼는 항은 음수다. */
const termTotal = (term: RolledTerm) =>
  term.sign * (term.type === "constant" ? term.value : sum(term.values));

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Fate 주사위 하나: 난수를 셋으로 나눠 -1, 0, +1 */
const rollDie = (sides: number, random: Random) => Math.floor(random() * sides) + 1;

const rollFate = (random: Random) => (Math.floor(random() * 3) - 1) as -1 | 0 | 1;

/** 항을 굴린다. 난수는 주입받는다. 실제 앱은 `crypto.getRandomValues` 기반 난수를 넘긴다. */
export function roll(terms: DiceTerm[], random: Random): RollResult {
  const rolled = terms.map((term): RolledTerm => {
    if (term.type === "constant") return term;
    if (term.type === "fate") {
      const values = Array.from({ length: term.count }, () => rollFate(random));
      return { type: "fate", sign: term.sign, values };
    }
    const values = Array.from({ length: term.count }, () => rollDie(term.sides, random));
    return { type: "dice", sign: term.sign, sides: term.sides, values };
  });
  return { terms: rolled, total: rolled.reduce((sum, term) => sum + termTotal(term), 0) };
}

/** 판정 계획을 굴린다. 액션 쪽을 먼저 굴리고, 목표가 도전 주사위면 이어서 굴린다. */
export function rollPlan(plan: RollPlan, random: Random): RollResult {
  const action = roll(plan.terms, random);
  if (!plan.check) return action;
  const { op, cap, against } = plan.check;
  const rolledAgainst: RolledCheck["against"] =
    against.type === "number"
      ? against
      : {
          type: "dice",
          sides: against.sides,
          values: Array.from({ length: against.count }, () => rollDie(against.sides, random)),
        };
  return { ...action, check: { op, ...(cap !== undefined && { cap }), against: rolledAgainst } };
}

/** 굴린 결과에서 계산한 판정 값 */
export interface Judgement {
  /** 액션 점수. 상한을 넘지 않는다. */
  score: number;
  /** 결과 값. 도전 주사위면 이긴 개수, 목표치면 차이(이기는 쪽이 +), 비교가 없으면 액션 점수다. */
  value: number;
  /** 목표치를 이겼는지. 목표치가 있을 때만 있다. */
  success?: boolean;
  /** 도전 주사위 하나하나를 이겼는지. 굴린 순서대로다. */
  wins?: boolean[];
  /** 도전 주사위가 둘 이상이고 모두 같은지 */
  match: boolean;
  /** 눈: 액션 쪽 주사위만 더한 값 */
  natural: number;
}

const COMPARE: Record<CompareOp, (score: number, target: number) => boolean> = {
  ">": (score, target) => score > target,
  ">=": (score, target) => score >= target,
  "<": (score, target) => score < target,
  "<=": (score, target) => score <= target,
};

/** 굴린 결과에서 액션 점수, 결과 값, 승패, Match, 눈을 계산한다. 기록을 보여 줄 때와 결과 이름을 고를 때 쓴다. */
export function judgeRoll({ terms, total, check }: RollResult): Judgement {
  const natural = terms.reduce(
    (acc, term) => acc + (term.type === "constant" ? 0 : term.sign * sum(term.values)),
    0,
  );
  const score = check?.cap === undefined ? total : Math.min(total, check.cap);
  if (!check) return { score, value: score, match: false, natural };

  const wins = COMPARE[check.op];
  const { against } = check;
  if (against.type === "number") {
    const margin = check.op.startsWith(">") ? score - against.value : against.value - score;
    return { score, value: margin, success: wins(score, against.value), match: false, natural };
  }
  const dieWins = against.values.map((value) => wins(score, value));
  const [first] = against.values;
  return {
    score,
    value: dieWins.filter(Boolean).length,
    wins: dieWins,
    match: against.values.length >= 2 && against.values.every((value) => value === first),
    natural,
  };
}
