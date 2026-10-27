import { useFieldArray, useFormContext } from "react-hook-form";
import * as v from "valibot";

import { Button, MutedText, Row, SimpleForm, Stack, SubmitButton, TextField } from "../ui/index.ts";

const QuestionsSchema = v.object({
  questions: v.array(
    v.object({ text: v.pipe(v.string(), v.trim(), v.minLength(1, "문항을 쓰거나 빼 주세요")) }),
  ),
});

type QuestionsInput = { questions: { text: string }[] };

function QuestionFields() {
  const { control } = useFormContext<QuestionsInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "questions" });

  return (
    <Stack gap="3">
      {fields.length === 0 ? <MutedText>아직 문항이 없어요.</MutedText> : null}
      {fields.map((field, index) => (
        <Row key={field.id} alignItems="flex-end">
          <TextField name={`questions.${index}.text`} label={`문항 ${index + 1}`} />
          <Button
            type="button"
            tone="outline"
            size="md"
            aria-label={`문항 ${index + 1} 빼기`}
            onClick={() => remove(index)}
          >
            빼기
          </Button>
        </Row>
      ))}
      <Button
        type="button"
        tone="outline"
        alignSelf="flex-start"
        onClick={() => append({ text: "" })}
      >
        문항 더하기
      </Button>
    </Stack>
  );
}

/**
 * 서랍의 문항 편집. 이 서랍이 맞는 손님이라면 "그렇다"고 답할 문장을 하나씩 더한다.
 * 손님은 문항마다 1~5로 답하고, 서랍들의 문항이 섞여 질문 세트가 된다.
 */
export function DrawerQuestionsEditor({
  questions,
  onSave,
}: {
  questions: readonly string[];
  onSave: (questions: string[]) => Promise<string | undefined>;
}) {
  return (
    <SimpleForm
      aria-label="문항"
      schema={QuestionsSchema}
      defaultValues={{ questions: questions.map((text) => ({ text })) }}
      onSubmit={({ questions: next }: QuestionsInput) => onSave(next.map(({ text }) => text))}
    >
      <MutedText>
        이 서랍이 맞는 손님이라면 “그렇다”고 답할 문장이에요. 예: 요즘 생활에서 뭔가를 바꾸고 싶다.
        서랍마다 2~3개를 권해요.
      </MutedText>
      <QuestionFields />
      <SubmitButton alignSelf="flex-start">문항 저장</SubmitButton>
    </SimpleForm>
  );
}
