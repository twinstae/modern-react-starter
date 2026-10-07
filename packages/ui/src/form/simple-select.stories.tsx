import type { Meta, StoryObj } from "@storybook/react-vite";
import * as v from "valibot";

import { SimpleSelect } from "./simple-field.tsx";
import { SimpleForm } from "./simple-form.tsx";
import { SubmitButton } from "./submit-button.tsx";

const SpeakerSchema = v.object({
  speaker: v.pipe(v.string(), v.minLength(1, "화자를 골라주세요")),
});

export type SpeakerValues = v.InferOutput<typeof SpeakerSchema>;

const items = [
  { label: "GM", value: "gm" },
  { label: "Player", value: "player" },
  { label: "상인", value: "merchant" },
];

/** SimpleSelect를 SimpleForm 안에서 보여 주는 예시 폼 */
function SpeakerForm({
  onSubmit,
  hint,
  defaultSpeaker = "",
}: {
  onSubmit: (values: SpeakerValues) => Promise<void>;
  hint?: string;
  defaultSpeaker?: string;
}) {
  return (
    <SimpleForm
      schema={SpeakerSchema}
      defaultValues={{ speaker: defaultSpeaker }}
      onSubmit={onSubmit}
    >
      <SimpleSelect name="speaker" label="화자" items={items} hint={hint} />
      <SubmitButton>저장</SubmitButton>
    </SimpleForm>
  );
}

const meta = {
  title: "Form/SimpleSelect",
  component: SpeakerForm,
} satisfies Meta<typeof SpeakerForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const onSubmit = async (values: SpeakerValues) => {
  console.log(values);
};

export const Default: Story = { args: { onSubmit } };

export const WithHint: Story = {
  args: { onSubmit, hint: "말하는 캐릭터를 고릅니다." },
};

export const WithValue: Story = {
  args: { onSubmit, defaultSpeaker: "player" },
};
