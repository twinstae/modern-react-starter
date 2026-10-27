import * as v from "valibot";

import { BookInputSchema, type BookInput } from "./drawer.ts";

/** CSV의 첫 줄. 운영 화면의 안내와 내려받는 양식이 같은 값을 쓴다. */
export const BOOK_CSV_HEADER = ["제목", "저자", "출판사"] as const;

export interface BookCsvError {
  /** 파일에서 몇 번째 줄인지. 머리줄이 1이다. */
  readonly line: number;
  readonly message: string;
}

export type BookCsvResult =
  | { readonly ok: true; readonly books: BookInput[] }
  | { readonly ok: false; readonly errors: BookCsvError[] };

/**
 * 파일 바이트를 글로 바꾼다. 구글 시트와 엑셀 "CSV UTF-8"은 UTF-8이고, 엑셀의
 * "CSV (쉼표로 분리)"는 한국어 윈도우에서 CP949(EUC-KR)로 저장된다. UTF-8로 읽다가
 * 틀린 바이트가 나오면 EUC-KR로 다시 읽는다.
 */
export function decodeCsvFile(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("euc-kr").decode(bytes);
  }
}

interface CsvRow {
  readonly line: number;
  readonly cells: string[];
}

/** RFC 4180 CSV를 줄로 나눈다. 따옴표 안의 쉼표·줄바꿈과 `""`를 받는다. 빈 줄은 건너뛴다. */
function csvRows(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let line = 1;
  let rowLine = 1;

  const endRow = () => {
    cells.push(cell);
    if (cells.some((value) => value.trim() !== "")) rows.push({ line: rowLine, cells });
    cells = [];
    cell = "";
  };

  const source = text.startsWith("﻿") ? text.slice(1) : text;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        if (char === "\n") line += 1;
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      cells.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      endRow();
      line += 1;
      rowLine = line;
    } else {
      cell += char;
    }
  }
  if (cell !== "" || cells.length > 0) endRow();
  return rows;
}

/**
 * 책 CSV를 읽는다. 첫 줄은 `제목,저자,출판사`이고 그 아래 줄마다 책 한 권이다.
 * 한 줄이라도 틀리면 몇 번째 줄이 왜 틀렸는지 모두 돌려주고 책은 하나도 돌려주지 않는다.
 * 반쯤 올라간 서랍을 만들지 않기 위해서다.
 */
export function parseBookCsv(text: string): BookCsvResult {
  const [header, ...rows] = csvRows(text);
  const headerCells = header?.cells.map((cell) => cell.trim()) ?? [];
  if (
    headerCells.length < BOOK_CSV_HEADER.length ||
    BOOK_CSV_HEADER.some((name, index) => headerCells[index] !== name)
  ) {
    return {
      ok: false,
      errors: [
        { line: header?.line ?? 1, message: `첫 줄은 ${BOOK_CSV_HEADER.join(",")} 여야 해요` },
      ],
    };
  }

  const books: BookInput[] = [];
  const errors: BookCsvError[] = [];
  for (const { line, cells } of rows) {
    const [title = "", author = "", publisher = ""] = cells;
    const parsed = v.safeParse(BookInputSchema, { title, author, publisher });
    if (parsed.success) books.push(parsed.output);
    else errors.push({ line, message: parsed.issues[0].message });
  }

  return errors.length === 0 ? { ok: true, books } : { ok: false, errors };
}
