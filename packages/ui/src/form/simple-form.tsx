import { useForm, FormProvider, type FieldValues } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { styled } from "styled-system/jsx";

import * as Field from "../ui/field.tsx";

const FormBase = styled("form", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4",
  },
});

interface SimpleFormProps<Input, Output> extends Omit<React.ComponentProps<"form">, "onSubmit"> {
  schema: StandardSchemaV1<Input, Output>;
  defaultValues: FieldValues;
  /** 오류 메시지를 돌려주면 폼 수준 오류(`root`)로 보여 준다. 성공하면 아무것도 돌려주지 않는다. */
  onSubmit: (values: Output) => Promise<void | string>;
  /** 제출에 성공하면 기본값으로 되돌릴 필드. 나머지 필드는 그대로 둔다. */
  resetOnSuccess?: string[];
  reValidateMode?: "onBlur" | "onSubmit";
}

export function SimpleForm<Output>({
  schema,
  onSubmit,
  defaultValues,
  reValidateMode,
  resetOnSuccess,
  ...props
}: SimpleFormProps<FieldValues, Output>) {
  const methods = useForm({
    defaultValues,
    resolver: standardSchemaResolver(schema),
    reValidateMode: reValidateMode ?? "onSubmit",
  });

  const submit = methods.handleSubmit(async (values) => {
    const message = await onSubmit(values);
    if (message) {
      methods.setError("root", { type: "submit", message });
      return;
    }
    for (const name of resetOnSuccess ?? []) methods.resetField(name);
  });
  const rootError = methods.formState.errors.root?.message;

  return (
    <FormProvider {...methods}>
      <FormBase onSubmit={submit} {...props}>
        {props.children}
        {rootError && (
          <Field.ErrorText role="alert" aria-label={rootError}>
            {rootError}
          </Field.ErrorText>
        )}
      </FormBase>
    </FormProvider>
  );
}
