import type { Meta, StoryObj } from "@storybook/react-vite";
import * as v from "valibot";

import { SimpleInput } from "./simple-field.tsx";
import { SimpleForm, SimpleWatch, useSimpleField } from "./simple-form.tsx";
import { SubmitButton } from "./submit-button.tsx";

const NoteSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "제목을 입력해주세요")),
  memo: v.string(),
});

export type NoteValues = v.InferOutput<typeof NoteSchema>;

/** 폼 안에서 useSimpleField로 제목 값을 바깥에서 바꾸는 버튼 */
function SetTitleButton() {
  const [title, setTitle] = useSimpleField("title");
  return (
    <button type="button" onClick={() => setTitle("바깥에서 바꾼 제목")}>
      제목 바꾸기 (지금: {String(title)})
    </button>
  );
}

/** SimpleForm이 제출 결과를 다루는 방식을 보여 주는 예시 폼 */
function NoteForm({
  onSubmit,
  resetOnSuccess,
  showTitleLength,
  withTitleSetter,
}: {
  /** 오류 메시지를 돌려주면 폼 수준 오류로 보여 준다. 성공하면 아무것도 돌려주지 않는다. */
  onSubmit: (values: NoteValues) => Promise<void | string>;
  /** 제출에 성공하면 기본값으로 되돌릴 필드 */
  resetOnSuccess?: string[];
  /** 입력 중인 제목의 글자 수를 SimpleWatch로 보여 준다. */
  showTitleLength?: boolean;
  /** useSimpleField로 제목을 바꾸는 버튼을 폼 안에 둔다. */
  withTitleSetter?: boolean;
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
      {showTitleLength && (
        <SimpleWatch name="title">
          {(title) => (
            <p role="status" aria-label="제목 글자 수">
              {String(title).length}
            </p>
          )}
        </SimpleWatch>
      )}
      <SimpleInput name="memo" label="메모" />
      {withTitleSetter && <SetTitleButton />}
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

export const WithTitleLength: Story = {
  args: {
    onSubmit: async (values) => {
      console.log(values);
    },
    showTitleLength: true,
  },
};

export const WithTitleSetter: Story = {
  args: {
    onSubmit: async (values) => {
      console.log(values);
    },
    withTitleSetter: true,
  },
};
