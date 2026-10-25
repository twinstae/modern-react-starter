import { styled } from "styled-system/jsx";

export type ItemScaleValue = 1 | 2 | 3 | 4 | 5;

const SCALE_OPTIONS = [
  { value: 1, label: "전혀 아니다", visible: "전혀 아니다" },
  { value: 2, label: "아니다", visible: "2" },
  { value: 3, label: "보통이다", visible: "3" },
  { value: 4, label: "그렇다", visible: "4" },
  { value: 5, label: "매우 그렇다", visible: "매우 그렇다" },
] as const satisfies readonly {
  value: ItemScaleValue;
  label: string;
  visible: string;
}[];

const Screen = styled("main", {
  base: {
    minH: "100dvh",
    display: "grid",
    gridTemplateRows: "auto auto 1fr auto",
    gap: "6",
    px: "page",
    py: "8",
    bg: "canvas",
    color: "fg.default",
  },
});

const Progress = styled("p", {
  base: { color: "fg.muted", fontSize: "kiosk-caption", letterSpacing: "wide" },
});

const QuestionArea = styled("section", {
  base: {
    display: "flex",
    alignItems: "center",
    maxW: "5xl",
    mx: "auto",
    textAlign: "center",
  },
});

const QuestionText = styled("h1", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-question",
    fontWeight: "600",
    lineHeight: "1.45",
    wordBreak: "keep-all",
  },
});

const HiddenLegend = styled("legend", { base: { srOnly: true } });

const HiddenText = styled("span", { base: { srOnly: true } });

const ScaleFieldset = styled("fieldset", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    alignItems: "stretch",
    gap: "3",
    width: "full",
    maxW: "6xl",
    mx: "auto",
    py: "4",
    borderWidth: "0",
  },
});

const ScaleLabel = styled("label", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3",
    minH: "28",
    px: "2",
    py: "4",
    borderWidth: "1px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.100",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-scale",
    textAlign: "center",
    cursor: "pointer",
    _hover: { borderColor: "seal.500", bg: "paper.200" },
  },
});

const ScaleRadio = styled("input", {
  base: {
    width: "6",
    height: "6",
    accentColor: "seal.500",
    cursor: "pointer",
  },
});

const Footer = styled("footer", {
  base: { display: "flex", justifyContent: "flex-start", maxW: "6xl", width: "full", mx: "auto" },
});

const BackButton = styled("button", {
  base: {
    borderWidth: "0",
    borderRadius: "l2",
    bg: "transparent",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-body",
    cursor: "pointer",
    px: "4",
    py: "3",
    _hover: { color: "fg.default", bg: "paper.200" },
    _focusVisible: { outline: "2px solid", outlineColor: "ink.900", outlineOffset: "2px" },
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
    <Screen>
      <Progress role="status" aria-label="진행">
        {index + 1} / {total}
      </Progress>
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
              onChange={() => onAnswer(option.value)}
            />
            <span aria-hidden="true">{option.visible}</span>
            <HiddenText>{option.label}</HiddenText>
          </ScaleLabel>
        ))}
      </ScaleFieldset>
      <Footer>
        <BackButton type="button" onClick={onBack}>
          되돌아가기
        </BackButton>
      </Footer>
    </Screen>
  );
}
