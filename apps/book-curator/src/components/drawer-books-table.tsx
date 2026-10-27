import { useState } from "react";
import * as v from "valibot";

import { BookInputSchema, type BookInput, type DrawerBook } from "../domain/drawer.ts";
import {
  Button,
  MutedText,
  Row,
  SimpleForm,
  SubmitButton,
  Table,
  Td,
  TextField,
  Th,
} from "../ui/index.ts";

const BookFormSchema = v.object(BookInputSchema.entries);

function BookFields() {
  return (
    <Row alignItems="flex-end" flexWrap="wrap">
      <TextField name="title" label="제목" />
      <TextField name="author" label="저자" />
      <TextField name="publisher" label="출판사" />
    </Row>
  );
}

/**
 * 서랍에 든 책 목록. 책마다 고치거나 뺄 수 있고, 한 권만 손으로 더할 수도 있다.
 * 여러 권은 CSV로 올린다. 한 번에 한 책만 고치고, 고치는 동안에는 더하기 폼을 닫는다.
 */
export function DrawerBooksTable({
  books,
  onAdd,
  onUpdate,
  onRemove,
}: {
  books: readonly DrawerBook[];
  onAdd: (book: BookInput) => Promise<string | undefined>;
  onUpdate: (bookId: string, book: BookInput) => Promise<string | undefined>;
  onRemove: (bookId: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <>
      {books.length === 0 ? (
        <MutedText>아직 이 서랍에 책이 없어요. CSV로 올리거나 한 권씩 더해 주세요.</MutedText>
      ) : (
        <Table aria-label="서랍 속 책">
          <thead>
            <tr>
              <Th>제목</Th>
              <Th>저자</Th>
              <Th>출판사</Th>
              <Th>고치기·빼기</Th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) =>
              editing === book.id ? (
                <tr key={book.id}>
                  <Td colSpan={4}>
                    <SimpleForm
                      aria-label={`${book.title} 고치기`}
                      schema={BookFormSchema}
                      defaultValues={{
                        title: book.title,
                        author: book.author,
                        publisher: book.publisher,
                      }}
                      onSubmit={(input: BookInput) => onUpdate(book.id, input)}
                      onSuccess={() => setEditing(null)}
                    >
                      <BookFields />
                      <Row>
                        <SubmitButton>고친 내용 저장</SubmitButton>
                        <Button type="button" tone="outline" onClick={() => setEditing(null)}>
                          그만두기
                        </Button>
                      </Row>
                    </SimpleForm>
                  </Td>
                </tr>
              ) : (
                <tr key={book.id}>
                  <Td>{book.title}</Td>
                  <Td>{book.author}</Td>
                  <Td>{book.publisher}</Td>
                  <Td>
                    <Row gap="2" flexWrap="nowrap">
                      <Button
                        type="button"
                        tone="outline"
                        size="sm"
                        aria-label={`${book.title} 고치기`}
                        onClick={() => setEditing(book.id)}
                      >
                        고치기
                      </Button>
                      <Button
                        type="button"
                        tone="outline"
                        size="sm"
                        aria-label={`${book.title} 빼기`}
                        onClick={() => onRemove(book.id)}
                      >
                        빼기
                      </Button>
                    </Row>
                  </Td>
                </tr>
              ),
            )}
          </tbody>
        </Table>
      )}

      {editing !== null ? null : (
        <SimpleForm
          aria-label="책 한 권 더하기"
          schema={BookFormSchema}
          defaultValues={{ title: "", author: "", publisher: "" }}
          resetOnSuccess={["title", "author", "publisher"]}
          onSubmit={(input: BookInput) => onAdd(input)}
        >
          <BookFields />
          <SubmitButton tone="outline">책 한 권 더하기</SubmitButton>
        </SimpleForm>
      )}
    </>
  );
}
