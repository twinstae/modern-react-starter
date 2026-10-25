import { useId, useState } from "react";
import { styled } from "styled-system/jsx";

import { OWNER_PIN_MAX_LENGTH, OWNER_PIN_MIN_LENGTH } from "../domain/owner-pin.ts";
import { Button, FieldError, Hint, Input, Label } from "../ui/index.ts";

const Form = styled("form", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
    width: "full",
    maxW: "24rem",
  },
});

const problem = (pin: string): string | null => {
  if (!/^\d*$/.test(pin)) return "PIN은 숫자로 입력해 주세요";
  if (pin.length < OWNER_PIN_MIN_LENGTH || pin.length > OWNER_PIN_MAX_LENGTH) {
    return `PIN은 ${OWNER_PIN_MIN_LENGTH}~${OWNER_PIN_MAX_LENGTH}자리로 입력해 주세요`;
  }
  return null;
};

/**
 * 주인 PIN 입력. 키오스크의 잠금을 열 때와 운영 화면에서 PIN을 정할 때 같은 컴포넌트를 쓴다.
 * 형식(숫자 4~6자리)은 여기서 막고, 맞는 PIN인지는 콜백이 돌려준 실패 문구로 알린다.
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
  const inputId = useId();
  const errorId = useId();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = problem(pin);
    if (invalid !== null) {
      setError(invalid);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const failure = await onSubmit(pin);
      if (failure === undefined) setPin("");
      else setError(failure);
    } catch {
      setError("PIN을 확인하지 못했어요. 잠시 뒤 다시 해 주세요.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Form onSubmit={submit} noValidate>
      <Label htmlFor={inputId}>{title}</Label>
      <Input
        id={inputId}
        name="owner-pin"
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        size="lg"
        value={pin}
        textAlign="center"
        letterSpacing="0.3em"
        aria-describedby={error === null ? undefined : errorId}
        aria-invalid={error === null ? undefined : true}
        aria-errormessage={error === null ? undefined : errorId}
        onChange={(event) => {
          setPin(event.target.value);
          if (error !== null) setError(null);
        }}
      />
      <Hint>
        숫자 {OWNER_PIN_MIN_LENGTH}~{OWNER_PIN_MAX_LENGTH}자리
      </Hint>
      {error === null ? null : (
        <FieldError id={errorId} role="alert">
          {error}
        </FieldError>
      )}
      <Button type="submit" size="lg" fullWidth disabled={pending} aria-busy={pending || undefined}>
        {submitLabel}
      </Button>
    </Form>
  );
}
