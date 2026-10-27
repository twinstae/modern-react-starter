import { Button, Caption, PageTitle, ScaleField, Screen, Stack } from "../ui/index.ts";

export type ItemScaleValue = 1 | 2 | 3 | 4 | 5;

const SCALE_OPTIONS = [
  { value: 1, label: "전혀 아니다" },
  { value: 2, label: "아니다" },
  { value: 3, label: "보통" },
  { value: 4, label: "그렇다" },
  { value: 5, label: "매우 그렇다" },
] as const satisfies readonly { value: ItemScaleValue; label: string }[];

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
      <Stack flex="1" justifyContent="space-evenly" gap="6">
        <Stack
          alignItems="center"
          justifyContent="center"
          maxW="5xl"
          mx="auto"
          width="full"
          textAlign="center"
        >
          <PageTitle fontFamily="body" fontSize="kiosk-question" fontWeight="700" lineHeight="1.4">
            {questionText}
          </PageTitle>
        </Stack>
        <ScaleField
          legend={questionText}
          options={SCALE_OPTIONS}
          onSelect={(value) => onAnswer(value as ItemScaleValue)}
        />
      </Stack>
      <Button tone="quiet" aria-label="되돌아가기" onClick={onBack} alignSelf="flex-start">
        ← 이전 질문
      </Button>
    </Screen>
  );
}
