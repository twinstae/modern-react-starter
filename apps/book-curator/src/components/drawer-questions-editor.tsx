import * as v from "valibot";

import { SimpleForm, SubmitButton, TextareaField } from "../ui/index.ts";

/** 한 줄에 문항 하나. 빈 줄은 버린다. */
const QuestionsSchema = v.object({
  text: v.pipe(
    v.string(),
    v.transform((text) =>
      text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== ""),
    ),
  ),
});

/**
 * 서랍의 문항 편집. 이 서랍이 맞는 손님이라면 "그렇다"고 답할 문장을 한 줄에 하나씩 쓴다.
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
      defaultValues={{ text: questions.join("\n") }}
      onSubmit={({ text }: { text: string[] }) => onSave(text)}
    >
      <TextareaField
        name="text"
        label="문항"
        hint="한 줄에 문항 하나. 예: 요즘 생활에서 뭔가를 바꾸고 싶다. 서랍마다 2~3개를 권해요."
        rows={5}
      />
      <SubmitButton>문항 저장</SubmitButton>
    </SimpleForm>
  );
}
