import { useState } from "react";
import { styled } from "styled-system/jsx";

import type { AdminCredentials } from "../admin-dto.ts";
import {
  Button,
  Card,
  Eyebrow,
  Field,
  FieldError,
  Input,
  Label,
  PageTitle,
  Screen,
} from "../ui/index.ts";

const Form = styled("form", {
  base: { display: "flex", flexDirection: "column", gap: "4", mt: "6" },
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
    <Screen
      tone="none"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px="page"
      py="12"
    >
      <Card tone="paper" width="full" maxW="30rem" p="6" aria-labelledby="admin-login-title">
        <Eyebrow>BOOK SHOP 79-1</Eyebrow>
        <PageTitle id="admin-login-title">운영자 로그인</PageTitle>
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
            <FieldError id="admin-login-error" role="alert">
              {error}
            </FieldError>
          )}
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={pending}
            aria-busy={pending || undefined}
          >
            로그인
          </Button>
        </Form>
      </Card>
    </Screen>
  );
}
