import { describe, expect, it } from "vite-plus/test";

import { parseKioskCurrent, snapshotOf, toKioskCurrentDto } from "./kiosk.ts";
import { SEED_DRAWERS } from "./seed-question-set.ts";

describe("키오스크 묶음", () => {
  it("공개 버전이 없으면 준비 중이다", () => {
    expect(toKioskCurrentDto(null)).toStrictEqual({ status: "preparing" });
  });

  it("공개한 서랍들의 질문 세트와 서랍 속 책을 보내고 그대로 파싱한다", () => {
    const published = { version: 3, ...snapshotOf(SEED_DRAWERS) };
    const dto = toKioskCurrentDto(published);

    expect(dto.status === "ready" ? dto.shelf.drawers[0] : null).toStrictEqual({
      drawer: "B6",
      books: [
        {
          bookId: "B6-book-1",
          title: "삶의 방식을 바꾸는 책 1",
          author: "책방79-1",
          publisher: "",
        },
        {
          bookId: "B6-book-2",
          title: "삶의 방식을 바꾸는 책 2",
          author: "책방79-1",
          publisher: "",
        },
        {
          bookId: "B6-book-3",
          title: "삶의 방식을 바꾸는 책 3",
          author: "책방79-1",
          publisher: "",
        },
      ],
    });
    expect(parseKioskCurrent(JSON.parse(JSON.stringify(dto)))).toStrictEqual({
      status: "ready",
      ...published,
    });
  });

  it("응답 모양에 모르는 필드가 있으면 거부한다", () => {
    const dto = toKioskCurrentDto({ version: 1, ...snapshotOf(SEED_DRAWERS) });

    expect(() => parseKioskCurrent({ ...dto, nickname: "토끼" })).toThrow();
  });
});
