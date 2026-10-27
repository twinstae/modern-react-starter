import * as v from "valibot";

import type { AdminCredentials } from "../admin-dto.ts";
import {
  Card,
  Eyebrow,
  PageTitle,
  Screen,
  SimpleForm,
  SubmitButton,
  TextField,
} from "../ui/index.ts";

const LoginSchema = v.object({
  email: v.string(),
  password: v.string(),
});

/**
 * 운영자 로그인 폼. 성공·실패 판단은 콜백이 맡고, 화면은 폼 상태만 다룬다.
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
        <SimpleForm
          aria-label="운영자 로그인"
          schema={LoginSchema}
          defaultValues={{ email: "", password: "" }}
          onSubmit={onSubmit}
          onSuccess={() => onSuccess?.()}
          initialError={initialError}
        >
          <TextField name="email" label="이메일" type="email" autoComplete="email" />
          <TextField
            name="password"
            label="비밀번호"
            type="password"
            autoComplete="current-password"
          />
          <SubmitButton size="lg" fullWidth>
            로그인
          </SubmitButton>
        </SimpleForm>
      </Card>
    </Screen>
  );
}
