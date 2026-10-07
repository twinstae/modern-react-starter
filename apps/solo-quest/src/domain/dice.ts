/** 한 판정에서 굴릴 수 있는 주사위 수의 상한 */
export const MAX_DICE = 100;
/** 주사위 하나의 면 수 상한 */
export const MAX_SIDES = 1000;

/** 굴리기 전의 항. 빼는 항은 sign이 -1이다. */
export type DiceTerm =
  | { type: "dice"; sign: 1 | -1; count: number; sides: number }
  | { type: "constant"; sign: 1 | -1; value: number };

export type NotationResult = { ok: true; terms: DiceTerm[] } | { ok: false; message: string };

const DICE_TERM = /^(\d*)d(\d+)$/i;
const CONSTANT_TERM = /^\d+$/;

/**
 * 표기를 항 목록으로 바꾼다. 항은 `NdM`(N을 생략하면 1)이나 정수 상수이고 `+`/`-`로 잇는다.
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
    if (diceMatch) {
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

  const totalDice = terms.reduce((sum, term) => sum + (term.type === "dice" ? term.count : 0), 0);
  if (totalDice > MAX_DICE) {
    return { ok: false, message: `주사위는 모두 ${MAX_DICE}개까지 굴릴 수 있습니다` };
  }
  if (terms.some((term) => term.type === "dice" && term.sides > MAX_SIDES)) {
    return { ok: false, message: `주사위 면은 ${MAX_SIDES}개까지 쓸 수 있습니다` };
  }
  return { ok: true, terms };
}

/** 굴린 뒤의 항. 주사위 값을 그대로 들고 있어, 기록을 다시 굴리지 않고 보여 줄 수 있다. */
export type RolledTerm =
  | { type: "dice"; sign: 1 | -1; sides: number; values: number[] }
  | { type: "constant"; sign: 1 | -1; value: number };

export interface RollResult {
  terms: RolledTerm[];
  total: number;
}

/** 0 이상 1 미만의 값을 내는 함수 */
export type Random = () => number;

/** 항을 굴린다. 난수는 주입받는다. 실제 앱은 `crypto.getRandomValues` 기반 난수를 넘긴다. */
export function roll(terms: DiceTerm[], random: Random): RollResult {
  const rolled = terms.map((term): RolledTerm => {
    if (term.type === "constant") return term;
    const values = Array.from({ length: term.count }, () => Math.floor(random() * term.sides) + 1);
    return { type: "dice", sign: term.sign, sides: term.sides, values };
  });
  const total = rolled.reduce(
    (sum, term) =>
      sum +
      term.sign * (term.type === "constant" ? term.value : term.values.reduce((a, b) => a + b, 0)),
    0,
  );
  return { terms: rolled, total };
}
