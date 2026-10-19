import * as v from "valibot";

import type { Random } from "./dice.ts";
import { ShortText } from "./short-text.ts";

/** 표를 한 칸씩 적는지(눈마다 결과 하나), 구간으로 적는지 */
export const ORACLE_KINDS = ["single", "ranges"] as const;

export type OracleKind = (typeof ORACLE_KINDS)[number];

export const ORACLE_KIND_LABEL: Record<OracleKind, string> = {
  single: "한 칸씩",
  ranges: "구간",
};

/** 나누는 묶음이 정해져 있지 않은 오라클의 기본값 */
export const DEFAULT_CATEGORY = "미분류";
export const DEFAULT_GROUP = "기타";

/** 화면이 먼저 보여 주는 묶음 순서. 여기 없는 묶음은 이름순으로 뒤에 붙는다. */
export const ORACLE_GROUPS = ["일반", "장소", "인물", "기타"] as const;

/**
 * 오라클 표의 한 줄. `min`부터 `max`까지 나오면 `result`다. 양 끝을 포함한다.
 * `description`과 `url`은 결과에 딸린 곁들임이다. 사이퍼처럼 결과의 뜻을 짧게 알려 주거나
 * 더 자세한 곳으로 가는 링크가 필요할 때만 쓴다.
 */
export interface OracleRow {
  min: number;
  max: number;
  result: string;
  /** 결과 밑에 회색 글씨로 보이는 짧은 설명 */
  description?: string;
  /** 결과에서 바로 건너갈 바깥 주소. http(s) 절대 주소만 쓴다. */
  url?: string;
}

/**
 * 주사위를 굴려 무작위 결과를 얻는 표. 세션에 묶이지 않는 전역 자료다.
 * `sides`면 주사위를 한 번 굴려 나온 눈이 어느 줄에 드는지로 결과를 고른다.
 * `kind`가 `single`이면 눈마다 줄이 하나씩 있고(`1`부터 `sides`까지), `ranges`면 줄이 구간을 덮는다.
 * 어느 쪽이든 표는 1부터 `sides`까지 빈틈이나 겹침 없이 덮어야 한다.
 */
export interface Oracle {
  id: string;
  name: string;
  /** 표를 묶는 큰 분류. 예: "철의 맹세" */
  category: string;
  /** 분류 안의 작은 묶음. 예: "일반", "장소", "인물", "기타" */
  group: string;
  /** 굴릴 주사위의 면 수. 기본은 100이고 10, 20, 6도 쓴다. */
  sides: number;
  kind: OracleKind;
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

/** 결과에 딸린 설명의 길이 상한. */
export const ORACLE_DESCRIPTION_MAX = 500;

/** 결과에 딸린 설명. 앞뒤 공백을 뺀 1~500자다. */
export const OracleDescription = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "설명을 입력해주세요"),
  v.maxLength(ORACLE_DESCRIPTION_MAX, `설명은 ${ORACLE_DESCRIPTION_MAX}자 이하로 입력해주세요`),
);

/** 결과에 딸린 바깥 링크. http(s) 절대 주소만 받는다. */
export const OracleUrl = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^https?:\/\/\S+$/, "링크는 http://나 https://로 시작하는 주소여야 합니다"),
  v.maxLength(ORACLE_DESCRIPTION_MAX, `링크는 ${ORACLE_DESCRIPTION_MAX}자 이하로 입력해주세요`),
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
  description: v.optional(v.string()),
  url: v.optional(v.string()),
});

/** 서버가 받는 오라클 본문. `id`는 경로에서 온다. */
export const OracleInputSchema = v.object({
  name: v.string(),
  category: v.string(),
  group: v.string(),
  sides: v.number(),
  kind: v.picklist(ORACLE_KINDS),
  description: v.optional(v.string()),
  rows: v.array(OracleRowInput),
});

export type OracleInput = v.InferOutput<typeof OracleInputSchema>;

export type OracleParseResult = { ok: true; oracle: Oracle } | { ok: false; message: string };

/** 한 칸씩 표인지 구간 표인지 줄 모양으로 알아낸다. 옛 자료를 읽을 때 쓴다. */
export function inferKind(rows: OracleRow[], sides: number): OracleKind {
  return rows.length === sides && rows.every(({ min, max }) => min === max) ? "single" : "ranges";
}

/**
 * 눈마다 줄이 하나씩 있는 표로 펼친다. 구간 표에 있던 결과와 그 곁들임(설명·링크)은
 * 그 눈이 드는 구간의 것을 가져온다. 어느 구간에도 들지 않는 눈은 빈 결과가 된다.
 */
export function rowsByFace(rows: OracleRow[], sides: number): OracleRow[] {
  return Array.from({ length: sides }, (_, index) => {
    const face = index + 1;
    const row = rows.find(({ min, max }) => min <= face && face <= max);
    return {
      min: face,
      max: face,
      result: row?.result ?? "",
      ...(row?.description !== undefined && { description: row.description }),
      ...(row?.url !== undefined && { url: row.url }),
    };
  });
}

/** 두 줄이 같은 결과를 내는지. 곁들임까지 같아야 한 구간으로 묶을 수 있다. */
const sameRowValue = (a: OracleRow, b: OracleRow) =>
  a.result === b.result && a.description === b.description && a.url === b.url;

/**
 * 눈마다 펼친 표를 다시 구간으로 접는다. 이웃한 눈의 결과와 곁들임이 같으면 한 구간으로 묶는다.
 * 그래서 한 칸씩 표를 구간으로 바꿨다가 되돌려도 표가 그대로다.
 */
export function collapseRanges(rows: OracleRow[], sides: number): OracleRow[] {
  const merged: OracleRow[] = [];
  for (const row of rowsByFace(rows, sides)) {
    const last = merged.at(-1);
    if (last && sameRowValue(last, row)) last.max = row.max;
    else merged.push({ ...row });
  }
  return merged;
}

/** `kind`에 맞는 빈 표. 한 칸씩이면 1부터 `sides`까지 빈 칸이 하나씩 있다. */
export function emptyRows(kind: OracleKind, sides: number): OracleRow[] {
  if (kind === "ranges") return [{ min: 1, max: sides, result: "" }];
  return Array.from({ length: sides }, (_, index) => ({
    min: index + 1,
    max: index + 1,
    result: "",
  }));
}

/** 두 범위가 같은 눈을 가질 수 있는지 */
const overlaps = (a: OracleRow, b: OracleRow) => a.min <= b.max && b.min <= a.max;

/**
 * 오라클 표를 읽어 다듬은 값을 돌려준다. 이름과 분류, 주사위 면, 결과·설명 글의 길이와 링크를 확인하고,
 * 표가 1부터 주사위 면까지 빈틈이나 겹침 없이 덮는지도 본다. 한 칸씩 표는 눈마다 줄이 하나여야 한다.
 * 어기면 사용자에게 보여 줄 메시지다. 어느 줄이 문제인지 앞에 붙인다.
 */
export function parseOracle(input: OracleInput & { id: string }): OracleParseResult {
  const name = v.safeParse(ShortText, input.name);
  if (!name.success) return { ok: false, message: name.issues[0].message };

  const category = v.safeParse(ShortText, input.category);
  if (!category.success) {
    return { ok: false, message: `분류: ${category.issues[0].message}` };
  }
  const group = v.safeParse(ShortText, input.group);
  if (!group.success) return { ok: false, message: `묶음: ${group.issues[0].message}` };

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
    if (input.kind === "single" && row.min !== row.max) {
      return {
        ok: false,
        message: `한 칸씩 표는 눈마다 결과가 하나여야 합니다: ${row.min}–${row.max}`,
      };
    }
    const where = input.kind === "single" ? `${row.min}번 칸` : `${row.min}–${row.max}`;
    const result = v.safeParse(OracleResultText, row.result);
    if (!result.success) return { ok: false, message: `${where}: ${result.issues[0].message}` };

    const description =
      row.description === undefined ? undefined : v.safeParse(OracleDescription, row.description);
    if (description && !description.success) {
      return { ok: false, message: `${where}: ${description.issues[0].message}` };
    }
    const url = row.url === undefined ? undefined : v.safeParse(OracleUrl, row.url);
    if (url && !url.success) return { ok: false, message: `${where}: ${url.issues[0].message}` };

    const descriptionText = description?.success ? description.output : undefined;
    const urlText = url?.success ? url.output : undefined;
    rows.push({
      min: row.min,
      max: row.max,
      result: result.output,
      ...(descriptionText !== undefined && { description: descriptionText }),
      ...(urlText !== undefined && { url: urlText }),
    });
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
      category: category.output,
      group: group.output,
      sides: sides.output,
      kind: input.kind,
      ...(description ? { description: description.slice(0, ORACLE_RESULT_MAX) } : {}),
      rows: sorted,
    },
  };
}

/** 굴린 결과. 눌린 줄에 설명과 링크가 있으면 함께 돌려줘 기록과 화면이 그것을 보여 줄 수 있게 한다. */
export type OracleRoll =
  | { ok: true; value: number; result: string; description?: string; url?: string }
  | { ok: false; message: string };

/** 주사위를 한 번 굴려 나온 눈에 드는 줄의 결과를 돌려준다. 난수는 주입받는다. */
export function rollOracle(oracle: Oracle, random: Random): OracleRoll {
  const value = Math.floor(random() * oracle.sides) + 1;
  const row = oracle.rows.find(({ min, max }) => min <= value && value <= max);
  if (!row) {
    return { ok: false, message: `${value}에 해당하는 결과가 없습니다: ${oracle.name}` };
  }
  return {
    ok: true,
    value,
    result: row.result,
    ...(row.description !== undefined && { description: row.description }),
    ...(row.url !== undefined && { url: row.url }),
  };
}

const RANGE_TOKEN = /^(\d{1,4})\s*(?:[-~–—]|\.\.)\s*(\d{1,4})$/;
const NUMBER_TOKEN = /^\d{1,4}$/;
const HEADER_TOKEN = /^(?:d\d+|번호|범위|시작|눈)$/i;

/** 결과 한 줄이 담는 것. 설명과 링크는 없을 수 있다. */
interface RowCells {
  result: string;
  description?: string;
  url?: string;
}

export type OracleRowsResult = { ok: true; rows: OracleRow[] } | { ok: false; message: string };

/** `00`은 d100에서 100을 뜻한다. 그 밖의 0은 쓸 수 없다. */
const toFace = (raw: string, sides: number) => {
  const value = Number(raw);
  return value === 0 ? sides : value;
};

/**
 * 한 줄을 칸으로 가른다. 칸을 `"`로 감싸면 그 안의 쉼표를 그대로 담고, `""`는 따옴표 하나다.
 * 감싸지 않은 칸은 쉼표까지가 한 칸이다. 양끝 공백은 뺀다.
 */
function splitCells(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
        continue;
      }
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
      continue;
    }
    cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

/** 결과·설명·링크 칸을 읽는다. 빈 칸은 없는 것으로 본다. */
function readRowCells(cells: string[]): RowCells {
  const [result = "", description = "", url = ""] = cells;
  return {
    result,
    ...(description !== "" && { description }),
    ...(url !== "" && { url }),
  };
}

/**
 * 붙여넣은 글을 줄 목록으로 읽는다. 쉼표로 칸을 가르고, 칸을 `"`로 감싸면 그 안의 쉼표를 그대로 담는다.
 * - 구간 표: `눈/범위, 결과, 설명, 링크`. 시작과 끝이 둘 다 숫자면 `시작, 끝, 결과, ...`로 읽는다
 *   (스프레드시트에서 시작·끝 열을 그대로 붙여넣을 때).
 * - 한 칸씩 표: `결과, 설명, 링크`(차례대로 1번부터) 또는 `눈, 결과, 설명, 링크`(눈을 적어 자리를 정한다).
 * 설명과 링크는 없어도 된다. 빈 줄과 `#`로 시작하는 줄은 건너뛰고, 표 머리글(`d100,결과` 같은)도 건너뛴다.
 */
export function parseOracleRows(kind: OracleKind, sides: number, text: string): OracleRowsResult {
  const rows: OracleRow[] = [];
  /** 한 칸씩 표는 눈을 자리로 삼아 담는다 */
  const faces = new Map<number, RowCells>();
  const used = new Set<number>();
  const queued: RowCells[] = [];

  /** 눈 하나가 이미 다른 줄에 들어 있으면 오류다. 겹치는 범위도 여기서 걸린다. */
  const claim = (lineNumber: number, face: number) => {
    if (face < 1 || face > sides) {
      throw new Error(`${lineNumber}번째 줄: 눈은 1부터 ${sides} 사이여야 합니다: ${face}`);
    }
    if (used.has(face)) {
      throw new Error(`${lineNumber}번째 줄: ${face}번이 두 번 나옵니다`);
    }
    used.add(face);
  };

  for (const [index, rawLine] of text.split("\n").entries()) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const lineNumber = index + 1;
    const cells = splitCells(line);
    const [head = "", second = ""] = cells;
    if (HEADER_TOKEN.test(head)) continue;

    try {
      if (kind === "single") {
        if (!NUMBER_TOKEN.test(head)) {
          queued.push(readRowCells(cells));
          continue;
        }
        const face = toFace(head, sides);
        claim(lineNumber, face);
        faces.set(face, readRowCells(cells.slice(1)));
        continue;
      }

      const range = RANGE_TOKEN.exec(head);
      if (range) {
        const min = toFace(range[1], sides);
        const max = toFace(range[2], sides);
        if (min > max) throw new Error(`${lineNumber}번째 줄: 범위의 시작이 끝보다 큽니다`);
        for (let face = min; face <= max; face += 1) claim(lineNumber, face);
        rows.push({ min, max, ...readRowCells(cells.slice(1)) });
        continue;
      }
      if (NUMBER_TOKEN.test(head)) {
        const min = toFace(head, sides);
        // 시작과 끝을 따로 적은 줄이면 두 칸을 다 눈으로 읽는다
        const pair = NUMBER_TOKEN.test(second);
        const max = pair ? toFace(second, sides) : min;
        if (min > max) throw new Error(`${lineNumber}번째 줄: 범위의 시작이 끝보다 큽니다`);
        for (let face = min; face <= max; face += 1) claim(lineNumber, face);
        rows.push({ min, max, ...readRowCells(cells.slice(pair ? 2 : 1)) });
        continue;
      }
      throw new Error(`${lineNumber}번째 줄: 범위를 "53-54, 절벽"처럼 적어주세요: ${line}`);
    } catch (error) {
      if (error instanceof Error) return { ok: false, message: error.message };
      throw error;
    }
  }

  if (kind === "single") {
    let next = 1;
    for (const queuedCells of queued) {
      while (faces.has(next)) next += 1;
      if (next > sides)
        return { ok: false, message: `눈은 1부터 ${sides} 사이여야 합니다: ${next}` };
      faces.set(next, queuedCells);
      next += 1;
    }
    // 덮이지 않은 칸도 빈 줄로 남겨, 어디가 비었는지 바로 보이게 한다.
    return {
      ok: true,
      rows: Array.from({ length: sides }, (_, index) => ({
        min: index + 1,
        max: index + 1,
        ...(faces.get(index + 1) ?? { result: "" }),
      })),
    };
  }

  if (rows.length === 0) return { ok: false, message: "붙여넣은 글에서 결과를 찾지 못했습니다" };
  return { ok: true, rows };
}

/** 칸에 쉼표나 따옴표가 있으면 `"`로 감싼다. 없으면 그대로 쓴다. */
const quoteCell = (cell: string) =>
  cell.includes(",") || cell.includes('"') ? `"${cell.replaceAll('"', '""')}"` : cell;

/**
 * 표를 붙여넣기 창에 다시 넣을 수 있는 글로 만든다. `parseOracleRows`가 읽는 모양 그대로다.
 * 설명과 링크가 있는 줄만 뒤에 그 칸을 더한다.
 */
export function formatOracleRows(rows: OracleRow[], kind: OracleKind): string {
  return rows
    .map((row) => {
      const { min, max, result, description, url } = row;
      const head = kind === "single" ? String(min) : min === max ? String(min) : `${min}-${max}`;
      const cells = [head, result, ...(description !== undefined ? [description] : [])];
      if (url !== undefined) {
        if (description === undefined) cells.push("");
        cells.push(url);
      }
      return cells.map(quoteCell).join(", ");
    })
    .join("\n");
}
