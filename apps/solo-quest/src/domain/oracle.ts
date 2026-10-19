import * as v from "valibot";

import type { Random } from "./dice.ts";
import { ShortText } from "./short-text.ts";

/** 오라클 표의 한 줄. `min`부터 `max`까지 나오면 `result`다. 양 끝을 포함한다. */
export interface OracleRow {
  min: number;
  max: number;
  result: string;
}

/**
 * 주사위를 굴려 무작위 결과를 얻는 표. 세션에 묶이지 않는 전역 자료다.
 * `sides`면 주사위를 한 번 굴려 나온 눈이 어느 줄에 드는지로 결과를 고른다.
 * 표는 1부터 `sides`까지 빈틈이나 겹침 없이 덮어야 한다.
 */
export interface Oracle {
  id: string;
  name: string;
  /** 굴릴 주사위의 면 수. 기본은 100이고 10, 20, 6도 쓸 수 있다. */
  sides: number;
  /** 표가 여러 열이거나 여러 표일 때 무엇을 합친 것인지 적는 짧은 설명 */
  description?: string;
  rows: OracleRow[];
}

/** 오라클 결과로 적을 수 있는 글의 길이 상한. 긴 문장이 결과인 표가 있다. */
export const ORACLE_RESULT_MAX = 500;

/** 오라클 결과 글. 앞뒤 공백을 뺀 1~500자다. */
export const OracleResultText = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "결과를 입력해주세요"),
  v.maxLength(ORACLE_RESULT_MAX, `결과는 ${ORACLE_RESULT_MAX}자 이하로 입력해주세요`),
);

/** 주사위 면 수. 2~1000이다. */
export const OracleDice = v.pipe(
  v.number(),
  v.integer("주사위 면은 정수여야 합니다"),
  v.minValue(2, "주사위 면은 2 이상이어야 합니다"),
  v.maxValue(1000, "주사위 면은 1000 이하이어야 합니다"),
);

const OracleRowInput = v.object({
  min: v.number(),
  max: v.number(),
  result: v.string(),
});

/** 서버가 받는 오라클 본문. `id`는 경로에서 온다. */
export const OracleInputSchema = v.object({
  name: v.string(),
  sides: v.number(),
  description: v.optional(v.string()),
  rows: v.array(OracleRowInput),
});

export type OracleInput = v.InferOutput<typeof OracleInputSchema>;

export type OracleParseResult = { ok: true; oracle: Oracle } | { ok: false; message: string };

/** 두 범위가 같은 눈을 가질 수 있는지 */ const overlaps = (a: OracleRow, b: OracleRow) =>
  a.min <= b.max && b.min <= a.max;

/**
 * 오라클 표를 읽어 다듬은 값을 돌려준다. 이름, 주사위 면, 결과 글의 길이를 확인하고,
 * 표가 1부터 주사위 면까지 빈틈이나 겹침 없이 덮는지도 본다. 어기면 사용자에게 보여 줄 메시지다.
 */
export function parseOracle(input: OracleInput & { id: string }): OracleParseResult {
  const name = v.safeParse(ShortText, input.name);
  if (!name.success) return { ok: false, message: name.issues[0].message };

  const sides = v.safeParse(OracleDice, input.sides);
  if (!sides.success) return { ok: false, message: sides.issues[0].message };

  if (input.rows.length === 0) return { ok: false, message: "표에 줄이 하나도 없습니다" };

  const rows: OracleRow[] = [];
  for (const row of input.rows) {
    if (!Number.isInteger(row.min) || !Number.isInteger(row.max)) {
      return { ok: false, message: "범위의 시작과 끝은 정수여야 합니다" };
    }
    if (row.min < 1 || row.max > sides.output) {
      return {
        ok: false,
        message: `범위는 1부터 ${sides.output} 사이여야 합니다: ${row.min}–${row.max}`,
      };
    }
    if (row.min > row.max) {
      return { ok: false, message: `범위의 시작이 끝보다 큽니다: ${row.min}–${row.max}` };
    }
    const result = v.safeParse(OracleResultText, row.result);
    if (!result.success) return { ok: false, message: result.issues[0].message };
    rows.push({ min: row.min, max: row.max, result: result.output });
  }

  const sorted = [...rows].sort((a, b) => a.min - b.min);
  const [first] = sorted;
  if (first && first.min !== 1) {
    return { ok: false, message: `표는 1부터 시작해야 합니다: ${first.min}` };
  }
  for (const [index, row] of sorted.entries()) {
    const previous = sorted[index - 1];
    if (previous && overlaps(previous, row)) {
      return { ok: false, message: `범위가 겹칩니다: ${row.min}–${row.max}` };
    }
    if (previous && row.min !== previous.max + 1) {
      return { ok: false, message: `범위가 이어지지 않습니다: ${previous.max + 1}` };
    }
  }
  const last = sorted.at(-1);
  if (last && last.max !== sides.output) {
    return { ok: false, message: `표는 ${sides.output}까지 덮어야 합니다: ${last.max}` };
  }

  const description = input.description?.trim();
  return {
    ok: true,
    oracle: {
      id: input.id,
      name: name.output,
      sides: sides.output,
      ...(description ? { description: description.slice(0, ORACLE_RESULT_MAX) } : {}),
      rows: sorted,
    },
  };
}

/** 굴린 결과 */
export type OracleRoll =
  | { ok: true; value: number; result: string }
  | { ok: false; message: string };

/** 주사위를 한 번 굴려 나온 눈에 드는 줄의 결과를 돌려준다. 난수는 주입받는다. */
export function rollOracle(oracle: Oracle, random: Random): OracleRoll {
  const value = Math.floor(random() * oracle.sides) + 1;
  const row = oracle.rows.find(({ min, max }) => min <= value && value <= max);
  if (!row) {
    return { ok: false, message: `${value}에 해당하는 결과가 없습니다: ${oracle.name}` };
  }
  return { ok: true, value, result: row.result };
}
