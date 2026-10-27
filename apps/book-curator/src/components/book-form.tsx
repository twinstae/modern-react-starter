import { useId, useMemo } from "react";
import * as v from "valibot";
import { styled } from "styled-system/jsx";

import { BookInputSchema, type Book, type BookInput } from "../domain/book.ts";
import { DRAWER_CODES, type DrawerCode } from "../domain/question-set.ts";
import {
  Actions,
  AutoGrid,
  Button,
  Card,
  Fieldset,
  Hint,
  Legend,
  NumberField,
  SectionTitle,
  SimpleForm,
  SubmitButton,
  TextareaField,
  TextField,
} from "../ui/index.ts";

export interface BookFormDrawer {
  readonly code: DrawerCode;
  readonly name: string;
}

const splitKeywords = (value: string): string[] =>
  value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword !== "");

const SplitKeywordsSchema = v.pipe(
  v.string(),
  v.check((value) => splitKeywords(value).length > 0, "핵심 단어를 쉼표로 하나 이상 넣어 주세요"),
  v.check(
    (value) => new Set(splitKeywords(value)).size === splitKeywords(value).length,
    "같은 핵심 단어를 두 번 넣을 수 없어요",
  ),
);

const textFrom = (book: Book | undefined) => ({
  title: book?.title ?? "",
  author: book?.author ?? "",
  keywords: book?.keywords.join(", ") ?? "",
  reason: book?.reason ?? "",
  question: book?.question ?? "",
});

const relevanceFrom = (book: Book | undefined): Record<DrawerCode, number> =>
  Object.fromEntries(DRAWER_CODES.map((code) => [code, book?.relevance[code] ?? 0])) as Record<
    DrawerCode,
    number
  >;

const requiredText = (message: string) => v.pipe(v.string(), v.trim(), v.minLength(1, message));

const relevanceValue = (name: string) =>
  v.pipe(
    v.number(`${name} 관련도는 0~5 정수로 넣어 주세요`),
    v.integer(`${name} 관련도는 0~5 정수로 넣어 주세요`),
    v.minValue(0, `${name} 관련도는 0~5 정수로 넣어 주세요`),
    v.maxValue(5, `${name} 관련도는 0~5 정수로 넣어 주세요`),
  );

const bookFormSchema = (drawers: readonly BookFormDrawer[]) =>
  v.pipe(
    v.object({
      title: requiredText("제목을 넣어 주세요"),
      author: requiredText("저자를 넣어 주세요"),
      keywords: SplitKeywordsSchema,
      reason: requiredText("권하는 이유를 넣어 주세요"),
      question: requiredText("함께 생각해 볼 질문을 넣어 주세요"),
      relevance: v.object(
        Object.fromEntries(
          DRAWER_CODES.map((code) => [
            code,
            relevanceValue(drawers.find((drawer) => drawer.code === code)?.name ?? code),
          ]),
        ) as Record<DrawerCode, ReturnType<typeof relevanceValue>>,
      ),
    }),
    v.transform(
      (values) =>
        ({
          title: values.title,
          author: values.author,
          keywords: splitKeywords(values.keywords),
          reason: values.reason,
          question: values.question,
          relevance: values.relevance,
        }) satisfies BookInput,
    ),
    BookInputSchema,
  );

/**
 * 부록 C의 책 입력. 관련도 칸의 이름은 서랍 코드가 아니라 지금 공개된 서랍 이름이다.
 * 형식은 스키마가 막고, 저장 실패는 콜백이 돌려준 문구를 그대로 보여 준다.
 */
export function BookForm({
  drawers,
  initial,
  submitLabel = "저장",
  onSubmit,
  onCancel,
}: {
  drawers: readonly BookFormDrawer[];
  initial?: Book;
  submitLabel?: string;
  onSubmit: (input: BookInput) => Promise<string | undefined>;
  onCancel?: () => void;
}) {
  const schema = useMemo(() => bookFormSchema(drawers), [drawers]);

  return (
    <SimpleForm
      aria-label="책 입력"
      schema={schema}
      defaultValues={{ ...textFrom(initial), relevance: relevanceFrom(initial) }}
      onSubmit={onSubmit}
      noValidate
    >
      <TextField name="title" label="제목" />
      <TextField name="author" label="저자" />
      <TextField
        name="keywords"
        label="핵심 단어"
        hint="쉼표로 나눠 적어 주세요. 예: 계급, 불평등"
      />
      <TextareaField name="reason" label="권하는 이유" />
      <TextareaField name="question" label="함께 생각해 볼 질문" />

      <Fieldset>
        <Legend>서랍별 관련도</Legend>
        <Hint>0은 거의 관계없음, 5는 아주 잘 맞음이에요. 정수로 적어 주세요.</Hint>
        <AutoGrid min="sm" gap="3">
          {drawers.map((drawer) => (
            <NumberField
              key={drawer.code}
              name={`relevance.${drawer.code}`}
              label={`${drawer.name} 관련도`}
              min={0}
              max={5}
              step={1}
            />
          ))}
        </AutoGrid>
      </Fieldset>

      <Actions divider mt="2">
        {onCancel === undefined ? null : (
          <Button tone="outline" type="button" onClick={onCancel}>
            취소
          </Button>
        )}
        <SubmitButton>{submitLabel}</SubmitButton>
      </Actions>
    </SimpleForm>
  );
}

export function BookDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();

  return (
    <Overlay>
      <Card
        tone="paper"
        width="full"
        maxW="56rem"
        p="6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <DialogHeader>
          <SectionTitle id={titleId}>{title}</SectionTitle>
          <Button
            tone="outline"
            size="sm"
            type="button"
            onClick={onClose}
            aria-label="책 편집 닫기"
          >
            닫기
          </Button>
        </DialogHeader>
        {children}
      </Card>
    </Overlay>
  );
}

const Overlay = styled("div", {
  base: {
    position: "fixed",
    inset: "0",
    zIndex: "modal",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    overflowY: "auto",
    px: "page",
    py: "8",
    bg: "rgba(24, 35, 29, 0.45)",
  },
});

const DialogHeader = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "4",
    pb: "3",
    borderBottomWidth: "2px",
    borderColor: "border",
  },
});
