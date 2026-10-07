import * as v from "valibot";

export const SHORT_TEXT_MAX = 140;

/** 사람이 보는 글자(grapheme) 수. 짧은 글의 글자 수 기준은 이것 하나다. */
export const countGraphemes = (text: string) => [...new Intl.Segmenter().segment(text)].length;

/** 앞뒤 공백을 뺀 글이 최대 글자 수까지 몇 글자 남았는지. 넘치면 음수다. */
export const remainingGraphemes = (text: string) => SHORT_TEXT_MAX - countGraphemes(text.trim());

/**
 * 짧은 글: 세션 제목, 대화, 판정 라벨, 캐릭터 이름이 모두 따르는 규칙.
 * 앞뒤 공백을 뺀 뒤 1~140자. 글자 수는 countGraphemes 기준이다.
 */
export const ShortText = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "내용을 입력해주세요"),
  v.check(
    (text) => countGraphemes(text) <= SHORT_TEXT_MAX,
    `${SHORT_TEXT_MAX}자 이하로 입력해주세요`,
  ),
);
