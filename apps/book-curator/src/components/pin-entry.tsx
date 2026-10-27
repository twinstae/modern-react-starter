import * as v from "valibot";

import { OWNER_PIN_MAX_LENGTH, OWNER_PIN_MIN_LENGTH } from "../domain/owner-pin.ts";
import { Hint, SimpleForm, Stack, SubmitButton, TextField } from "../ui/index.ts";

const PinSchema = v.object({
  pin: v.pipe(
    v.string(),
    v.regex(/^\d*$/, "PIN은 숫자로 입력해 주세요"),
    v.check(
      (pin) => pin.length >= OWNER_PIN_MIN_LENGTH && pin.length <= OWNER_PIN_MAX_LENGTH,
      `PIN은 ${OWNER_PIN_MIN_LENGTH}~${OWNER_PIN_MAX_LENGTH}자리로 입력해 주세요`,
    ),
  ),
});

/**
 * 주인 PIN 입력. 키오스크의 잠금을 열 때와 운영 화면에서 PIN을 정할 때 같은 컴포넌트를 쓴다.
 * 형식은 스키마가 막고, 맞는 PIN인지는 콜백이 돌려준 실패 문구로 알린다.
 */
export function PinEntry({
  title = "주인 PIN",
  submitLabel = "열기",
  onSubmit,
  initialError = null,
}: {
  title?: string;
  submitLabel?: string;
  onSubmit: (pin: string) => Promise<string | undefined>;
  initialError?: string | null;
}) {
  return (
    <Stack width="full" maxW="24rem">
      <SimpleForm
        schema={PinSchema}
        defaultValues={{ pin: "" }}
        onSubmit={async ({ pin }) => onSubmit(pin)}
        resetOnSuccess={["pin"]}
        initialError={initialError}
      >
        <TextField
          name="pin"
          label={title}
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          size="lg"
          textAlign="center"
          letterSpacing="0.3em"
        />
        <Hint>
          숫자 {OWNER_PIN_MIN_LENGTH}~{OWNER_PIN_MAX_LENGTH}자리
        </Hint>
        <SubmitButton size="lg" fullWidth>
          {submitLabel}
        </SubmitButton>
      </SimpleForm>
    </Stack>
  );
}
