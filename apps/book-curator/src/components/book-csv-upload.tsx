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
  Card,
  Field,
  Input,
  Label,
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

/** 내려받는 양식. 엑셀이 한글을 UTF-8로 읽도록 BOM을 붙인다. */
const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(
  `﻿${BOOK_CSV_HEADER.join(",")}\n아무튼 예시,김예시,예시출판\n`,
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
      <List gap="1">
        <ListItem>
          첫 줄은 {BOOK_CSV_HEADER.join(",")} 입니다. 그 아래 한 줄에 책 한 권을 씁니다.
        </ListItem>
        <ListItem>출판사는 비워도 됩니다. 제목과 저자는 꼭 넣어 주세요.</ListItem>
        <ListItem>
          엑셀: 다른 이름으로 저장 → 파일 형식 “CSV UTF-8(쉼표로 분리)”. 구글 시트: 파일 → 다운로드
          → 쉼표로 구분된 값(.csv).
        </ListItem>
        <ListItem>올린 책은 이 서랍에 더해집니다. 이미 있는 책은 그대로 남습니다.</ListItem>
      </List>
      <a href={TEMPLATE_HREF} download="책-양식.csv">
        양식 내려받기
      </a>

      <Field>
        <Label htmlFor={inputId}>책 CSV 파일</Label>
        <Input
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void read(event.target.files?.[0])}
        />
      </Field>

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
