import { useId, type ComponentProps } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input.tsx";
import * as Field from "@/components/ui/field.tsx";
import * as Checkbox from "@/components/ui/checkbox.tsx";
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
