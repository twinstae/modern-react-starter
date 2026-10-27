import { useMemo, useState } from "react";
import * as v from "valibot";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import type { QuestionSetDraftDto } from "../admin-dto.ts";
import {
  DrawerCodeSchema,
  parseQuestionSet,
  QuestionSchema,
  TextSchema,
  type DrawerCode,
  type Question,
  type QuestionSet,
} from "../domain/question-set.ts";
import {
  AutoGrid,
  Card,
  CardHeader,
  CheckboxField,
  Disclosure,
  Hint,
  InlineText,
  Label,
  List,
  ListItem,
  MutedText,
  NumberField,
  PageHeader,
  Row,
  SectionTitle as CardTitle,
  Select,
  SimpleForm,
  Stack,
  StatusText as Status,
  SubmitButton,
  TextareaField,
  TextField,
  Button as UiButton,
} from "../ui/index.ts";
import { QuestionPreview } from "./question-preview.tsx";
import { StatementPreview } from "./statement-preview.tsx";

interface EditableDrawer {
  code: DrawerCode;
  name: string;
  order: number;
  keywords: string;
  mark: string;
  reason: string;
  statement: string;
}

interface EditorValues {
  name: string;
  drawers: EditableDrawer[];
  questions: Question[];
  statementTemplate: string;
  secondStatementTemplate: string;
  citationItem: string;
  citationChoice: string;
}

const splitKeywords = (value: string): string[] =>
  value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword !== "");

const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const drawerFrom = (
  drawer: QuestionSetDraftDto["questionSet"]["drawers"][number],
): EditableDrawer => ({
  code: drawer.code,
  name: drawer.name,
  order: drawer.order,
  keywords: drawer.keywords.join(", "),
  mark: drawer.mark ?? "",
  reason: drawer.reason ?? "",
  statement: drawer.statement ?? "",
});

const valuesFrom = (draft: QuestionSetDraftDto): EditorValues => ({
  name: draft.name,
  drawers: draft.questionSet.drawers.map(drawerFrom),
  questions: draft.questionSet.questions.map((question) =>
    question.type === "item"
      ? {
          type: "item",
          drawer: question.drawer,
          text: question.text,
          reversed: question.reversed,
        }
      : question,
  ),
  statementTemplate: draft.questionSet.statementTemplate,
  secondStatementTemplate: draft.questionSet.secondStatementTemplate,
  citationItem: draft.questionSet.citationTemplates.item,
  citationChoice: draft.questionSet.citationTemplates.choice,
});

const structureChangedFrom = (questions: readonly Question[], initial: QuestionSet): boolean => {
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

const EditorSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "초안 이름을 넣어 주세요")),
  drawers: v.array(
    v.object({
      code: DrawerCodeSchema,
      name: TextSchema,
      order: v.pipe(v.number("서랍 순서는 0 이상 정수로 넣어 주세요"), v.integer(), v.minValue(0)),
      keywords: v.string(),
      mark: v.string(),
      reason: v.string(),
      statement: v.string(),
    }),
  ),
  questions: v.array(QuestionSchema),
  statementTemplate: TextSchema,
  secondStatementTemplate: TextSchema,
  citationItem: TextSchema,
  citationChoice: TextSchema,
});

const questionSetFrom = (values: EditorValues, initial: QuestionSet): QuestionSet =>
  parseQuestionSet({
    drawers: values.drawers.map((drawer) => ({
      code: drawer.code,
      name: drawer.name,
      order: drawer.order,
      keywords: splitKeywords(drawer.keywords),
      mark: blankToNull(drawer.mark),
      reason: blankToNull(drawer.reason),
      statement: blankToNull(drawer.statement),
    })),
    questions: values.questions.map((question) =>
      question.type === "item"
        ? {
            type: "item",
            drawer: question.drawer,
            reversed: question.reversed,
            text: question.text,
          }
        : question,
    ),
    scoring: initial.scoring,
    statementTemplate: values.statementTemplate,
    secondStatementTemplate: values.secondStatementTemplate,
    citationTemplates: { item: values.citationItem, choice: values.citationChoice },
    baselines: structureChangedFrom(values.questions, initial) ? [] : initial.baselines,
  });

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
  const defaultValues = useMemo(() => valuesFrom(draft), [draft]);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <SimpleForm
      aria-label="질문 세트 편집"
      schema={EditorSchema}
      defaultValues={defaultValues}
      onSubmit={async (values) => {
        setMessage(null);
        try {
          const failure = await onSave({
            name: values.name,
            questionSet: questionSetFrom(values, draft.questionSet),
          });
          if (failure === undefined) setMessage("초안을 저장했어요.");
          return failure;
        } catch {
          return "질문 세트를 저장할 수 없어요. 빈 문장, 겹친 핵심 단어, 서랍 순서, 문장 틀을 확인해 주세요";
        }
      }}
      noValidate
    >
      <EditorFields draft={draft} message={message} />
    </SimpleForm>
  );
}

function EditorFields({ draft, message }: { draft: QuestionSetDraftDto; message: string | null }) {
  const { control } = useFormContext<EditorValues>();
  const [selectedCode, setSelectedCode] = useState<DrawerCode>(
    draft.questionSet.drawers[0]?.code ?? "B1",
  );

  const drawers = useWatch({ control, name: "drawers" }) ?? [];
  const questions = useWatch({ control, name: "questions" }) ?? [];
  const statementTemplate = useWatch({ control, name: "statementTemplate" }) ?? "";
  const secondStatementTemplate = useWatch({ control, name: "secondStatementTemplate" }) ?? "";
  const citationItem = useWatch({ control, name: "citationItem" }) ?? "";
  const { fields: drawerFields } = useFieldArray({ control, name: "drawers" });
  const { fields: questionFields, append, remove } = useFieldArray({ control, name: "questions" });

  const selectedDrawer = drawers.find(({ code }) => code === selectedCode) ?? drawers[0];
  const selectedItems = questions.filter(
    (question) => question.type === "item" && question.drawer === selectedDrawer?.code,
  );
  const selectedItem = selectedItems[0];
  const structureChanged = structureChangedFrom(questions, draft.questionSet);
  const choiceCount = questions.filter(({ type }) => type === "choice").length;

  const addItem = (drawer: DrawerCode) => {
    append({ type: "item", drawer, text: "새 문항을 써 주세요", reversed: false });
  };

  return (
    <>
      <PageHeader divider={false} align="end">
        <Stack gap="1" minW="18rem" flex="1">
          <TextField name="name" label="초안 이름" size="sm" />
        </Stack>
        <div>
          <MutedText>
            {questions.length}문항 · 서랍 {drawers.length}개 · 저장은 초안에만 해요
          </MutedText>
          <SubmitButton>초안 저장</SubmitButton>
        </div>
      </PageHeader>

      {choiceCount === 0 ? null : (
        <MutedText>
          선택형 질문 {choiceCount}개는 이 화면에서 고치지 않고 그대로 둬요. 문항형만 편집할 수
          있어요.
        </MutedText>
      )}
      {structureChanged ? (
        <MutedText>
          문항 구조를 바꿔서 저장할 때 기준 응답은 비워져요. 기준 응답은 읽기 전용이에요.
        </MutedText>
      ) : null}
      {message === null ? null : <Status role="status">{message}</Status>}

      <AutoGrid min="lg">
        {drawerFields.map((field, drawerIndex) => {
          const drawer = drawers[drawerIndex];
          if (drawer === undefined) return null;
          const items = questionFields
            .map((item, index) => ({ item, index, question: questions[index] }))
            .filter(({ question }) => question?.type === "item" && question.drawer === drawer.code);

          return (
            <Card key={field.id} aria-labelledby={`${field.id}-title`}>
              <CardHeader divider>
                <CardTitle id={`${field.id}-title`}>{drawer.name}</CardTitle>
                <InlineText tone="pine" weight="strong" flexShrink="0" whiteSpace="nowrap">
                  문항 {items.length}개
                </InlineText>
              </CardHeader>

              {items.length === 0 ? (
                <MutedText>아직 문항이 없어요. 문항을 더해 주세요.</MutedText>
              ) : null}
              <List gap="2">
                {items.map(({ item, index }, itemIndex) => (
                  <ListItem
                    key={item.id}
                    display="grid"
                    gridTemplateColumns="minmax(0, 1fr) auto auto"
                    gap="2"
                  >
                    <TextField
                      name={`questions.${index}.text`}
                      label={`${drawer.name} ${itemIndex + 1}번 문항`}
                      hideLabel
                    />
                    <CheckboxField
                      name={`questions.${index}.reversed`}
                      label="반대"
                      aria-label={`${drawer.name} ${itemIndex + 1}번 문항 반대`}
                    />
                    <UiButton
                      tone="outline"
                      size="sm"
                      type="button"
                      aria-label={`${drawer.name} ${itemIndex + 1}번 문항 빼기`}
                      onClick={() => remove(index)}
                    >
                      빼기
                    </UiButton>
                  </ListItem>
                ))}
              </List>
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

              <AutoGrid min="sm" gap="3" pt="3" borderTopWidth="1px" borderColor="paper.300">
                <TextField name={`drawers.${drawerIndex}.name`} label="서랍 이름" size="sm" />
                <TextField name={`drawers.${drawerIndex}.keywords`} label="핵심 단어" size="sm" />
                <TextField name={`drawers.${drawerIndex}.mark`} label="서랍 표시" size="sm" />
                <NumberField
                  name={`drawers.${drawerIndex}.order`}
                  label="서랍 순서"
                  min={0}
                  step={1}
                  size="sm"
                />
                <Stack gridColumn="1 / -1" gap="2">
                  <TextareaField name={`drawers.${drawerIndex}.reason`} label="권하는 이유" />
                </Stack>
                <Stack gridColumn="1 / -1" gap="2">
                  <TextField
                    name={`drawers.${drawerIndex}.statement`}
                    label="서랍별 상태 문장"
                    placeholder="비우면 공통 문장을 써요"
                  />
                </Stack>
              </AutoGrid>
            </Card>
          );
        })}
      </AutoGrid>

      <Card>
        <CardHeader divider>
          <CardTitle>공통 문장 틀</CardTitle>
          <InlineText tone="pine" weight="strong" flexShrink="0" whiteSpace="nowrap">
            표시와 인용
          </InlineText>
        </CardHeader>
        <AutoGrid min="sm" gap="3" pt="3" borderTopWidth="1px" borderColor="paper.300">
          <Stack gridColumn="1 / -1" gap="2">
            <TextField name="statementTemplate" label="첫 상태 문장 틀" />
          </Stack>
          <Stack gridColumn="1 / -1" gap="2">
            <TextField name="secondStatementTemplate" label="둘째 상태 문장 틀" />
          </Stack>
          <TextField name="citationItem" label="문항 인용 문형" size="sm" />
          <TextField name="citationChoice" label="선택 인용 문형" size="sm" />
        </AutoGrid>
      </Card>

      <Row
        gap="3"
        flexWrap="wrap"
        p="4"
        borderWidth="2px"
        borderColor="border"
        borderRadius="l2"
        bg="surface"
      >
        <Label size="sm" htmlFor="preview-drawer">
          미리보기 서랍
        </Label>
        <Select
          id="preview-drawer"
          value={selectedDrawer?.code ?? ""}
          onChange={(event) => setSelectedCode(event.target.value as DrawerCode)}
        >
          {drawers.map((drawer) => (
            <option key={drawer.code} value={drawer.code}>
              {drawer.name}
            </option>
          ))}
        </Select>
        <Hint>별명 “토끼”와 지금 고른 서랍 이름으로 문장과 조사를 확인해요.</Hint>
      </Row>

      {selectedDrawer === undefined ? null : (
        <AutoGrid min="lg">
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
                    questions.findIndex(
                      (question) =>
                        question.type === "item" &&
                        question.drawer === selectedDrawer.code &&
                        question.text === selectedItem.text,
                    ),
                  )
            }
            total={questions.length}
          />
        </AutoGrid>
      )}

      <Disclosure boxed>
        <summary>기준 응답 (읽기 전용)</summary>
        {draft.questionSet.baselines.length === 0 ? (
          <MutedText>이 초안에는 기준 응답이 없어요.</MutedText>
        ) : (
          <List gap="1" mt="2">
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
          </List>
        )}
      </Disclosure>
    </>
  );
}
