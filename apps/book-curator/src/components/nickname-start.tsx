import { useState } from "react";
import { styled } from "styled-system/jsx";

import { NICKNAME_MAX_LENGTH, parseNickname } from "../domain/statement.ts";

const Screen = styled("main", {
  base: {
    minH: "100dvh",
    display: "grid",
    gridTemplateRows: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
    bg: "canvas",
    color: "fg.default",
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
    fontFamily: "heading",
    fontSize: "kiosk-title",
    fontWeight: "600",
    lineHeight: "1.25",
    wordBreak: "keep-all",
  },
});

const PromiseText = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-body", lineHeight: "1.5" },
});

const Meta = styled("p", {
  base: { color: "pine.700", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "600" },
});

const Form = styled("form", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4",
    width: "full",
    maxW: "32rem",
    p: "6",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zineLg",
    md: { p: "8" },
  },
});

const LabelRow = styled("div", {
  base: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "3" },
});

const Label = styled("label", {
  base: { fontFamily: "body", fontSize: "kiosk-body", fontWeight: "700" },
});

const Hint = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const NicknameInput = styled("input", {
  base: {
    width: "full",
    height: "16",
    px: "4",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-body",
    outline: "none",
    _placeholder: { color: "fg.muted" },
    _focusVisible: { borderColor: "pine.500", outline: "3px solid", outlineColor: "pine.500" },
  },
});

const ErrorText = styled("p", {
  base: { color: "red.9", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "600" },
});

const StartButton = styled("button", {
  base: {
    width: "full",
    height: "16",
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
    _hover: { bg: "pine.700", borderColor: "pine.700" },
    _active: { translate: "2px 2px", boxShadow: "none" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "3px" },
  },
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
    <Screen>
      <BrandPanel>
        <Intro>
          <Eyebrow>BOOK SHOP 79-1 · 서촌</Eyebrow>
          <Title>지금, 어떤 책이 필요한가</Title>
          <PromiseText>별명으로 시작해요. 별명은 저장하지 않아요.</PromiseText>
          <Meta>질문 {questionCount}개 · 3분쯤 걸려요</Meta>
        </Intro>
      </BrandPanel>
      <FormPanel>
        <Form
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
          <NicknameInput
            id="nickname"
            name="nickname"
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
            <ErrorText id="nickname-error" role="alert">
              {error}
            </ErrorText>
          )}
          <StartButton type="submit">시작하기</StartButton>
        </Form>
      </FormPanel>
    </Screen>
  );
}
