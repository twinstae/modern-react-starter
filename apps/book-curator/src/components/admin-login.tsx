import { useState } from "react";
import { styled } from "styled-system/jsx";

import type { AdminCredentials } from "../admin-dto.ts";

const Screen = styled("main", {
  base: {
    minH: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    px: "page",
    py: "12",
    bg: "canvas",
    color: "fg.default",
  },
});

const Card = styled("section", {
  base: {
    width: "full",
    maxW: "30rem",
    p: "6",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zineLg",
    md: { p: "8" },
  },
});

const Eyebrow = styled("p", {
  base: {
    color: "pine.700",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    letterSpacing: "0.12em",
  },
});

const Title = styled("h1", {
  base: {
    mt: "2",
    fontFamily: "heading",
    fontSize: "2xl",
    fontWeight: "600",
    wordBreak: "keep-all",
  },
});

const Form = styled("form", {
  base: { display: "flex", flexDirection: "column", gap: "4", mt: "6" },
});

const Field = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "2" },
});

const Label = styled("label", {
  base: { fontFamily: "body", fontSize: "kiosk-body", fontWeight: "700" },
});

const Input = styled("input", {
  base: {
    width: "full",
    height: "12",
    px: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-body",
    outline: "none",
    _focusVisible: { borderColor: "pine.500", outline: "3px solid", outlineColor: "pine.500" },
  },
});

const ErrorText = styled("p", {
  base: { color: "red.9", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "600" },
});

const Submit = styled("button", {
  base: {
    width: "full",
    height: "14",
    mt: "2",
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

/**
 * 운영자 로그인 폼. 값을 콜백에 넘기고, 콜백이 돌려준 실패 문구를 그대로 보여 준다.
 * 로그인 성공 뒤 할 일(세션 다시 읽기)은 `onSuccess`가 맡는다.
 */
export function AdminLogin({
  onSubmit,
  onSuccess,
  initialError = null,
}: {
  onSubmit: (credentials: AdminCredentials) => Promise<string | undefined>;
  onSuccess?: () => void;
  initialError?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const failure = await onSubmit({ email, password });
      if (failure === undefined) onSuccess?.();
      else setError(failure);
    } catch {
      setError("로그인하지 못했어요. 잠시 뒤 다시 해 주세요.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen>
      <Card aria-labelledby="admin-login-title">
        <Eyebrow>BOOK SHOP 79-1</Eyebrow>
        <Title id="admin-login-title">운영자 로그인</Title>
        <Form onSubmit={submit}>
          <Field>
            <Label htmlFor="admin-email">이메일</Label>
            <Input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              aria-invalid={error === null ? undefined : true}
              aria-errormessage={error === null ? undefined : "admin-login-error"}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error !== null) setError(null);
              }}
            />
          </Field>
          <Field>
            <Label htmlFor="admin-password">비밀번호</Label>
            <Input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              aria-invalid={error === null ? undefined : true}
              aria-errormessage={error === null ? undefined : "admin-login-error"}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error !== null) setError(null);
              }}
            />
          </Field>
          {error === null ? null : (
            <ErrorText id="admin-login-error" role="alert">
              {error}
            </ErrorText>
          )}
          <Submit type="submit" disabled={pending} aria-busy={pending || undefined}>
            로그인
          </Submit>
        </Form>
      </Card>
    </Screen>
  );
}
