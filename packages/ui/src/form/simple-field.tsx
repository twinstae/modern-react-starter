import { useId, type ComponentProps } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { css } from "styled-system/css";

import { Input } from "../ui/input.tsx";
import { Textarea } from "../ui/textarea.tsx";
import * as Field from "../ui/field.tsx";
import * as Checkbox from "../ui/checkbox.tsx";
import * as Select from "../ui/select.tsx";
// export function SimpleDatePicker({ name, label }: { name: string; label: string }) {
//   const { control } = useFormContext();

//   return (
//     <Controller
//       render={({ field, fieldState }) => (
//         <div>
//           <Label>{label}</Label>
//           <DatePicker
//             name={name}
//             aria-label={label}
//             isInvalid={fieldState.invalid}
//             value={field.value ? parseDate(field.value) : null}
//             onChange={(value) => field.onChange(value?.toString())}
//           />
//           <SimpleErrorMessage name={name} />
//         </div>
//       )}
//       control={control}
//       name={name}
//     />
//   );
// }

/** 필드 아래에 힌트를 보이고, 오류가 나면 오류가 힌트를 대신한다. */
function FieldMessage({
  hint,
  error,
  descriptionId,
  errorId,
}: {
  hint?: string;
  error?: string;
  descriptionId: string;
  errorId: string;
}) {
  if (error) {
    return (
      <Field.ErrorText id={errorId} role="alert" aria-label={error}>
        {error}
      </Field.ErrorText>
    );
  }
  return hint ? <Field.HelperText id={descriptionId}>{hint}</Field.HelperText> : null;
}

/** 오류와 힌트를 필드의 접근성 속성에 연결한다. */
function fieldAria({
  isError,
  hint,
  descriptionId,
  errorId,
}: {
  isError: boolean;
  hint?: string;
  descriptionId: string;
  errorId: string;
}) {
  return {
    "aria-invalid": isError,
    "aria-describedby": isError ? errorId : hint ? descriptionId : undefined,
    "aria-errormessage": isError ? errorId : undefined,
  };
}

/** 레이블을 화면에서 숨기되 접근성 이름으로는 남긴다. 주변 맥락으로 무엇을 넣는지 분명할 때 쓴다. */
const labelClass = (hideLabel: boolean) => (hideLabel ? css({ srOnly: true }) : undefined);

/** react-hook-form 필드 상태에서 사용자에게 보여 줄 오류 메시지를 꺼낸다. */
const errorMessageOf = (error: { message?: string; root?: { message?: string } } | undefined) =>
  error?.root?.message ?? error?.message;

export function SimpleInput({
  name,
  label,
  hint,
  hideLabel = false,
  ...props
}: ComponentProps<typeof Input> & {
  name: string;
  label: string;
  hint?: string;
  hideLabel?: boolean;
}) {
  const { control } = useFormContext();

  const descriptionId = useId();
  const errorId = useId();

  return (
    <Controller
      render={({ field, fieldState }) => {
        const errorMessage = errorMessageOf(fieldState.error);
        const isError = !!fieldState.error;
        const aria = fieldAria({ isError, hint, descriptionId, errorId });
        return (
          <Field.Root>
            <Field.Label className={labelClass(hideLabel)}>
              {label} {props.required && <Field.RequiredIndicator />}
            </Field.Label>
            <Input name={name} value={field.value} onChange={field.onChange} {...aria} {...props} />
            <FieldMessage
              hint={hint}
              error={errorMessage}
              descriptionId={descriptionId}
              errorId={errorId}
            />
          </Field.Root>
        );
      }}
      control={control}
      name={name}
    />
  );
}

/** 여러 줄 입력. SimpleInput과 같은 방식으로 레이블, 힌트, 오류를 연결한다. */
export function SimpleTextarea({
  name,
  label,
  hint,
  submitOnEnter = false,
  hideLabel = false,
  ...props
}: ComponentProps<typeof Textarea> & {
  name: string;
  label: string;
  hint?: string;
  hideLabel?: boolean;
  /** Enter로 폼을 제출한다. 줄바꿈은 Shift+Enter로 한다. */
  submitOnEnter?: boolean;
}) {
  const { control } = useFormContext();

  const descriptionId = useId();
  const errorId = useId();

  return (
    <Controller
      render={({ field, fieldState }) => {
        const errorMessage = errorMessageOf(fieldState.error);
        const isError = !!fieldState.error;
        const aria = fieldAria({ isError, hint, descriptionId, errorId });
        return (
          <Field.Root>
            <Field.Label className={labelClass(hideLabel)}>
              {label} {props.required && <Field.RequiredIndicator />}
            </Field.Label>
            <Textarea
              name={name}
              value={field.value}
              onChange={field.onChange}
              {...aria}
              {...props}
              onKeyDown={(event) => {
                props.onKeyDown?.(event);
                // 한글 조합 중의 Enter는 글자를 확정하는 키이므로 제출하지 않는다
                if (!submitOnEnter || event.key !== "Enter" || event.shiftKey) return;
                if (event.nativeEvent.isComposing) return;
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }}
            />
            <FieldMessage
              hint={hint}
              error={errorMessage}
              descriptionId={descriptionId}
              errorId={errorId}
            />
          </Field.Root>
        );
      }}
      control={control}
      name={name}
    />
  );
}

export interface SelectItem {
  label: string;
  value: string;
}

/** 목록에서 하나를 고른다. 값은 고른 항목의 value 문자열이고, 고르지 않았으면 빈 문자열이다. */
export function SimpleSelect({
  name,
  label,
  hint,
  items,
  placeholder,
  hideLabel = false,
  ...props
}: Omit<Select.RootProps<SelectItem>, "collection" | "name"> & {
  name: string;
  label: string;
  hint?: string;
  hideLabel?: boolean;
  items: SelectItem[];
  placeholder?: string;
}) {
  const { control } = useFormContext();

  const descriptionId = useId();
  const errorId = useId();
  const collection = Select.createListCollection({ items });

  return (
    <Controller
      render={({ field, fieldState }) => {
        const errorMessage = errorMessageOf(fieldState.error);
        const isError = !!fieldState.error;
        const aria = fieldAria({ isError, hint, descriptionId, errorId });
        return (
          <Field.Root>
            <Select.Root
              collection={collection}
              name={name}
              value={field.value ? [field.value] : []}
              onValueChange={(details) => field.onChange(details.value[0] ?? "")}
              invalid={isError}
              {...props}
            >
              <Select.Label className={labelClass(hideLabel)}>
                {label} {props.required && <Field.RequiredIndicator />}
              </Select.Label>
              <Select.Control>
                <Select.Trigger {...aria}>
                  <Select.ValueText placeholder={placeholder} />
                  <Select.ChevronIndicator />
                </Select.Trigger>
              </Select.Control>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Content>
                    {items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <Select.ItemText>{item.label}</Select.ItemText>
                        <Select.CheckIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Portal>
              <Select.HiddenSelect />
            </Select.Root>
            <FieldMessage
              hint={hint}
              error={errorMessage}
              descriptionId={descriptionId}
              errorId={errorId}
            />
          </Field.Root>
        );
      }}
      control={control}
      name={name}
    />
  );
}

export function SimpleCheckbox({
  name,
  label,
  hint,
  ...props
}: Checkbox.RootProps & { name: string; label: string; hint?: string }) {
  const { control } = useFormContext();

  const descriptionId = useId();
  const errorId = useId();

  return (
    <Controller
      render={({ field, fieldState }) => {
        const errorMessage = errorMessageOf(fieldState.error);
        const isError = !!fieldState.error;
        const aria = fieldAria({ isError, hint, descriptionId, errorId });
        return (
          <Field.Root>
            <Checkbox.Root name={name} value={field.value} onChange={field.onChange}>
              <Checkbox.HiddenInput {...aria} />
              <Checkbox.Control aria-invalid={isError}>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                {label} {props.required && <Field.RequiredIndicator />}
              </Checkbox.Label>
            </Checkbox.Root>
            <FieldMessage
              hint={hint}
              error={errorMessage}
              descriptionId={descriptionId}
              errorId={errorId}
            />
          </Field.Root>
        );
      }}
      control={control}
      name={name}
    />
  );
}
