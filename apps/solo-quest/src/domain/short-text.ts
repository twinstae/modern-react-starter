import * as v from "valibot";

export const SHORT_TEXT_MAX = 140;

/**
 * 짧은 글: 세션 제목, 대화, 판정 라벨, 캐릭터 이름이 모두 따르는 규칙.
 * 앞뒤 공백을 뺀 뒤 1~140자. 글자 수는 사람이 보는 글자(grapheme) 기준이다.
 */
export const ShortText = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxGraphemes(SHORT_TEXT_MAX),
);
