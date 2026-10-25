import { useId, useState } from "react";
import { styled } from "styled-system/jsx";

import { parseBookInput, type Book, type BookInput, type BookRelevance } from "../domain/book.ts";
import { DRAWER_CODES, type DrawerCode } from "../domain/question-set.ts";

export interface BookFormDrawer {
  readonly code: DrawerCode;
  readonly name: string;
}

interface BookTextValues {
  title: string;
  author: string;
  keywords: string;
  reason: string;
  question: string;
}

type TextField = keyof BookTextValues;
type RelevanceField = `relevance:${DrawerCode}`;
type BookFormErrorField = TextField | RelevanceField | "form";

type BookFormErrors = Partial<Record<BookFormErrorField, string>>;

const Form = styled("form", {
  base: { display: "flex", flexDirection: "column", gap: "4", width: "full" },
});

const Fieldset = styled("fieldset", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
    mt: "2",
    pt: "4",
    borderTopWidth: "1px",
    borderColor: "paper.300",
  },
});

const Legend = styled("legend", {
  base: { fontFamily: "body", fontSize: "kiosk-body", fontWeight: "700" },
});

const Field = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "1" },
});

const Label = styled("label", {
  base: { fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

const Control = styled("input", {
  base: {
    width: "full",
    minH: "11",
    px: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    outline: "none",
    _focusVisible: { borderColor: "pine.500", outline: "3px solid", outlineColor: "pine.500" },
    _invalid: { borderColor: "seal.500" },
  },
});

const TextArea = styled("textarea", {
  base: {
    width: "full",
    minH: "24",
    px: "3",
    py: "2",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    lineHeight: "1.5",
    resize: "vertical",
    outline: "none",
    _focusVisible: { borderColor: "pine.500", outline: "3px solid", outlineColor: "pine.500" },
    _invalid: { borderColor: "seal.500" },
  },
});

const RelevanceGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
    gap: "3",
  },
});

const Hint = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const ErrorText = styled("p", {
  base: { color: "seal.500", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

const Actions = styled("div", {
  base: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "3",
    mt: "2",
    pt: "4",
    borderTopWidth: "2px",
    borderColor: "border",
  },
});

const CancelButton = styled("button", {
  base: {
    minH: "11",
    px: "4",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    cursor: "pointer",
    _hover: { bg: "paper.100" },
  },
});

const Submit = styled("button", {
  base: {
    minH: "11",
    px: "5",
    borderWidth: "2px",
    borderColor: "pine.700",
    borderRadius: "l2",
    bg: "pine.600",
    color: "paper.50",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "zine",
    _hover: { bg: "pine.700" },
    _active: { translate: "2px 2px", boxShadow: "none" },
    _disabled: { cursor: "wait", opacity: "0.7" },
  },
});

const textFrom = (book: Book | undefined): BookTextValues => ({
  title: book?.title ?? "",
  author: book?.author ?? "",
  keywords: book?.keywords.join(", ") ?? "",
  reason: book?.reason ?? "",
  question: book?.question ?? "",
});

const relevanceFrom = (book: Book | undefined): Record<DrawerCode, string> =>
  Object.fromEntries(
    DRAWER_CODES.map((code) => [code, String(book?.relevance[code] ?? 0)]),
  ) as Record<DrawerCode, string>;

const required = (value: string, message: string): string | undefined =>
  value.trim() === "" ? message : undefined;

/**
 * 부록 C의 책 입력. 관련도 칸의 이름은 서랍 코드가 아니라 지금 공개된 서랍 이름이다.
 * 형식은 여기서 막고, 저장 실패는 콜백이 돌려준 문구를 그대로 보여 준다.
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
  const idPrefix = useId();
  const [text, setText] = useState<BookTextValues>(() => textFrom(initial));
  const [relevance, setRelevance] = useState<Record<DrawerCode, string>>(() =>
    relevanceFrom(initial),
  );
  const [errors, setErrors] = useState<BookFormErrors>({});
  const [pending, setPending] = useState(false);

  const idFor = (name: string) => `${idPrefix}-${name}`;
  const errorIdFor = (name: string) => `${idPrefix}-${name}-error`;

  const updateText = (field: TextField, value: string) => {
    setText((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const updateRelevance = (code: DrawerCode, value: string) => {
    setRelevance((current) => ({ ...current, [code]: value }));
    setErrors((current) => ({ ...current, [`relevance:${code}`]: undefined, form: undefined }));
  };

  const validate = (): { input?: BookInput; problems: BookFormErrors } => {
    const problems: BookFormErrors = {};
    const title = required(text.title, "제목을 넣어 주세요");
    const author = required(text.author, "저자를 넣어 주세요");
    const reason = required(text.reason, "권하는 이유를 넣어 주세요");
    const question = required(text.question, "함께 생각해 볼 질문을 넣어 주세요");
    if (title !== undefined) problems.title = title;
    if (author !== undefined) problems.author = author;
    if (reason !== undefined) problems.reason = reason;
    if (question !== undefined) problems.question = question;

    const keywords = text.keywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword !== "");
    if (keywords.length === 0) {
      problems.keywords = "핵심 단어를 쉼표로 하나 이상 넣어 주세요";
    } else if (new Set(keywords).size !== keywords.length) {
      problems.keywords = "같은 핵심 단어를 두 번 넣을 수 없어요";
    }

    const numbers = {} as Record<DrawerCode, number>;
    for (const code of DRAWER_CODES) {
      const raw = relevance[code].trim();
      const value = raw === "" ? Number.NaN : Number(raw);
      if (!Number.isInteger(value) || value < 0 || value > 5) {
        const name = drawers.find((drawer) => drawer.code === code)?.name ?? code;
        problems[`relevance:${code}`] = `${name} 관련도는 0~5 정수로 넣어 주세요`;
      }
      numbers[code] = value;
    }

    if (Object.keys(problems).length > 0) return { problems };

    try {
      return {
        input: parseBookInput({
          title: text.title,
          author: text.author,
          keywords,
          reason: text.reason,
          question: text.question,
          relevance: numbers as BookRelevance,
        }),
        problems,
      };
    } catch {
      return { problems: { form: "책 정보를 다시 확인해 주세요" } };
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { input, problems } = validate();
    setErrors(problems);
    if (input === undefined) return;

    setPending(true);
    try {
      const failure = await onSubmit(input);
      if (failure !== undefined) setErrors({ form: failure });
    } catch {
      setErrors({ form: "책을 저장하지 못했어요. 잠시 뒤 다시 해 주세요" });
    } finally {
      setPending(false);
    }
  };

  const textField = (
    field: TextField,
    label: string,
    options: { multiline?: boolean; hint?: string } = {},
  ) => {
    const error = errors[field];
    const inputProps = {
      id: idFor(field),
      name: field,
      value: text[field],
      "aria-invalid": error === undefined ? undefined : true,
      "aria-errormessage": error === undefined ? undefined : errorIdFor(field),
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        updateText(field, event.target.value),
    } as const;

    return (
      <Field>
        <Label htmlFor={idFor(field)}>{label}</Label>
        {options.multiline === true ? (
          <TextArea {...inputProps} />
        ) : (
          <Control {...inputProps} type="text" />
        )}
        {options.hint === undefined ? null : <Hint>{options.hint}</Hint>}
        {error === undefined ? null : (
          <ErrorText id={errorIdFor(field)} role="alert">
            {error}
          </ErrorText>
        )}
      </Field>
    );
  };

  return (
    <Form onSubmit={submit} noValidate>
      {textField("title", "제목")}
      {textField("author", "저자")}
      {textField("keywords", "핵심 단어", { hint: "쉼표로 나눠 적어 주세요. 예: 계급, 불평등" })}
      {textField("reason", "권하는 이유", { multiline: true })}
      {textField("question", "함께 생각해 볼 질문", { multiline: true })}

      <Fieldset>
        <Legend>서랍별 관련도</Legend>
        <Hint>0은 거의 관계없음, 5는 아주 잘 맞음이에요. 정수로 적어 주세요.</Hint>
        <RelevanceGrid>
          {drawers.map((drawer) => {
            const field = `relevance:${drawer.code}` as const;
            const error = errors[field];
            return (
              <Field key={drawer.code}>
                <Label htmlFor={idFor(field)}>{drawer.name} 관련도</Label>
                <Control
                  id={idFor(field)}
                  name={field}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={5}
                  step={1}
                  value={relevance[drawer.code]}
                  aria-invalid={error === undefined ? undefined : true}
                  aria-errormessage={error === undefined ? undefined : errorIdFor(field)}
                  onChange={(event) => updateRelevance(drawer.code, event.target.value)}
                />
                {error === undefined ? null : (
                  <ErrorText id={errorIdFor(field)} role="alert">
                    {error}
                  </ErrorText>
                )}
              </Field>
            );
          })}
        </RelevanceGrid>
      </Fieldset>

      {errors.form === undefined ? null : <ErrorText role="alert">{errors.form}</ErrorText>}

      <Actions>
        {onCancel === undefined ? null : (
          <CancelButton type="button" onClick={onCancel}>
            취소
          </CancelButton>
        )}
        <Submit type="submit" disabled={pending} aria-busy={pending || undefined}>
          {submitLabel}
        </Submit>
      </Actions>
    </Form>
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
      <Panel role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <DialogHeader>
          <DialogTitle id={titleId}>{title}</DialogTitle>
          <CloseButton type="button" onClick={onClose} aria-label="책 편집 닫기">
            닫기
          </CloseButton>
        </DialogHeader>
        {children}
      </Panel>
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

const Panel = styled("div", {
  base: {
    width: "full",
    maxW: "56rem",
    p: "6",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zineLg",
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

const DialogTitle = styled("h2", {
  base: { fontFamily: "heading", fontSize: "2xl", fontWeight: "600" },
});

const CloseButton = styled("button", {
  base: {
    minH: "10",
    px: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    cursor: "pointer",
    _hover: { bg: "paper.100" },
  },
});
