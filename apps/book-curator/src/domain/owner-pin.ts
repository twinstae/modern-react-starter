import * as v from "valibot";

/** 주인 PIN은 숫자 4~6자리다. 화면도 같은 길이를 안내한다. */
export const OWNER_PIN_MIN_LENGTH = 4;
export const OWNER_PIN_MAX_LENGTH = 6;

export const OwnerPinSchema = v.pipe(
  v.string(),
  v.regex(
    new RegExp(`^\\d{${OWNER_PIN_MIN_LENGTH},${OWNER_PIN_MAX_LENGTH}}$`),
    `PIN은 숫자 ${OWNER_PIN_MIN_LENGTH}~${OWNER_PIN_MAX_LENGTH}자리여야 해요`,
  ),
);

export type OwnerPin = v.InferOutput<typeof OwnerPinSchema>;

/** 경계에서 PIN을 도메인 값으로 파싱한다. 형식이 틀리면 ValiError를 던진다. */
export function parseOwnerPin(value: unknown): OwnerPin {
  return v.parse(OwnerPinSchema, value);
}
