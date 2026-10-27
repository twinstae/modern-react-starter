import { useEffect, useId, type ComponentProps, type ReactNode } from "react";
import { SimpleForm as BaseSimpleForm } from "@repo/ui";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { Controller, useFormContext, type FieldValues } from "react-hook-form";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { Button } from "./button.tsx";
import { Row } from "./layout.tsx";

export const Field = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "2" },
});

export const Label = styled("label", {
  base: { fontFamily: "body", fontWeight: "700", color: "fg.default" },
  variants: {
    size: {
      sm: { fontSize: "kiosk-caption" },
      md: { fontSize: "kiosk-body" },
    },
  },
  defaultVariants: { size: "md" },
});

export const Hint = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption", lineHeight: "1.45" },
});

export const FieldError = styled("p", {
  base: { color: "red.9", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "600" },
});

export const Input = styled("input", {
  base: {
    width: "full",
    px: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    outline: "none",
    _placeholder: { color: "fg.muted" },
    _focusVisible: { borderColor: "pine.500", outline: "3px solid", outlineColor: "pine.500" },
    _disabled: { opacity: "0.55", cursor: "not-allowed" },
  },
  variants: {
    size: {
      sm: { minH: "9", fontSize: "kiosk-caption" },
      md: { minH: "11", fontSize: "kiosk-caption" },
      lg: { minH: "14", fontSize: "kiosk-body" },
    },
  },
  defaultVariants: { size: "md" },
});

export const Textarea = styled("textarea", {
  base: {
    width: "full",
    minH: "24",
    px: "3",
    py: "2",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    lineHeight: "1.5",
    outline: "none",
    resize: "vertical",
    _focusVisible: { borderColor: "pine.500", outline: "3px solid", outlineColor: "pine.500" },
  },
});

export const Select = styled("select", {
  base: {
    width: "full",
    minH: "11",
    px: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    outline: "none",
    _focusVisible: { borderColor: "pine.500", outline: "3px solid", outlineColor: "pine.500" },
  },
});

export const Checkbox = styled("input", {
  base: { width: "5", height: "5", accentColor: "pine.600" },
});

export const CheckLabel = styled("label", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2",
    fontFamily: "body",
    fontSize: "kiosk-caption",
  },
});

/** 여러 입력을 하나의 주제로 묶는 칸. 위쪽 구분선으로 앞 내용과 나눈다. */
export const Fieldset = styled("fieldset", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
    mt: "2",
    pt: "4",
    borderTopWidth: "1px",
    borderColor: "paper.300",
  },
});

export const Legend = styled("legend", {
  base: { fontFamily: "body", fontSize: "kiosk-body", fontWeight: "700" },
});

/** 입력 폼을 종이 카드처럼 묶는 틀. 폼 자체가 카드인 화면(별명)에서 쓴다. */
export const FormCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4",
    width: "full",
    p: "6",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zineLg",
  },
});

const hidden = css({ srOnly: true });

const errorMessageOf = (error: { message?: string } | undefined): string | undefined =>
  error?.message;

const fieldAria = ({
  error,
  hint,
  hintId,
  errorId,
}: {
  error: string | undefined;
  hint: string | undefined;
  hintId: string;
  errorId: string;
}) => ({
  "aria-invalid": error === undefined ? undefined : true,
  "aria-errormessage": error === undefined ? undefined : errorId,
  "aria-describedby": error !== undefined ? errorId : hint === undefined ? undefined : hintId,
});

interface SimpleFormProps<Input extends FieldValues, Output> extends Omit<
  ComponentProps<"form">,
  "onSubmit" | "children"
> {
  schema: StandardSchemaV1<Input, Output>;
  defaultValues: Input;
  /** 오류 문구를 돌려주면 폼 수준 오류로 보여 준다. 성공하면 아무것도 돌려주지 않는다. */
  onSubmit: (values: Output) => Promise<string | undefined>;
  onSuccess?: (values: Output) => void;
  /** 제출에 성공하면 기본값으로 되돌릴 필드. */
  resetOnSuccess?: string[];
  initialError?: string | null;
  /** 폼 수준 오류를 자식 앞에 둘지 뒤에 둘지. 앱 기본은 앞. */
  rootErrorPlacement?: "before" | "after";
  children: ReactNode;
}

function InitialRootError({ message }: { message: string | null }) {
  const { setError, clearErrors } = useFormContext();

  useEffect(() => {
    if (message === null) clearErrors("root");
    else setError("root", { type: "initial", message });
  }, [message, setError, clearErrors]);

  return null;
}

function ClearRootOnChange() {
  const { watch, clearErrors } = useFormContext();

  useEffect(() => {
    const subscription = watch((_values, { name }) => {
      if (name !== undefined) clearErrors("root");
    });
    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  return null;
}

/** 폼 상태·검증·서버 오류를 한곳에서 다룬다. 화면은 필드와 문장만 조립한다. */
export function SimpleForm<Input extends FieldValues, Output>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  resetOnSuccess,
  initialError = null,
  children,
  ...props
}: SimpleFormProps<Input, Output>) {
  return (
    <BaseSimpleForm
      schema={schema}
      defaultValues={defaultValues}
      resetOnSuccess={resetOnSuccess}
      rootErrorPlacement="before"
      onSubmit={async (values) => {
        const output = values as Output;
        const failure = await onSubmit(output);
        if (failure === undefined) onSuccess?.(output);
        return failure;
      }}
      {...props}
    >
      <InitialRootError message={initialError} />
      <ClearRootOnChange />
      {children}
    </BaseSimpleForm>
  );
}

function useFieldIds() {
  const id = useId();
  return { id, hintId: `${id}-hint`, errorId: `${id}-error` };
}

type TextFieldProps = Omit<
  ComponentProps<typeof Input>,
  "name" | "value" | "defaultValue" | "onChange" | "id"
> & {
  name: string;
  label: string;
  hint?: string;
  hideLabel?: boolean;
};

/** 한 줄 입력. 레이블·힌트·오류 연결은 디자인 시스템이 소유한다. */
export function TextField({ name, label, hint, hideLabel = false, ...props }: TextFieldProps) {
  const { control } = useFormContext();
  const { id, hintId, errorId } = useFieldIds();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const error = errorMessageOf(fieldState.error);
        const aria = fieldAria({ error, hint, hintId, errorId });
        return (
          <Field>
            <Label htmlFor={id} size="sm" className={hideLabel ? hidden : undefined}>
              {label}
            </Label>
            <Input
              id={id}
              {...props}
              name={name}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              {...aria}
            />
            {error !== undefined ? (
              <FieldError id={errorId} role="alert">
                {error}
              </FieldError>
            ) : hint === undefined ? null : (
              <Hint id={hintId}>{hint}</Hint>
            )}
          </Field>
        );
      }}
    />
  );
}

/** 여러 줄 입력. TextField와 같은 방식으로 레이블·힌트·오류를 연결한다. */
export function TextareaField({
  name,
  label,
  hint,
  hideLabel = false,
  ...props
}: Omit<ComponentProps<typeof Textarea>, "name" | "value" | "defaultValue" | "onChange" | "id"> & {
  name: string;
  label: string;
  hint?: string;
  hideLabel?: boolean;
}) {
  const { control } = useFormContext();
  const { id, hintId, errorId } = useFieldIds();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const error = errorMessageOf(fieldState.error);
        const aria = fieldAria({ error, hint, hintId, errorId });
        return (
          <Field>
            <Label htmlFor={id} size="sm" className={hideLabel ? hidden : undefined}>
              {label}
            </Label>
            <Textarea
              id={id}
              {...props}
              name={name}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              {...aria}
            />
            {error !== undefined ? (
              <FieldError id={errorId} role="alert">
                {error}
              </FieldError>
            ) : hint === undefined ? null : (
              <Hint id={hintId}>{hint}</Hint>
            )}
          </Field>
        );
      }}
    />
  );
}

type NumberFieldProps = Omit<TextFieldProps, "type" | "inputMode">;

/** 정수 입력. 빈 칸은 `undefined`로 두어 스키마가 이유를 설명하게 한다. */
export function NumberField({ name, label, hint, hideLabel = false, ...props }: NumberFieldProps) {
  const { control } = useFormContext();
  const { id, hintId, errorId } = useFieldIds();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const error = errorMessageOf(fieldState.error);
        const aria = fieldAria({ error, hint, hintId, errorId });
        return (
          <Field>
            <Label htmlFor={id} size="sm" className={hideLabel ? hidden : undefined}>
              {label}
            </Label>
            <Input
              id={id}
              {...props}
              type="number"
              inputMode="numeric"
              name={name}
              value={field.value ?? ""}
              onChange={(event) =>
                field.onChange(event.target.value === "" ? undefined : event.target.valueAsNumber)
              }
              onBlur={field.onBlur}
              {...aria}
            />
            {error !== undefined ? (
              <FieldError id={errorId} role="alert">
                {error}
              </FieldError>
            ) : hint === undefined ? null : (
              <Hint id={hintId}>{hint}</Hint>
            )}
          </Field>
        );
      }}
    />
  );
}

type SelectFieldProps = Omit<
  ComponentProps<typeof Select>,
  "name" | "value" | "defaultValue" | "onChange" | "id"
> & {
  name: string;
  label: string;
  hint?: string;
  hideLabel?: boolean;
};

/** 목록에서 하나를 고른다. 값은 문자열이고, 고르지 않았으면 빈 문자열이다. */
export function SelectField({
  name,
  label,
  hint,
  hideLabel = false,
  children,
  ...props
}: SelectFieldProps) {
  const { control } = useFormContext();
  const { id, hintId, errorId } = useFieldIds();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const error = errorMessageOf(fieldState.error);
        const aria = fieldAria({ error, hint, hintId, errorId });
        return (
          <Field>
            <Label htmlFor={id} size="sm" className={hideLabel ? hidden : undefined}>
              {label}
            </Label>
            <Select
              id={id}
              {...props}
              name={name}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              {...aria}
            >
              {children}
            </Select>
            {error !== undefined ? (
              <FieldError id={errorId} role="alert">
                {error}
              </FieldError>
            ) : hint === undefined ? null : (
              <Hint id={hintId}>{hint}</Hint>
            )}
          </Field>
        );
      }}
    />
  );
}

/** 참·거짓 하나. 레이블을 눌러도 값이 바뀐다. */
export function CheckboxField({
  name,
  label,
  ...props
}: Omit<ComponentProps<typeof Checkbox>, "name" | "checked" | "onChange" | "type"> & {
  name: string;
  label: string;
}) {
  const { control } = useFormContext();
  const { errorId } = useFieldIds();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const error = errorMessageOf(fieldState.error);
        return (
          <>
            <CheckLabel>
              <Checkbox
                {...props}
                type="checkbox"
                name={name}
                checked={field.value === true}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
                aria-invalid={error === undefined ? undefined : true}
                aria-errormessage={error === undefined ? undefined : errorId}
              />
              {label}
            </CheckLabel>
            {error === undefined ? null : (
              <FieldError id={errorId} role="alert">
                {error}
              </FieldError>
            )}
          </>
        );
      }}
    />
  );
}

/** 제출 중에는 스스로 잠기고, 폼 밖에서 disabled를 주면 함께 잠긴다. */
export function SubmitButton({ disabled, ...props }: Omit<ComponentProps<typeof Button>, "type">) {
  const { formState } = useFormContext();

  return (
    <Button
      type="submit"
      {...props}
      disabled={disabled === true || formState.isSubmitting}
      aria-busy={formState.isSubmitting || undefined}
    />
  );
}

/**
 * 저장·되돌리기 버튼. 고친 것이 없으면 둘 다 꺼져 있어, 버튼이 켜진 것 자체가
 * "아직 저장하지 않았다"는 표시다. 저장에 성공하면 그 값을 새 기준으로 삼아 다시 꺼진다.
 */
export function SaveActions({ submitLabel }: { submitLabel: string }) {
  const {
    formState: { isDirty, isSubmitSuccessful },
    reset,
    getValues,
  } = useFormContext();

  useEffect(() => {
    if (isSubmitSuccessful) reset(getValues());
  }, [isSubmitSuccessful, reset, getValues]);

  return (
    <Row>
      <SubmitButton disabled={!isDirty}>{submitLabel}</SubmitButton>
      <Button type="button" tone="outline" disabled={!isDirty} onClick={() => reset()}>
        되돌리기
      </Button>
    </Row>
  );
}
