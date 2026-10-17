import { useCallback, type ReactNode } from "react";
import { useForm, useFormContext, useWatch, FormProvider, type FieldValues } from "react-hook-form";
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
      <FormBase
        onSubmit={(event) => {
          // React 이벤트는 Portal을 지나 React 트리의 바깥 폼까지 올라간다.
          // Popover처럼 폼 안에서 띄운 폼의 제출이 바깥 폼을 제출하지 않게 여기서 멈춘다.
          event.stopPropagation();
          return submit(event);
        }}
        {...props}
      >
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

/** SimpleForm 안에서 필드의 현재 값을 읽어 그리는 곳. 글자 수 표시처럼 값에서 파생되는 화면에 쓴다. */
export function SimpleWatch({
  name,
  children,
}: {
  name: string;
  children: (value: unknown) => ReactNode;
}) {
  return <>{children(useWatch({ name }))}</>;
}

/**
 * SimpleForm 안에서 필드의 현재 값을 읽고 바꾸는 hook. 폼 바깥의 변화(예: 고를 수 있는 항목이 줄어듦)에
 * 맞춰 값을 바로잡을 때 쓴다. 사용자가 입력한 다른 필드는 건드리지 않는다.
 */
export function useSimpleField(name: string): [unknown, (value: unknown) => void] {
  const { setValue } = useFormContext();
  const value = useWatch({ name });
  // setValue는 렌더링마다 같으므로 setter도 name이 같으면 같다. effect의 의존성으로 쓸 수 있다.
  const set = useCallback((next: unknown) => setValue(name, next), [setValue, name]);
  return [value, set];
}
