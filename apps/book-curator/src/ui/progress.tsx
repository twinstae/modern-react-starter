import { styled } from "styled-system/jsx";

const Track = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "1",
    height: "3",
    borderWidth: "1px",
    borderColor: "border",
    bg: "paper.100",
    overflow: "hidden",
  },
});

const Fill = styled("div", {
  base: { height: "full" },
  variants: {
    tone: {
      pine: { bg: "pine.500" },
      yellow: { bg: "yellow.500", borderTopWidth: "1px", borderColor: "border" },
    },
  },
  defaultVariants: { tone: "pine" },
});

/** 0~1 비율 하나를 막대로 보여 준다. 점검 보고의 분포에 쓴다. */
export function ProgressBar({
  label,
  value,
  tone = "pine",
}: {
  label: string;
  value: number;
  tone?: "pine" | "yellow";
}) {
  const percent = Math.round(value * 100);

  return (
    <Track
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <Fill tone={tone} style={{ width: `${percent}%` }} />
    </Track>
  );
}
