import { useId, useState } from "react";

import {
  BOOK_CSV_HEADER,
  decodeCsvFile,
  parseBookCsv,
  type BookCsvError,
} from "../domain/book-csv.ts";
import type { BookInput } from "../domain/drawer.ts";
import {
  Button,
  ButtonAnchor,
  Card,
  DropZone,
  InlineText,
  Input,
  List,
  ListItem,
  MutedText,
  SectionTitle,
  Stack,
  StatusText,
  Table,
  Td,
  Th,
  WarningText,
} from "../ui/index.ts";

/** 내려받아 그대로 올려 볼 수 있는 예시. 쉼표가 든 제목과 출판사를 비운 줄을 함께 둔다. */
export const EXAMPLE_CSV = [
  BOOK_CSV_HEADER.join(","),
  "아몬드,손원평,창비",
  "소년이 온다,한강,창비",
  '"사피엔스, 유인원에서 사이보그까지",유발 하라리,김영사',
  "출판사를 모르는 책,저자 이름,",
].join("\n");

/** 엑셀이 한글을 UTF-8로 읽도록 BOM을 붙인다. */
export const EXAMPLE_CSV_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(
  `\uFEFF${EXAMPLE_CSV}\n`,
)}`;

const PREVIEW_ROWS = 5;

/** 고른 파일의 상태. 읽은 책·틀린 줄·올린 결과가 한꺼번에 있을 수 없게 한 값으로 둔다. */
type UploadState =
  | { readonly status: "empty" }
  | { readonly status: "invalid"; readonly errors: readonly BookCsvError[] }
  | { readonly status: "ready"; readonly books: readonly BookInput[] }
  | { readonly status: "uploading"; readonly books: readonly BookInput[] }
  | { readonly status: "failed"; readonly books: readonly BookInput[]; readonly message: string }
  | { readonly status: "uploaded"; readonly count: number };

/**
 * 책 CSV 올리기. 양식과 저장하는 법을 함께 보여 주고, 파일을 고르면 먼저 읽어 보여 준 뒤
 * 운영자가 확인하고 올린다. 한 줄이라도 틀리면 그 줄을 알려 주고 아무것도 올리지 않는다.
 */
export function BookCsvUpload({
  onUpload,
}: {
  onUpload: (books: BookInput[]) => Promise<string | undefined>;
}) {
  const inputId = useId();
  const [state, setState] = useState<UploadState>({ status: "empty" });
  const [dragging, setDragging] = useState(false);

  const read = async (file: File | undefined) => {
    if (file === undefined) return setState({ status: "empty" });
    const result = parseBookCsv(decodeCsvFile(await file.arrayBuffer()));
    setState(
      result.ok
        ? { status: "ready", books: result.books }
        : { status: "invalid", errors: result.errors },
    );
  };

  const upload = async (books: readonly BookInput[]) => {
    setState({ status: "uploading", books });
    const failure = await onUpload([...books]);
    setState(
      failure === undefined
        ? { status: "uploaded", count: books.length }
        : { status: "failed", books, message: failure },
    );
  };

  return (
    <Card tone="flat" p="4" gap="3" aria-labelledby={`${inputId}-title`}>
      <SectionTitle id={`${inputId}-title`}>CSV로 책 올리기</SectionTitle>
      <ButtonAnchor
        href={EXAMPLE_CSV_HREF}
        download="책-예시.csv"
        tone="outline"
        size="md"
        alignSelf="flex-start"
      >
        예시 CSV 내려받기
      </ButtonAnchor>

      <DropZone
        data-dragging={dragging}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void read(event.dataTransfer.files[0]);
        }}
      >
        <InlineText weight="strong">CSV 파일을 여기에 끌어 놓으세요</InlineText>
        <MutedText>또는 눌러서 파일을 고르세요</MutedText>
        <Input
          srOnly
          type="file"
          accept=".csv,text/csv"
          aria-label="책 CSV 파일"
          onChange={(event) => void read(event.target.files?.[0])}
        />
      </DropZone>

      {state.status === "invalid" ? (
        <Stack gap="1" role="alert" aria-label="CSV 오류">
          {state.errors.map(({ line, message }) => (
            <WarningText key={line}>
              {line}번째 줄: {message}
            </WarningText>
          ))}
        </Stack>
      ) : null}

      {state.status === "ready" || state.status === "uploading" || state.status === "failed" ? (
        <Stack gap="2">
          <MutedText>
            {state.books.length}권을 읽었어요.
            {state.books.length > PREVIEW_ROWS ? ` 앞의 ${PREVIEW_ROWS}권만 보여 드려요.` : ""}
          </MutedText>
          <Table aria-label="읽은 책">
            <thead>
              <tr>
                {BOOK_CSV_HEADER.map((name) => (
                  <Th key={name}>{name}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.books.slice(0, PREVIEW_ROWS).map((book, index) => (
                <tr key={index}>
                  <Td>{book.title}</Td>
                  <Td>{book.author}</Td>
                  <Td>{book.publisher}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {state.status === "failed" ? (
            <WarningText role="alert" aria-label="올리기 실패">
              {state.message}
            </WarningText>
          ) : null}
          <Button
            type="button"
            alignSelf="flex-start"
            disabled={state.status === "uploading"}
            onClick={() => void upload(state.books)}
          >
            {state.books.length}권 올리기
          </Button>
        </Stack>
      ) : null}

      {state.status === "uploaded" ? (
        <StatusText role="status" aria-label="올린 결과">
          {state.count}권을 올렸어요
        </StatusText>
      ) : null}
    </Card>
  );
}
