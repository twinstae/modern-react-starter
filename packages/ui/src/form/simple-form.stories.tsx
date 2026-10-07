import type { Meta, StoryObj } from "@storybook/react-vite";
import * as v from "valibot";

import { SimpleInput } from "./simple-field.tsx";
import { SimpleForm } from "./simple-form.tsx";
import { SubmitButton } from "./submit-button.tsx";

const NoteSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "제목을 입력해주세요")),
  memo: v.string(),
});

export type NoteValues = v.InferOutput<typeof NoteSchema>;

/** SimpleForm이 제출 결과를 다루는 방식을 보여 주는 예시 폼 */
function NoteForm({
  onSubmit,
  resetOnSuccess,
}: {
  /** 오류 메시지를 돌려주면 폼 수준 오류로 보여 준다. 성공하면 아무것도 돌려주지 않는다. */
  onSubmit: (values: NoteValues) => Promise<void | string>;
  /** 제출에 성공하면 기본값으로 되돌릴 필드 */
  resetOnSuccess?: string[];
}) {
  return (
    <SimpleForm
      aria-label="노트"
      schema={NoteSchema}
      defaultValues={{ title: "", memo: "" }}
      onSubmit={onSubmit}
      resetOnSuccess={resetOnSuccess}
    >
      <SimpleInput name="title" label="제목" />
      <SimpleInput name="memo" label="메모" />
      <SubmitButton>저장</SubmitButton>
    </SimpleForm>
  );
}

const meta = {
  title: "Form/SimpleForm",
  component: NoteForm,
} satisfies Meta<typeof NoteForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: async (values) => {
      console.log(values);
    },
  },
};

export const SubmitError: Story = {
  args: {
    onSubmit: async () => "저장하지 못했습니다",
  },
};

export const ResetTitleOnSuccess: Story = {
  args: {
    onSubmit: async (values) => {
      console.log(values);
    },
    resetOnSuccess: ["title"],
  },
};
