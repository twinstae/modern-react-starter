import * as v from "valibot";

import { AdminPasswordSetupSchema } from "../domain/admin-password.ts";
import {
  Card,
  Eyebrow,
  MutedText,
  PageTitle,
  Screen,
  SimpleForm,
  SubmitButton,
  TextField,
} from "../ui/index.ts";

const SignInSchema = v.object({ password: v.string() });

/**
 * 운영 화면에 들어가는 폼. 이 기기에 운영 비밀번호가 없으면(`setup`) 두 번 넣어 정하고,
 * 있으면(`sign-in`) 그 비밀번호를 넣는다. 맞는지 판단은 콜백이 맡고, 실패하면 까닭 문장을 돌려준다.
 */
export function AdminLogin({
  mode,
  onSubmit,
  onSuccess,
  initialError = null,
}: {
  mode: "setup" | "sign-in";
  onSubmit: (password: string) => Promise<string | undefined>;
  onSuccess?: () => void;
  initialError?: string | null;
}) {
  const title = mode === "setup" ? "운영 비밀번호 정하기" : "운영자 로그인";

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
        <PageTitle id="admin-login-title">{title}</PageTitle>
        {mode === "setup" ? (
          <>
            <MutedText>
              이 태블릿에서 서랍을 고치고 공개할 때 쓰는 비밀번호예요. 이 기기에만 저장되고, 잊으면
              되찾을 수 없어요.
            </MutedText>
            <SimpleForm
              aria-label={title}
              schema={AdminPasswordSetupSchema}
              defaultValues={{ password: "", confirm: "" }}
              onSubmit={({ password }) => onSubmit(password)}
              onSuccess={() => onSuccess?.()}
              initialError={initialError}
            >
              <TextField
                name="password"
                label="새 비밀번호"
                type="password"
                autoComplete="new-password"
              />
              <TextField
                name="confirm"
                label="한 번 더"
                type="password"
                autoComplete="new-password"
              />
              <SubmitButton size="lg" fullWidth>
                정하고 들어가기
              </SubmitButton>
            </SimpleForm>
          </>
        ) : (
          <SimpleForm
            aria-label={title}
            schema={SignInSchema}
            defaultValues={{ password: "" }}
            onSubmit={({ password }) => onSubmit(password)}
            onSuccess={() => onSuccess?.()}
            initialError={initialError}
          >
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
        )}
      </Card>
    </Screen>
  );
}
