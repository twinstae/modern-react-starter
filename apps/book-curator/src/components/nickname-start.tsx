import { useState } from "react";
import { styled } from "styled-system/jsx";

import { NICKNAME_MAX_LENGTH, parseNickname } from "../domain/statement.ts";

const Screen = styled("main", {
  base: {
    minH: "100dvh",
    display: "grid",
    gridTemplateRows: "1fr auto",
    gap: "10",
    px: "page",
    py: "12",
    bg: "canvas",
    color: "fg.default",
  },
});

const Intro = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "4",
    textAlign: "center",
  },
});

const Title = styled("h1", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-title",
    fontWeight: "600",
    lineHeight: "1.3",
  },
});

const PromiseText = styled("p", {
  base: { color: "fg.muted", fontSize: "kiosk-body" },
});

const Form = styled("form", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4",
    width: "full",
    maxW: "xl",
    mx: "auto",
    pb: "6",
  },
});

const Label = styled("label", {
  base: { fontSize: "kiosk-body", fontWeight: "600" },
});

const NicknameInput = styled("input", {
  base: {
    width: "full",
    height: "16",
    px: "4",
    borderWidth: "1px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.100",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-body",
    outline: "none",
    _focusVisible: { borderColor: "seal.500", outline: "2px solid", outlineColor: "seal.500" },
  },
});

const ErrorText = styled("p", {
  base: { color: "red.9", fontSize: "kiosk-body" },
});

const StartButton = styled("button", {
  base: {
    width: "full",
    height: "16",
    borderWidth: "0",
    borderRadius: "l2",
    bg: "seal.500",
    color: "white",
    fontFamily: "body",
    fontSize: "kiosk-body",
    fontWeight: "600",
    cursor: "pointer",
    _hover: { bg: "seal.600" },
    _focusVisible: { outline: "2px solid", outlineColor: "ink.900", outlineOffset: "2px" },
  },
});

const errorMessage = (nickname: string): string | null => {
  const length = Array.from(nickname.trim()).length;
  if (length === 0) return "별명을 입력해 주세요";
  if (length > NICKNAME_MAX_LENGTH) return `별명은 ${NICKNAME_MAX_LENGTH}자까지 쓸 수 있어요`;
  return null;
};

/**
 * 손님의 첫 화면. 별명만 받고 시작을 알린다. 별명은 이 화면 밖으로 서버에 가지 않는다.
 * `initialError`는 스토리에서 오류 모습을 보여 주기 위한 초기값이다.
 */
export function NicknameStart({
  onStart,
  initialNickname = "",
  initialError = null,
}: {
  onStart: (nickname: string) => void;
  initialNickname?: string;
  initialError?: string | null;
}) {
  const [nickname, setNickname] = useState(initialNickname);
  const [error, setError] = useState<string | null>(initialError);

  return (
    <Screen>
      <Intro>
        <Title>지금, 어떤 책이 필요한가</Title>
        <PromiseText>책방79-1 · 실명 대신 별명으로 · 기록은 남지 않아요</PromiseText>
      </Intro>
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          const problem = errorMessage(nickname);
          setError(problem);
          if (problem === null) onStart(parseNickname(nickname));
        }}
      >
        <Label htmlFor="nickname">별명</Label>
        <NicknameInput
          id="nickname"
          name="nickname"
          value={nickname}
          autoComplete="off"
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
        <StartButton type="submit">시작</StartButton>
      </Form>
    </Screen>
  );
}
