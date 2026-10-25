import { styled } from "styled-system/jsx";

const Frame = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
    p: "4",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.100",
  },
});

const Title = styled("h3", {
  base: { fontFamily: "body", fontSize: "kiosk-body", fontWeight: "700" },
});

const Tablet = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "5",
    minH: "20rem",
    p: "5",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "canvas",
    borderTopWidth: "8px",
    borderTopColor: "yellow.500",
  },
});

const Progress = styled("p", {
  base: { color: "pine.700", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

const Question = styled("p", {
  base: {
    alignSelf: "center",
    fontFamily: "body",
    fontSize: "kiosk-body",
    fontWeight: "700",
    lineHeight: "1.4",
    textAlign: "center",
    wordBreak: "keep-all",
  },
});

const Scale = styled("div", {
  base: { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "2" },
});

const Chip = styled("span", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1",
    minH: "14",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    textAlign: "center",
  },
});

const SCALE = [
  ["1", "전혀 아니다"],
  ["2", "아니다"],
  ["3", "보통"],
  ["4", "그렇다"],
  ["5", "매우 그렇다"],
] as const;

/**
 * 손님 태블릿의 문항 화면을 관리자 옆에 작게 재현한다. 실제 키오스크 컴포넌트를
 * 재사용하지 않고, 문장과 다섯 칸의 모양만 같은 결로 보여 준다.
 */
export function QuestionPreview({
  drawerName,
  questionText,
  index,
  total,
}: {
  drawerName: string;
  questionText: string;
  index: number;
  total: number;
}) {
  return (
    <Frame aria-labelledby="question-preview-title">
      <Title id="question-preview-title">문항 미리보기</Title>
      <Tablet>
        <Progress>
          {drawerName} · {index + 1} / {total}
        </Progress>
        <Question>{questionText}</Question>
        <Scale role="group" aria-label="답변 다섯 칸 미리보기">
          {SCALE.map(([number, label]) => (
            <Chip key={number}>
              <span aria-hidden="true">{number}</span>
              <span aria-hidden="true">{label}</span>
            </Chip>
          ))}
        </Scale>
      </Tablet>
    </Frame>
  );
}
