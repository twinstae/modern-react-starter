import { BodyText, Card, InlineText, ScalePreview, Stack, SubTitle } from "../ui/index.ts";

const SCALE = [
  { value: 1, label: "전혀 아니다" },
  { value: 2, label: "아니다" },
  { value: 3, label: "보통" },
  { value: 4, label: "그렇다" },
  { value: 5, label: "매우 그렇다" },
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
    <Card tone="flat" gap="3" p="4" bg="paper.100" aria-labelledby="question-preview-title">
      <SubTitle id="question-preview-title">문항 미리보기</SubTitle>
      <Stack
        justifyContent="space-between"
        gap="5"
        minH="20rem"
        p="5"
        borderWidth="2px"
        borderColor="border"
        borderRadius="l2"
        bg="canvas"
        borderTopWidth="8px"
        borderTopColor="yellow.500"
      >
        <InlineText tone="pine" weight="strong">
          {drawerName} · {index + 1} / {total}
        </InlineText>
        <BodyText fontWeight="700" textAlign="center" wordBreak="keep-all">
          {questionText}
        </BodyText>
        <ScalePreview label="답변 다섯 칸 미리보기" options={SCALE} />
      </Stack>
    </Card>
  );
}
