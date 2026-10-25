import { useId, useRef, useState } from "react";
import { styled } from "styled-system/jsx";

import type { QuestionSetDraftDto } from "../admin-dto.ts";
import {
  parseQuestionSet,
  type ChoiceQuestion,
  type DrawerCode,
  type QuestionSet,
} from "../domain/question-set.ts";
import {
  Button as UiButton,
  Card,
  Field,
  FieldError as ErrorText,
  Input as Control,
  Label,
  SectionTitle as CardTitle,
  StatusText as Status,
  Textarea as TextArea,
} from "../ui/index.ts";
import { QuestionPreview } from "./question-preview.tsx";
import { StatementPreview } from "./statement-preview.tsx";

interface EditableDrawer {
  readonly code: DrawerCode;
  name: string;
  order: string;
  keywords: string;
  mark: string;
  reason: string;
  statement: string;
}

type EditableQuestion =
  | {
      readonly key: string;
      readonly type: "item";
      readonly drawer: DrawerCode;
      text: string;
      reversed: boolean;
    }
  | {
      readonly key: string;
      readonly type: "choice";
      readonly text: string;
      readonly question: ChoiceQuestion;
    };

const Form = styled("form", {
  base: { display: "flex", flexDirection: "column", gap: "5", width: "full" },
});

const EditorHeader = styled("div", {
  base: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "4",
    flexWrap: "wrap",
  },
});

const NameField = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "1", minW: "18rem", flex: "1" },
});

const NumberControl = styled(Control, {
  base: { maxW: "8rem", textAlign: "center" },
});

const Note = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const Grid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))",
    gap: "4",
    alignItems: "start",
  },
});

const CardHeader = styled("div", {
  base: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "2",
    pb: "2",
    borderBottomWidth: "1px",
    borderColor: "paper.300",
  },
});

const Count = styled("span", {
  base: {
    flexShrink: "0",
    color: "pine.700",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
});

const ItemList = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "2", m: "0", p: "0", listStyle: "none" },
});

const ItemRow = styled("li", {
  base: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto auto",
    alignItems: "center",
    gap: "2",
  },
});

const CheckLabel = styled("label", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "1",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    whiteSpace: "nowrap",
  },
});

const SettingsGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
    gap: "3",
    pt: "3",
    borderTopWidth: "1px",
    borderColor: "paper.300",
  },
});

const WideField = styled(Field, { base: { gridColumn: "1 / -1" } });

const PreviewGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))",
    gap: "4",
    alignItems: "start",
  },
});

const PreviewPicker = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "3",
    flexWrap: "wrap",
    p: "4",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
  },
});

const Select = styled("select", {
  base: {
    minH: "10",
    px: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
  },
});

const Baseline = styled("details", {
  base: {
    p: "4",
    borderWidth: "1px",
    borderColor: "paper.300",
    borderRadius: "l2",
    bg: "surface",
  },
});

const BaselineList = styled("ul", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "1",
    mt: "2",
    m: "0",
    p: "0",
    listStyle: "none",
  },
});

const splitKeywords = (value: string): string[] =>
  value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword !== "");

const drawerFrom = (
  drawer: QuestionSetDraftDto["questionSet"]["drawers"][number],
): EditableDrawer => ({
  code: drawer.code,
  name: drawer.name,
  order: String(drawer.order),
  keywords: drawer.keywords.join(", "),
  mark: drawer.mark ?? "",
  reason: drawer.reason ?? "",
  statement: drawer.statement ?? "",
});

const questionsFrom = (set: QuestionSet): EditableQuestion[] =>
  set.questions.map((question, index) =>
    question.type === "item"
      ? {
          key: `q${index}`,
          type: "item",
          drawer: question.drawer,
          text: question.text,
          reversed: question.reversed,
        }
      : {
          key: `q${index}`,
          type: "choice",
          text: question.text,
          question,
        },
  );

const structureChangedFrom = (
  questions: readonly EditableQuestion[],
  initial: QuestionSet,
): boolean => {
  if (questions.length !== initial.questions.length) return true;
  return questions.some((question, index) => {
    const before = initial.questions[index];
    if (before === undefined || before.type !== question.type) return true;
    if (question.type === "item" && before.type === "item") {
      return before.drawer !== question.drawer || before.reversed !== question.reversed;
    }
    return false;
  });
};

/**
 * 질문 세트 초안 편집기. 관리자가 문장을 쓰는 일을 가운데 두고, 서랍별 문항 수와
 * 상태 문장·인용·문항 화면을 같은 자리에서 본다. 저장은 도메인 파서를 통과한 값만 보낸다.
 * 선택형 질문은 스키마에 있지만 이 화면에서는 고치지 않는다(C-1).
 */
export function QuestionSetEditor({
  draft,
  onSave,
}: {
  draft: QuestionSetDraftDto;
  onSave: (input: { name: string; questionSet: QuestionSet }) => Promise<string | undefined>;
}) {
  const idPrefix = useId();
  const nextKey = useRef(0);
  const [name, setName] = useState(draft.name);
  const [drawers, setDrawers] = useState<EditableDrawer[]>(() =>
    draft.questionSet.drawers.map(drawerFrom),
  );
  const [questions, setQuestions] = useState<EditableQuestion[]>(() =>
    questionsFrom(draft.questionSet),
  );
  const [statementTemplate, setStatementTemplate] = useState(draft.questionSet.statementTemplate);
  const [secondStatementTemplate, setSecondStatementTemplate] = useState(
    draft.questionSet.secondStatementTemplate,
  );
  const [citationItem, setCitationItem] = useState(draft.questionSet.citationTemplates.item);
  const [citationChoice, setCitationChoice] = useState(draft.questionSet.citationTemplates.choice);
  const [selectedCode, setSelectedCode] = useState<DrawerCode>(
    draft.questionSet.drawers[0]?.code ?? "B1",
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedDrawer = drawers.find(({ code }) => code === selectedCode) ?? drawers[0];
  const selectedItems = questions.filter(
    (question): question is Extract<EditableQuestion, { type: "item" }> =>
      question.type === "item" && question.drawer === selectedDrawer?.code,
  );
  const selectedItem = selectedItems[0];
  const structureChanged = structureChangedFrom(questions, draft.questionSet);
  const choiceCount = questions.filter(({ type }) => type === "choice").length;

  const updateDrawer = (code: DrawerCode, patch: Partial<EditableDrawer>) => {
    setDrawers((current) =>
      current.map((drawer) => (drawer.code === code ? { ...drawer, ...patch } : drawer)),
    );
    setMessage(null);
    setError(null);
  };

  const updateItem = (key: string, patch: { text?: string; reversed?: boolean }) => {
    setQuestions((current) =>
      current.map((question) =>
        question.key === key && question.type === "item" ? { ...question, ...patch } : question,
      ),
    );
    setMessage(null);
    setError(null);
  };

  const addItem = (drawer: DrawerCode) => {
    nextKey.current += 1;
    setQuestions((current) => [
      ...current,
      {
        key: `new-${nextKey.current}`,
        type: "item",
        drawer,
        text: "새 문항을 써 주세요",
        reversed: false,
      },
    ]);
    setMessage(null);
    setError(null);
  };

  const removeItem = (key: string) => {
    setQuestions((current) =>
      current.filter((question) => question.key !== key || question.type === "choice"),
    );
    setMessage(null);
    setError(null);
  };

  const buildQuestionSet = (): QuestionSet => {
    const questionDtos = questions.map((question) =>
      question.type === "item"
        ? {
            type: "item" as const,
            drawer: question.drawer,
            reversed: question.reversed,
            text: question.text,
          }
        : question.question,
    );

    return parseQuestionSet({
      drawers: drawers.map((drawer) => ({
        code: drawer.code,
        name: drawer.name,
        order: Number(drawer.order),
        keywords: splitKeywords(drawer.keywords),
        mark: drawer.mark.trim() === "" ? null : drawer.mark,
        reason: drawer.reason.trim() === "" ? null : drawer.reason,
        statement: drawer.statement.trim() === "" ? null : drawer.statement,
      })),
      questions: questionDtos,
      scoring: draft.questionSet.scoring,
      statementTemplate,
      secondStatementTemplate,
      citationTemplates: { item: citationItem, choice: citationChoice },
      baselines: structureChanged ? [] : draft.questionSet.baselines,
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (name.trim() === "") {
      setError("초안 이름을 넣어 주세요");
      return;
    }

    let questionSet: QuestionSet;
    try {
      questionSet = buildQuestionSet();
    } catch {
      setError(
        "질문 세트를 저장할 수 없어요. 빈 문장, 겹친 핵심 단어, 서랍 순서, 문장 틀을 확인해 주세요",
      );
      return;
    }

    setPending(true);
    try {
      const failure = await onSave({ name: name.trim(), questionSet });
      if (failure === undefined) setMessage("초안을 저장했어요.");
      else setError(failure);
    } catch {
      setError("질문 세트를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요");
    } finally {
      setPending(false);
    }
  };

  return (
    <Form onSubmit={submit} noValidate aria-label="질문 세트 편집">
      <EditorHeader>
        <NameField>
          <Label size="sm" htmlFor={`${idPrefix}-name`}>
            초안 이름
          </Label>
          <Control
            id={`${idPrefix}-name`}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </NameField>
        <div>
          <Note>
            {questions.length}문항 · 서랍 {drawers.length}개 · 저장은 초안에만 해요
          </Note>
          <UiButton type="submit" disabled={pending} aria-busy={pending || undefined}>
            {pending ? "저장하는 중…" : "초안 저장"}
          </UiButton>
        </div>
      </EditorHeader>

      {choiceCount === 0 ? null : (
        <Note>
          선택형 질문 {choiceCount}개는 이 화면에서 고치지 않고 그대로 둬요. 문항형만 편집할 수
          있어요.
        </Note>
      )}
      {structureChanged ? (
        <Note>문항 구조를 바꿔서 저장할 때 기준 응답은 비워져요. 기준 응답은 읽기 전용이에요.</Note>
      ) : null}
      {message === null ? null : <Status role="status">{message}</Status>}
      {error === null ? null : (
        <ErrorText role="alert" aria-label="질문 세트 저장 오류">
          {error}
        </ErrorText>
      )}

      <Grid>
        {drawers.map((drawer) => {
          const items = questions.filter(
            (question): question is Extract<EditableQuestion, { type: "item" }> =>
              question.type === "item" && question.drawer === drawer.code,
          );
          const prefix = `${idPrefix}-${drawer.code}`;

          return (
            <Card key={drawer.code} aria-labelledby={`${prefix}-title`}>
              <CardHeader>
                <CardTitle id={`${prefix}-title`}>{drawer.name}</CardTitle>
                <Count>문항 {items.length}개</Count>
              </CardHeader>

              {items.length === 0 ? <Note>아직 문항이 없어요. 문항을 더해 주세요.</Note> : null}
              <ItemList>
                {items.map((item, index) => (
                  <ItemRow key={item.key}>
                    <Control
                      type="text"
                      aria-label={`${drawer.name} ${index + 1}번 문항`}
                      value={item.text}
                      onChange={(event) => updateItem(item.key, { text: event.target.value })}
                    />
                    <CheckLabel>
                      <input
                        type="checkbox"
                        aria-label={`${drawer.name} ${index + 1}번 문항 반대`}
                        checked={item.reversed}
                        onChange={(event) =>
                          updateItem(item.key, { reversed: event.target.checked })
                        }
                      />
                      반대
                    </CheckLabel>
                    <UiButton
                      tone="outline"
                      size="sm"
                      type="button"
                      aria-label={`${drawer.name} ${index + 1}번 문항 빼기`}
                      onClick={() => removeItem(item.key)}
                    >
                      빼기
                    </UiButton>
                  </ItemRow>
                ))}
              </ItemList>
              <div>
                <UiButton
                  size="sm"
                  type="button"
                  aria-label={`${drawer.name} 문항 추가`}
                  onClick={() => addItem(drawer.code)}
                >
                  문항 추가
                </UiButton>
              </div>

              <SettingsGrid>
                <Field>
                  <Label size="sm" htmlFor={`${prefix}-drawer-name`}>
                    서랍 이름
                  </Label>
                  <Control
                    id={`${prefix}-drawer-name`}
                    type="text"
                    value={drawer.name}
                    onChange={(event) => updateDrawer(drawer.code, { name: event.target.value })}
                  />
                </Field>
                <Field>
                  <Label size="sm" htmlFor={`${prefix}-keywords`}>
                    핵심 단어
                  </Label>
                  <Control
                    id={`${prefix}-keywords`}
                    type="text"
                    value={drawer.keywords}
                    onChange={(event) =>
                      updateDrawer(drawer.code, { keywords: event.target.value })
                    }
                  />
                </Field>
                <Field>
                  <Label size="sm" htmlFor={`${prefix}-mark`}>
                    서랍 표시
                  </Label>
                  <Control
                    id={`${prefix}-mark`}
                    type="text"
                    value={drawer.mark}
                    onChange={(event) => updateDrawer(drawer.code, { mark: event.target.value })}
                  />
                </Field>
                <Field>
                  <Label size="sm" htmlFor={`${prefix}-order`}>
                    서랍 순서
                  </Label>
                  <NumberControl
                    id={`${prefix}-order`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={drawer.order}
                    onChange={(event) => updateDrawer(drawer.code, { order: event.target.value })}
                  />
                </Field>
                <WideField>
                  <Label size="sm" htmlFor={`${prefix}-reason`}>
                    권하는 이유
                  </Label>
                  <TextArea
                    id={`${prefix}-reason`}
                    value={drawer.reason}
                    onChange={(event) => updateDrawer(drawer.code, { reason: event.target.value })}
                  />
                </WideField>
                <WideField>
                  <Label size="sm" htmlFor={`${prefix}-statement`}>
                    서랍별 상태 문장
                  </Label>
                  <Control
                    id={`${prefix}-statement`}
                    type="text"
                    value={drawer.statement}
                    onChange={(event) =>
                      updateDrawer(drawer.code, { statement: event.target.value })
                    }
                    placeholder="비우면 공통 문장을 써요"
                  />
                </WideField>
              </SettingsGrid>
            </Card>
          );
        })}
      </Grid>

      <Card>
        <CardHeader>
          <CardTitle>공통 문장 틀</CardTitle>
          <Count>표시와 인용</Count>
        </CardHeader>
        <SettingsGrid>
          <WideField>
            <Label size="sm" htmlFor={`${idPrefix}-statement-template`}>
              첫 상태 문장 틀
            </Label>
            <Control
              id={`${idPrefix}-statement-template`}
              type="text"
              value={statementTemplate}
              onChange={(event) => setStatementTemplate(event.target.value)}
            />
          </WideField>
          <WideField>
            <Label size="sm" htmlFor={`${idPrefix}-second-template`}>
              둘째 상태 문장 틀
            </Label>
            <Control
              id={`${idPrefix}-second-template`}
              type="text"
              value={secondStatementTemplate}
              onChange={(event) => setSecondStatementTemplate(event.target.value)}
            />
          </WideField>
          <Field>
            <Label size="sm" htmlFor={`${idPrefix}-citation-item`}>
              문항 인용 문형
            </Label>
            <Control
              id={`${idPrefix}-citation-item`}
              type="text"
              value={citationItem}
              onChange={(event) => setCitationItem(event.target.value)}
            />
          </Field>
          <Field>
            <Label size="sm" htmlFor={`${idPrefix}-citation-choice`}>
              선택 인용 문형
            </Label>
            <Control
              id={`${idPrefix}-citation-choice`}
              type="text"
              value={citationChoice}
              onChange={(event) => setCitationChoice(event.target.value)}
            />
          </Field>
        </SettingsGrid>
      </Card>

      <PreviewPicker>
        <Label size="sm" htmlFor={`${idPrefix}-preview-drawer`}>
          미리보기 서랍
        </Label>
        <Select
          id={`${idPrefix}-preview-drawer`}
          value={selectedDrawer?.code ?? ""}
          onChange={(event) => setSelectedCode(event.target.value as DrawerCode)}
        >
          {drawers.map((drawer) => (
            <option key={drawer.code} value={drawer.code}>
              {drawer.name}
            </option>
          ))}
        </Select>
        <Note>별명 “토끼”와 지금 고른 서랍 이름으로 문장과 조사를 확인해요.</Note>
      </PreviewPicker>

      {selectedDrawer === undefined ? null : (
        <PreviewGrid>
          <StatementPreview
            drawerName={selectedDrawer.name}
            nickname="토끼"
            statementTemplate={
              selectedDrawer.statement.trim() === "" ? statementTemplate : selectedDrawer.statement
            }
            secondStatementTemplate={secondStatementTemplate}
            citationTemplate={citationItem}
            quote={selectedItem?.text ?? "이 서랍이 필요해요"}
          />
          <QuestionPreview
            drawerName={selectedDrawer.name}
            questionText={selectedItem?.text ?? "아직 문항이 없어요"}
            index={
              selectedItem === undefined
                ? 0
                : Math.max(
                    0,
                    questions.findIndex((question) => question.key === selectedItem.key),
                  )
            }
            total={questions.length}
          />
        </PreviewGrid>
      )}

      <Baseline>
        <summary>기준 응답 (읽기 전용)</summary>
        {draft.questionSet.baselines.length === 0 ? (
          <Note>이 초안에는 기준 응답이 없어요.</Note>
        ) : (
          <BaselineList>
            {draft.questionSet.baselines.map((baseline) => {
              const names = new Map(
                drawers.map(({ code, name: drawerName }) => [code, drawerName]),
              );
              return (
                <li key={baseline.name}>
                  <strong>{baseline.name}</strong>: 기대{" "}
                  {names.get(baseline.expected.first) ?? baseline.expected.first} ·{" "}
                  {names.get(baseline.expected.second) ?? baseline.expected.second} / 답{" "}
                  {baseline.answers.join(", ")}
                </li>
              );
            })}
          </BaselineList>
        )}
      </Baseline>
    </Form>
  );
}
