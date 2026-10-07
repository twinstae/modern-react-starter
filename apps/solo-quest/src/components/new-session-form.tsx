import * as v from "valibot";
import { SimpleForm, SimpleInput, SubmitButton } from "@repo/ui";

import { ShortText } from "../domain/short-text.ts";

const NewSessionSchema = v.object({ title: ShortText });

export type NewSessionValues = v.InferOutput<typeof NewSessionSchema>;

export function NewSessionForm({
  onSubmit,
}: {
  onSubmit: (values: NewSessionValues) => Promise<void>;
}) {
  return (
    <SimpleForm schema={NewSessionSchema} defaultValues={{ title: "" }} onSubmit={onSubmit}>
      <SimpleInput name="title" label="제목" />
      <SubmitButton>새 세션</SubmitButton>
    </SimpleForm>
  );
}
