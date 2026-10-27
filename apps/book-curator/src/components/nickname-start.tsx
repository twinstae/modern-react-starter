import * as v from "valibot";
import { styled } from "styled-system/jsx";

import { NicknameSchema, parseNickname } from "../domain/statement.ts";
import {
  Eyebrow,
  FormCard,
  PageTitle,
  Screen,
  SimpleForm,
  StatusText,
  SubmitButton,
  TextField,
} from "../ui/index.ts";

const NicknameScreen = styled(Screen, {
  base: {
    display: "grid",
    gridTemplateRows: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
    lg: { gridTemplateColumns: "1.05fr 1fr", gridTemplateRows: "1fr" },
  },
});

const BrandPanel = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3",
    px: "page",
    py: "10",
    bg: "yellow.500",
    borderBottomWidth: "2px",
    borderColor: "ink.900",
    textAlign: "center",
    lg: {
      alignItems: "flex-start",
      borderBottomWidth: "0",
      borderRightWidth: "2px",
      textAlign: "left",
    },
  },
});

const FormPanel = styled("section", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    px: "page",
    py: "8",
    bg: "paper.50",
  },
});

const Intro = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3",
    maxW: "44rem",
    textAlign: "center",
    lg: { alignItems: "flex-start", textAlign: "left" },
  },
});

const NicknameFormSchema = v.object({ nickname: NicknameSchema });

/**
 * 손님의 첫 화면. 별명만 받고 시작을 알린다. 별명은 이 화면 밖으로 서버에 가지 않는다.
 * 노란 벽면과 종이 폼을 나누어, 가게에 들어선 느낌을 낸다.
 */
export function NicknameStart({
  onStart,
  questionCount,
  initialNickname = "",
  initialError = null,
}: {
  onStart: (nickname: string) => void;
  questionCount: number;
  initialNickname?: string;
  initialError?: string | null;
}) {
  return (
    <NicknameScreen tone="none">
      <BrandPanel>
        <Intro>
          <Eyebrow>BOOK SHOP 79-1 · 서촌</Eyebrow>
          <PageTitle>지금, 어떤 책이 필요한가</PageTitle>
          <StatusText>질문 {questionCount}개 · 3분쯤 걸려요</StatusText>
        </Intro>
      </BrandPanel>
      <FormPanel>
        <FormCard maxW="32rem">
          <SimpleForm
            aria-label="별명으로 시작하기"
            schema={NicknameFormSchema}
            defaultValues={{ nickname: initialNickname }}
            onSubmit={async ({ nickname }) => {
              onStart(parseNickname(nickname));
            }}
            initialError={initialError}
          >
            <TextField
              name="nickname"
              label="별명"
              size="lg"
              placeholder="예: 토끼"
              autoComplete="off"
            />
            <SubmitButton size="lg" fullWidth>
              시작하기
            </SubmitButton>
          </SimpleForm>
        </FormCard>
      </FormPanel>
    </NicknameScreen>
  );
}
