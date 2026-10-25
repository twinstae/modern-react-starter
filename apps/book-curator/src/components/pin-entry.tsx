import { useId, useState } from "react";
import { styled } from "styled-system/jsx";

import { OWNER_PIN_MAX_LENGTH, OWNER_PIN_MIN_LENGTH } from "../domain/owner-pin.ts";

const Form = styled("form", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
    width: "full",
    maxW: "24rem",
  },
});

const Label = styled("label", {
  base: { fontFamily: "body", fontSize: "kiosk-body", fontWeight: "700" },
});

const Input = styled("input", {
  base: {
    width: "full",
    height: "14",
    px: "4",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-question",
    letterSpacing: "0.3em",
    textAlign: "center",
    outline: "none",
    _focusVisible: { borderColor: "pine.500", outline: "3px solid", outlineColor: "pine.500" },
  },
});

const Hint = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const ErrorText = styled("p", {
  base: { color: "red.9", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "600" },
});

const Submit = styled("button", {
  base: {
    width: "full",
    height: "14",
    borderWidth: "2px",
    borderColor: "pine.700",
    borderRadius: "l2",
    bg: "pine.600",
    color: "paper.50",
    fontFamily: "body",
    fontSize: "kiosk-body",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "zine",
    transition: "background-color 120ms, translate 120ms, box-shadow 120ms",
    _hover: { bg: "pine.700" },
    _active: { translate: "2px 2px", boxShadow: "none" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "3px" },
    _disabled: { cursor: "wait", opacity: "0.7" },
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
        value={pin}
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
        <ErrorText id={errorId} role="alert">
          {error}
        </ErrorText>
      )}
      <Submit type="submit" disabled={pending} aria-busy={pending || undefined}>
        {submitLabel}
      </Submit>
    </Form>
  );
}
