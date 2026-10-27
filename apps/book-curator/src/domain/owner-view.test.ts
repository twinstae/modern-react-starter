import { describe, expect, it } from "vite-plus/test";

import { curate } from "./curate.ts";
import { ownerView } from "./owner-view.ts";
import { parseQuestionSet } from "./question-set.ts";
import { SEOYUN_ANSWERS, SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";

const book = (bookId: string) => ({ bookId, title: `책 ${bookId}`, author: "저자", publisher: "" });
const SHELF = {
  drawers: [
    { drawer: "B6", books: [book("b6-1"), book("b6-2")] },
    { drawer: "B1", books: [book("b1-1")] },
    { drawer: "B2", books: [] },
  ],
};

describe("ownerView", () => {
  it("추천·2순위 서랍의 상태 문장과 책, 그리고 건넬 수 있는 모든 서랍을 담는다", () => {
    const curation = curate(parseQuestionSet(SEOYUN_SET_INPUT), SEOYUN_ANSWERS, "토끼");

    expect(ownerView(curation, SHELF)).toStrictEqual({
      recommended: {
        drawer: "B6",
        name: "삶의 방식을 바꾸는 책",
        books: [book("b6-1"), book("b6-2")],
        statement: "토끼 님에겐 지금, 삶의 방식을 바꾸는 책이 필요해 보여요",
      },
      second: {
        drawer: "B1",
        name: "나를 들여다보는 책",
        books: [book("b1-1")],
        statement: "나를 들여다보는 책이 함께 보이면 좋겠어요",
      },
      similar: false,
      drawers: [
        { drawer: "B6", name: "삶의 방식을 바꾸는 책", books: [book("b6-1"), book("b6-2")] },
        { drawer: "B1", name: "나를 들여다보는 책", books: [book("b1-1")] },
        { drawer: "B2", name: "관계를 다시 생각하는 책", books: [] },
      ],
    });
  });
});
