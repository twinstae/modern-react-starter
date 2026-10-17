import * as v from "valibot";

import { parseRoll, type Judgement } from "./dice.ts";
import { ShortText } from "./short-text.ts";

/** 매크로를 굴릴 때 고르는 정수. 최소와 최대를 포함한다. */
export interface Slot {
  name: string;
  min: number;
  max: number;
}

/** 정수 범위. 끝이 없으면 그쪽으로 열려 있다. 양 끝을 포함한다. */
export interface Range {
  min?: number;
  max?: number;
}

/** 결과 값의 범위에 붙인 결과 이름 */
export interface Outcome {
  range: Range;
  name: string;
}

/** 눈의 범위에 붙인 눈 효과. `replace`면 결과 이름을 이 이름으로 바꾼다. */
export interface Effect {
  range: Range;
  name: string;
  replace: boolean;
}

/** 읽은 매크로 식. `template`은 빈칸이 든 판정 표기다. */
export interface ParsedMacro {
  template: string;
  slots: Slot[];
  outcomes: Outcome[];
  effects: Effect[];
}

export type MacroResult = { ok: true; macro: ParsedMacro } | { ok: false; message: string };

/** 빈칸 하나에서 고를 수 있는 값의 수 상한. 고르는 칸(Select)이 너무 길어지지 않게 한다. */
export const MAX_SLOT_VALUES = 100;

const SLOT = /\{([^{}:]*):(-?\d+)\.\.(-?\d+)\}/g;
const RANGE = /^(?:(-?\d+)?\.\.(-?\d+)?|(-?\d+))\s+(.*)$/;
/** 결과 이름과 눈 효과를 가르는 글자. 이름에는 쓸 수 없다. */
const SEPARATORS = /[|,;]/;

class MacroError extends Error {}

/** `a`, `a..b`, `..b`, `a..` 꼴의 범위와 그 뒤의 이름을 읽는다. */
function parseRanged(text: string): { range: Range; name: string } {
  const match = RANGE.exec(text.trim());
  if (!match) throw new MacroError(`범위와 이름을 "7..9 약한 성공"처럼 적어주세요: ${text.trim()}`);
  const [, from, to, single, rawName = ""] = match;
  if (single === undefined && from === undefined && to === undefined) {
    throw new MacroError(`범위의 한쪽 끝은 적어주세요: ${text.trim()}`);
  }
  const range: Range =
    single !== undefined
      ? { min: Number(single), max: Number(single) }
      : {
          ...(from !== undefined && { min: Number(from) }),
          ...(to !== undefined && { max: Number(to) }),
        };
  return { range, name: rawName };
}

/** 이름을 짧은 글 규칙으로 확인한다. 가르는 글자(`|`, `,`, `;`)는 쓸 수 없다. */
function parseName(text: string): string {
  if (SEPARATORS.test(text)) throw new MacroError(`이름에는 |, ;, ,를 쓸 수 없습니다: ${text}`);
  const parsed = v.safeParse(ShortText, text);
  if (!parsed.success) throw new MacroError(parsed.issues[0].message);
  return parsed.output;
}

const overlaps = (a: Range, b: Range) =>
  (a.min ?? -Infinity) <= (b.max ?? Infinity) && (b.min ?? -Infinity) <= (a.max ?? Infinity);

function assertNoOverlap(ranges: Range[], what: string) {
  ranges.forEach((range, index) => {
    if (ranges.slice(index + 1).some((other) => overlaps(range, other))) {
      throw new MacroError(`${what}의 범위가 겹칩니다`);
    }
  });
}

/** 빈칸을 값으로 채운다. `+-1`은 `-1`, `--1`은 `+1`로 적는다. */
function substitute(template: string, values: (slot: string) => number) {
  return template
    .replace(SLOT, (_whole, name: string) => String(values(name.trim())))
    .replaceAll("+-", "-")
    .replaceAll("--", "+");
}

function parseSlots(template: string): Slot[] {
  const slots = [...template.matchAll(SLOT)].map(([, rawName = "", min, max]) => ({
    name: rawName.trim(),
    min: Number(min),
    max: Number(max),
  }));
  if (/[{}]/.test(template.replace(SLOT, ""))) {
    throw new MacroError("빈칸은 {이름:최소..최대}처럼 적어주세요");
  }
  for (const [index, slot] of slots.entries()) {
    if (slot.name === "") throw new MacroError("빈칸에 이름을 적어주세요");
    if (slots.slice(0, index).some(({ name }) => name === slot.name)) {
      throw new MacroError(`빈칸 이름이 겹칩니다: ${slot.name}`);
    }
    if (slot.min > slot.max) throw new MacroError(`빈칸의 최소가 최대보다 큽니다: ${slot.name}`);
    if (slot.max - slot.min + 1 > MAX_SLOT_VALUES) {
      throw new MacroError(
        `빈칸에서 고를 수 있는 값은 ${MAX_SLOT_VALUES}개까지입니다: ${slot.name}`,
      );
    }
  }
  return slots;
}

/**
 * 매크로 식을 읽는다. `<표기 틀>[ => <범위> <이름> | ...][ ; <범위> [!]<이름>, ...]`
 * 빈칸을 모두 최솟값으로, 모두 최댓값으로 채운 표기가 올바른지까지 확인한다.
 */
export function parseMacro(definition: string): MacroResult {
  try {
    const [head = "", effectsText] = splitOnce(definition, ";");
    const [templateText = "", outcomesText] = splitOnce(head, "=>");
    const template = templateText.trim();
    const slots = parseSlots(template);

    for (const pick of [(slot: Slot) => slot.min, (slot: Slot) => slot.max]) {
      const filled = substitute(template, (name) => pick(slots.find((s) => s.name === name)!));
      const parsed = parseRoll(filled);
      if (!parsed.ok) throw new MacroError(parsed.message);
    }

    const outcomes = (outcomesText?.split("|") ?? []).map((text) => {
      const { range, name } = parseRanged(text);
      return { range, name: parseName(name) };
    });
    const effects = (effectsText?.split(",") ?? []).map((text) => {
      const { range, name } = parseRanged(text);
      const replace = name.startsWith("!");
      return { range, name: parseName(replace ? name.slice(1) : name), replace };
    });
    assertNoOverlap(
      outcomes.map((outcome) => outcome.range),
      "결과 이름",
    );
    assertNoOverlap(
      effects.map((effect) => effect.range),
      "눈 효과",
    );
    return { ok: true, macro: { template, slots, outcomes, effects } };
  } catch (error) {
    if (error instanceof MacroError) return { ok: false, message: error.message };
    throw error;
  }
}

export type FillResult = { ok: true; notation: string } | { ok: false; message: string };

/** 빈칸을 고른 값으로 채운 판정 표기를 만든다. 값은 빈칸의 범위 안의 정수여야 한다. */
export function fillMacro(
  macro: ParsedMacro,
  values: Readonly<Record<string, number>>,
): FillResult {
  for (const slot of macro.slots) {
    const value = values[slot.name];
    if (value === undefined) return { ok: false, message: `${slot.name}을(를) 골라주세요` };
    if (!Number.isInteger(value) || value < slot.min || value > slot.max) {
      return { ok: false, message: `${slot.name}은(는) ${slot.min}..${slot.max} 사이 정수입니다` };
    }
  }
  return { ok: true, notation: substitute(macro.template, (name) => values[name] ?? 0) };
}

const inRange = (range: Range, value: number) =>
  (range.min ?? -Infinity) <= value && value <= (range.max ?? Infinity);

/**
 * 판정 값에 맞는 결과 이름과 눈 효과를 고른다. 결과 이름은 결과 값으로, 눈 효과는 눈으로 고른다.
 * `!`가 붙은 눈 효과는 결과 이름을 바꾸고 따로 남지 않는다.
 */
export function nameResult(
  macro: ParsedMacro,
  { value, natural }: Judgement,
): { outcome?: string; effect?: string } {
  const outcome = macro.outcomes.find(({ range }) => inRange(range, value))?.name;
  const effect = macro.effects.find(({ range }) => inRange(range, natural));
  if (effect?.replace) return { outcome: effect.name };
  return {
    ...(outcome !== undefined && { outcome }),
    ...(effect !== undefined && { effect: effect.name }),
  };
}

/** 처음 나오는 구분자에서 둘로 가른다. 없으면 하나다. */
function splitOnce(text: string, separator: string): [string, string?] {
  const index = text.indexOf(separator);
  return index === -1 ? [text] : [text.slice(0, index), text.slice(index + separator.length)];
}
