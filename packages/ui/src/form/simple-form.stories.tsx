import type { Meta, StoryObj } from "@storybook/react-vite";
import { createPortal } from "react-dom";
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

const TagSchema = v.object({ tag: v.pipe(v.string(), v.minLength(1, "태그를 입력해주세요")) });

/**
 * 노트 폼 안(React 트리)에서 Portal로 body에 띄운 태그 폼. Popover 안의 폼이 이렇게 놓인다.
 * DOM에서는 폼 안의 폼이 아니지만, React 이벤트는 Portal을 지나 노트 폼까지 올라간다.
 */
function PortalTagForm({ onSubmit }: { onSubmit: (values: { tag: string }) => Promise<void> }) {
  return createPortal(
    <SimpleForm
      aria-label="태그"
      schema={TagSchema}
      defaultValues={{ tag: "" }}
      onSubmit={onSubmit}
    >
      <SimpleInput name="tag" label="태그 이름" />
      <SubmitButton>태그 저장</SubmitButton>
    </SimpleForm>,
    document.body,
  );
}

/** SimpleForm이 제출 결과를 다루는 방식을 보여 주는 예시 폼 */
function NoteForm({
  onSubmit,
  resetOnSuccess,
  showTitleLength,
  withTitleSetter,
  onTagSubmit,
}: {
  /** 오류 메시지를 돌려주면 폼 수준 오류로 보여 준다. 성공하면 아무것도 돌려주지 않는다. */
  onSubmit: (values: NoteValues) => Promise<void | string>;
  /** 제출에 성공하면 기본값으로 되돌릴 필드 */
  resetOnSuccess?: string[];
  /** 입력 중인 제목의 글자 수를 SimpleWatch로 보여 준다. */
  showTitleLength?: boolean;
  /** useSimpleField로 제목을 바꾸는 버튼을 폼 안에 둔다. */
  withTitleSetter?: boolean;
  /** 있으면 폼 안에서 Portal로 태그 폼을 띄운다. */
  onTagSubmit?: (values: { tag: string }) => Promise<void>;
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
      {onTagSubmit && <PortalTagForm onSubmit={onTagSubmit} />}
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

export const WithPortalForm: Story = {
  args: {
    onSubmit: async (values) => {
      console.log("노트", values);
    },
    onTagSubmit: async (values) => {
      console.log("태그", values);
    },
  },
};
