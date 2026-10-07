import { useId, type ComponentProps } from "react";
import { Controller, useFormContext } from "react-hook-form";

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

export function SimpleInput({
  name,
  label,
  hint,
  ...props
}: ComponentProps<typeof Input> & { name: string; label: string; hint?: string }) {
  const { control } = useFormContext();

  const descriptionId = useId();
  const errorId = useId();

  return (
    <Controller
      render={({ field, fieldState }) => {
        const isError = !!fieldState.error;

        const errorMessage = fieldState.error?.root?.message ?? fieldState.error?.message;
        return (
          <Field.Root>
            <Field.Label>
              {label} {props.required && <Field.RequiredIndicator />}
            </Field.Label>
            <Input
              name={name}
              value={field.value}
              onChange={field.onChange}
              aria-invalid={isError}
              aria-describedby={isError ? errorId : hint ? descriptionId : undefined}
              aria-errormessage={isError ? errorId : undefined}
              {...props}
            />
            {hint && !isError && <Field.HelperText id={descriptionId}>{hint}</Field.HelperText>}
            {isError && errorMessage && (
              <Field.ErrorText id={errorId} role="alert" aria-label={errorMessage}>
                {errorMessage}
              </Field.ErrorText>
            )}
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
  ...props
}: ComponentProps<typeof Textarea> & { name: string; label: string; hint?: string }) {
  const { control } = useFormContext();

  const descriptionId = useId();
  const errorId = useId();

  return (
    <Controller
      render={({ field, fieldState }) => {
        const isError = !!fieldState.error;

        const errorMessage = fieldState.error?.root?.message ?? fieldState.error?.message;
        return (
          <Field.Root>
            <Field.Label>
              {label} {props.required && <Field.RequiredIndicator />}
            </Field.Label>
            <Textarea
              name={name}
              value={field.value}
              onChange={field.onChange}
              aria-invalid={isError}
              aria-describedby={isError ? errorId : hint ? descriptionId : undefined}
              aria-errormessage={isError ? errorId : undefined}
              {...props}
            />
            {hint && !isError && <Field.HelperText id={descriptionId}>{hint}</Field.HelperText>}
            {isError && errorMessage && (
              <Field.ErrorText id={errorId} role="alert" aria-label={errorMessage}>
                {errorMessage}
              </Field.ErrorText>
            )}
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
  ...props
}: Omit<Select.RootProps<SelectItem>, "collection" | "name"> & {
  name: string;
  label: string;
  hint?: string;
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
        const isError = !!fieldState.error;

        const errorMessage = fieldState.error?.root?.message ?? fieldState.error?.message;
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
              <Select.Label>
                {label} {props.required && <Field.RequiredIndicator />}
              </Select.Label>
              <Select.Control>
                <Select.Trigger
                  aria-describedby={isError ? errorId : hint ? descriptionId : undefined}
                  aria-errormessage={isError ? errorId : undefined}
                >
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
            {hint && !isError && <Field.HelperText id={descriptionId}>{hint}</Field.HelperText>}
            {isError && errorMessage && (
              <Field.ErrorText id={errorId} role="alert" aria-label={errorMessage}>
                {errorMessage}
              </Field.ErrorText>
            )}
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
        const isError = !!fieldState.error;

        const errorMessage = fieldState.error?.root?.message ?? fieldState.error?.message;
        return (
          <Field.Root>
            <Checkbox.Root name={name} value={field.value} onChange={field.onChange}>
              <Checkbox.HiddenInput
                aria-invalid={isError}
                aria-describedby={isError ? errorId : hint ? descriptionId : undefined}
                aria-errormessage={isError ? errorId : undefined}
              />
              <Checkbox.Control aria-invalid={isError}>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                {label} {props.required && <Field.RequiredIndicator />}
              </Checkbox.Label>
            </Checkbox.Root>
            {hint && !isError && <Field.HelperText id={descriptionId}>{hint}</Field.HelperText>}
            {isError && errorMessage && (
              <Field.ErrorText id={errorId} role="alert" aria-label={errorMessage}>
                {errorMessage}
              </Field.ErrorText>
            )}
          </Field.Root>
        );
      }}
      control={control}
      name={name}
    />
  );
}
