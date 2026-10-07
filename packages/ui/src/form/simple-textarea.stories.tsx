import type { Meta, StoryObj } from "@storybook/react-vite";
import * as v from "valibot";

import { SimpleTextarea } from "./simple-field.tsx";
import { SimpleForm } from "./simple-form.tsx";
import { SubmitButton } from "./submit-button.tsx";

const MemoSchema = v.object({
  memo: v.pipe(v.string(), v.minLength(1, "메모를 입력해주세요")),
});

export type MemoValues = v.InferOutput<typeof MemoSchema>;

/** SimpleTextarea를 SimpleForm 안에서 보여 주는 예시 폼 */
function MemoForm({
  onSubmit,
  hint,
  defaultMemo = "",
}: {
  onSubmit: (values: MemoValues) => Promise<void>;
  hint?: string;
  defaultMemo?: string;
}) {
  return (
    <SimpleForm schema={MemoSchema} defaultValues={{ memo: defaultMemo }} onSubmit={onSubmit}>
      <SimpleTextarea name="memo" label="메모" hint={hint} />
      <SubmitButton>저장</SubmitButton>
    </SimpleForm>
  );
}

const meta = {
  title: "Form/SimpleTextarea",
  component: MemoForm,
} satisfies Meta<typeof MemoForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const onSubmit = async (values: MemoValues) => {
  console.log(values);
};

export const Default: Story = { args: { onSubmit } };

export const WithHint: Story = {
  args: { onSubmit, hint: "줄바꿈을 쓸 수 있습니다." },
};

export const WithValue: Story = {
  args: { onSubmit, defaultMemo: "문이 열린다\n안은 어둡다" },
};
