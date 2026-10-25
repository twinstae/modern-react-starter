import { useState } from "react";
import { styled } from "styled-system/jsx";

import { NICKNAME_MAX_LENGTH, parseNickname } from "../domain/statement.ts";
import {
  BodyText,
  Button,
  Eyebrow,
  FieldError,
  FormCard,
  Hint,
  Input,
  Label,
  PageTitle,
  Screen,
  StatusText,
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

const LabelRow = styled("div", {
  base: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "3" },
});

const errorMessage = (nickname: string): string | null => {
  const length = Array.from(nickname.trim()).length;
  if (length === 0) return "별명을 적어 주세요";
  if (length > NICKNAME_MAX_LENGTH) return `별명은 ${NICKNAME_MAX_LENGTH}자까지 쓸 수 있어요`;
  return null;
};

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
  const [nickname, setNickname] = useState(initialNickname);
  const [error, setError] = useState<string | null>(initialError);

  return (
    <NicknameScreen tone="none">
      <BrandPanel>
        <Intro>
          <Eyebrow>BOOK SHOP 79-1 · 서촌</Eyebrow>
          <PageTitle>지금, 어떤 책이 필요한가</PageTitle>
          <BodyText color="fg.muted">별명으로 시작해요. 별명은 저장하지 않아요.</BodyText>
          <StatusText>질문 {questionCount}개 · 3분쯤 걸려요</StatusText>
        </Intro>
      </BrandPanel>
      <FormPanel>
        <FormCard
          maxW="32rem"
          onSubmit={(event) => {
            event.preventDefault();
            const problem = errorMessage(nickname);
            setError(problem);
            if (problem === null) onStart(parseNickname(nickname));
          }}
        >
          <LabelRow>
            <Label htmlFor="nickname">별명</Label>
            <Hint id="nickname-hint">실명이 아니어도 괜찮아요</Hint>
          </LabelRow>
          <Input
            id="nickname"
            name="nickname"
            size="lg"
            value={nickname}
            placeholder="예: 토끼"
            autoComplete="off"
            aria-describedby="nickname-hint"
            aria-invalid={error === null ? undefined : true}
            aria-errormessage={error === null ? undefined : "nickname-error"}
            onChange={(event) => {
              setNickname(event.target.value);
              if (error !== null) setError(null);
            }}
          />
          {error === null ? null : (
            <FieldError id="nickname-error" role="alert">
              {error}
            </FieldError>
          )}
          <Button type="submit" size="lg" fullWidth>
            시작하기
          </Button>
        </FormCard>
      </FormPanel>
    </NicknameScreen>
  );
}
