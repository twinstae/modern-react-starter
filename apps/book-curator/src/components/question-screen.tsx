import { styled } from "styled-system/jsx";

import { Button, Caption, Screen } from "../ui/index.ts";

export type ItemScaleValue = 1 | 2 | 3 | 4 | 5;

const SCALE_OPTIONS = [
  { value: 1, label: "전혀 아니다" },
  { value: 2, label: "아니다" },
  { value: 3, label: "보통" },
  { value: 4, label: "그렇다" },
  { value: 5, label: "매우 그렇다" },
] as const satisfies readonly { value: ItemScaleValue; label: string }[];

const Body = styled("div", {
  base: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly",
    gap: "6",
  },
});

const QuestionArea = styled("section", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    maxW: "5xl",
    mx: "auto",
    width: "full",
    textAlign: "center",
  },
});

const QuestionText = styled("h1", {
  base: {
    fontFamily: "body",
    fontSize: "kiosk-question",
    fontWeight: "700",
    lineHeight: "1.4",
    wordBreak: "keep-all",
  },
});

const HiddenLegend = styled("legend", { base: { srOnly: true } });

const ScaleFieldset = styled("fieldset", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "2.5",
    width: "full",
    maxW: "6xl",
    mx: "auto",
    pt: "6",
    pb: "2",
    borderWidth: "0",
    borderTopWidth: "2px",
    borderTopColor: "border",
  },
});

const ScaleLabel = styled("label", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5",
    minH: "28",
    px: "2",
    py: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    color: "fg.default",
    cursor: "pointer",
    transition: "background-color 120ms, translate 120ms",
    _hover: { bg: "yellow.100", borderColor: "pine.500", translate: "-2px -2px" },
    _focusWithin: { outline: "3px solid", outlineColor: "pine.600", outlineOffset: "3px" },
  },
});

const ScaleNumber = styled("span", {
  base: {
    fontFamily: "body",
    fontSize: "kiosk-scale-number",
    fontWeight: "800",
    lineHeight: "1",
    letterSpacing: "-0.02em",
  },
});

const ScaleText = styled("span", {
  base: {
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-scale",
    fontWeight: "600",
    lineHeight: "1.25",
    wordBreak: "keep-all",
  },
});

const ScaleRadio = styled("input", {
  base: {
    position: "absolute",
    inset: "0",
    width: "full",
    height: "full",
    m: "0",
    opacity: "0",
    cursor: "pointer",
  },
});

/**
 * 문항 하나. 다섯 칸 중 하나를 누르면 그 값으로 바로 다음 문항을 부른다.
 * 문항 수는 데이터이므로 `total`을 그대로 보여 준다(I-5).
 */
export function QuestionScreen({
  questionText,
  index,
  total,
  onAnswer,
  onBack,
}: {
  questionText: string;
  index: number;
  total: number;
  onAnswer: (value: ItemScaleValue) => void;
  onBack: () => void;
}) {
  return (
    <Screen display="flex" flexDirection="column" gap="4" px="page" py="6">
      <Caption
        role="status"
        aria-label="진행"
        color="pine.700"
        fontWeight="700"
        letterSpacing="0.08em"
      >
        {index + 1} / {total}
      </Caption>
      <Body>
        <QuestionArea>
          <QuestionText>{questionText}</QuestionText>
        </QuestionArea>
        <ScaleFieldset>
          <HiddenLegend>{questionText}</HiddenLegend>
          {SCALE_OPTIONS.map((option) => (
            <ScaleLabel key={option.value}>
              <ScaleRadio
                type="radio"
                name="scale"
                value={option.value}
                aria-label={option.label}
                onChange={() => onAnswer(option.value)}
              />
              <ScaleNumber aria-hidden="true">{option.value}</ScaleNumber>
              <ScaleText aria-hidden="true">{option.label}</ScaleText>
            </ScaleLabel>
          ))}
        </ScaleFieldset>
      </Body>
      <Button tone="quiet" aria-label="되돌아가기" onClick={onBack} alignSelf="flex-start">
        ← 이전 질문
      </Button>
    </Screen>
  );
}
