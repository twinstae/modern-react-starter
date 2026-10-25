/**
 * 한국어 조사. 서랍 이름의 마지막 글자 받침만 본다.
 *
 * - 한글 음절(0xAC00~0xD7A3)은 `(코드 - 0xAC00) % 28`로 받침을 가른다. 0이면 받침 없음,
 *   8이면 ㄹ 받침이다.
 * - 한글이 아닌 글자로 끝나면 받침이 없는 것으로 본다("Book" → "Book가").
 * - 끝의 공백은 조사를 붙이기 전에 지운다.
 */

export const JOSA_PAIRS = ["이/가", "을/를", "은/는", "와/과", "(으)로"] as const;

export type JosaPair = (typeof JOSA_PAIRS)[number];

const HANGUL_FIRST = 0xac00;
const HANGUL_LAST = 0xd7a3;
const FINAL_COUNT = 28;
const RIEUL_FINAL = 8;

/** 조사를 붙일 이름이 비었을 때 던지는 이름 있는 오류. */
export class InvalidJosaWordError extends Error {
  constructor(word: string) {
    super(`조사를 붙일 이름이 비었습니다: ${JSON.stringify(word)}`);
    this.name = "InvalidJosaWordError";
  }
}

/** 알지 못하는 조사 쌍일 때 던지는 이름 있는 오류. */
export class InvalidJosaPairError extends Error {
  constructor(pair: string) {
    super(`알 수 없는 조사 쌍입니다: ${pair}`);
    this.name = "InvalidJosaPairError";
  }
}

/**
 * 마지막 글자의 받침을 돌려준다. 받침이 없거나 한글이 아니면 `undefined`,
 * ㄹ 받침이면 `RIEUL_FINAL`, 그 밖의 받침이면 그 받침 번호다.
 */
function finalConsonantOf(word: string): number | undefined {
  const trimmed = word.trimEnd();
  if (trimmed.length === 0) throw new InvalidJosaWordError(word);

  const last = trimmed.codePointAt(trimmed.length - 1);
  if (last === undefined || last < HANGUL_FIRST || last > HANGUL_LAST) return undefined;

  const final = (last - HANGUL_FIRST) % FINAL_COUNT;
  return final === 0 ? undefined : final;
}

function isJosaPair(pair: string): pair is JosaPair {
  return (JOSA_PAIRS as readonly string[]).includes(pair);
}

/**
 * 이름 끝에 조사를 붙인다. 이름 끝의 공백은 지우고, 받침에 맞는 조사를 고른다.
 * `(으)로`는 받침이 없거나 ㄹ 받침이면 `로`, 그 밖의 받침이면 `으로`다.
 */
export function attachJosa(word: string, pair: JosaPair): string {
  if (!isJosaPair(pair)) throw new InvalidJosaPairError(pair);

  const trimmed = word.trimEnd();
  const final = finalConsonantOf(trimmed);
  const hasFinal = final !== undefined;

  switch (pair) {
    case "이/가":
      return `${trimmed}${hasFinal ? "이" : "가"}`;
    case "을/를":
      return `${trimmed}${hasFinal ? "을" : "를"}`;
    case "은/는":
      return `${trimmed}${hasFinal ? "은" : "는"}`;
    case "와/과":
      return `${trimmed}${hasFinal ? "과" : "와"}`;
    case "(으)로":
      return `${trimmed}${!hasFinal || final === RIEUL_FINAL ? "로" : "으로"}`;
  }
}
