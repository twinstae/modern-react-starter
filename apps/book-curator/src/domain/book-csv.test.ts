import { describe, expect, it } from "vite-plus/test";

import { decodeCsvFile, parseBookCsv } from "./book-csv.ts";

describe("책 CSV", () => {
  it("제목·저자·출판사 머리줄 아래의 줄마다 책 한 권을 읽는다", () => {
    const csv = [
      "제목,저자,출판사",
      "삶을 바꾸는 연습,김연습,연습출판",
      '"쉼표, 있는 제목",박저자,',
      "",
      '"따옴표 ""인용"" 제목",이저자,따옴표사',
    ].join("\r\n");

    expect(parseBookCsv(csv)).toStrictEqual({
      ok: true,
      books: [
        { title: "삶을 바꾸는 연습", author: "김연습", publisher: "연습출판" },
        { title: "쉼표, 있는 제목", author: "박저자", publisher: "" },
        { title: '따옴표 "인용" 제목', author: "이저자", publisher: "따옴표사" },
      ],
    });
  });

  it("제목이나 저자가 빈 줄은 몇 번째 줄인지 알려 주고 아무 책도 올리지 않는다", () => {
    const csv = "제목,저자,출판사\n삶을 바꾸는 연습,김연습,\n,이름없는저자,\n";

    expect(parseBookCsv(csv)).toStrictEqual({
      ok: false,
      errors: [{ line: 3, message: "제목을 넣어 주세요" }],
    });
  });

  it("머리줄이 양식과 다르면 양식을 알려 준다", () => {
    expect(parseBookCsv("title,author\n책,저자\n")).toStrictEqual({
      ok: false,
      errors: [{ line: 1, message: "첫 줄은 제목,저자,출판사 여야 해요" }],
    });
  });

  it("엑셀이 CP949로 저장한 CSV도 한글이 깨지지 않는다", () => {
    // "제목,저자,출판사\n책,저자,\n"을 CP949로 적은 바이트
    const cp949 = new Uint8Array([
      0xc1, 0xa6, 0xb8, 0xf1, 0x2c, 0xc0, 0xfa, 0xc0, 0xda, 0x2c, 0xc3, 0xe2, 0xc6, 0xc7, 0xbb,
      0xe7, 0x0a, 0xc3, 0xa5, 0x2c, 0xc0, 0xfa, 0xc0, 0xda, 0x2c, 0x0a,
    ]);

    expect(decodeCsvFile(cp949.buffer)).toBe("제목,저자,출판사\n책,저자,\n");
  });

  it("UTF-8 CSV의 BOM은 머리줄에 남지 않는다", () => {
    const utf8 = new TextEncoder().encode("﻿제목,저자,출판사\n책,저자,\n");

    expect(parseBookCsv(decodeCsvFile(utf8.buffer))).toStrictEqual({
      ok: true,
      books: [{ title: "책", author: "저자", publisher: "" }],
    });
  });
});
