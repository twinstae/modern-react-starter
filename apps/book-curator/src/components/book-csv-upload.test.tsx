import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { BookInput } from "../domain/drawer.ts";
import { parseBookCsv } from "../domain/book-csv.ts";
import { BookCsvUpload, EXAMPLE_CSV, EXAMPLE_CSV_HREF } from "./book-csv-upload.tsx";
import * as Stories from "./book-csv-upload.stories.tsx";

const csvFile = (text: string) => new File([text], "책.csv", { type: "text/csv" });

describe("BookCsvUpload", () => {
  it("CSV를 고르면 읽은 책을 보여 주고, 올리면 그 책들이 서랍에 들어간다", async () => {
    const uploaded: BookInput[][] = [];

    await runSiheom(
      given.render(
        <BookCsvUpload
          onUpload={async (books) => {
            uploaded.push(books);
            return undefined;
          }}
        />,
      ),
      actions.upload(
        query.label("책 CSV 파일"),
        csvFile("제목,저자,출판사\n삶을 바꾸는 연습,김연습,연습출판\n쉼표 없는 책,박저자,\n"),
      ),
      assertions.visible(query.cell("삶을 바꾸는 연습")),
      actions.click(query.button("2권 올리기")),
      assertions.textContent(query.status("올린 결과"), "2권을 올렸어요"),
    );

    expect(uploaded).toStrictEqual([
      [
        { title: "삶을 바꾸는 연습", author: "김연습", publisher: "연습출판" },
        { title: "쉼표 없는 책", author: "박저자", publisher: "" },
      ],
    ]);
  });

  it("예시 CSV를 내려받아 그대로 올릴 수 있다", async () => {
    await runSiheom(
      given.render(<BookCsvUpload {...Stories.bookCsvUploadArgs} />),
      assertions.href(query.link("예시 CSV 내려받기"), EXAMPLE_CSV_HREF),
    );
    expect(parseBookCsv(EXAMPLE_CSV)).toMatchObject({ ok: true });
  });

  it("틀린 줄이 있으면 몇 번째 줄인지 알려 주고 올리지 않는다", async () => {
    await runSiheom(
      given.render(<BookCsvUpload {...Stories.bookCsvUploadArgs} />),
      actions.upload(query.label("책 CSV 파일"), csvFile("제목,저자,출판사\n,김연습,\n")),
      assertions.textContent(query.alert("CSV 오류"), "2번째 줄: 제목을 넣어 주세요"),
    );
  });
});
