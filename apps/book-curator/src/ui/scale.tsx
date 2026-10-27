import { styled } from "styled-system/jsx";

const Grid = styled("div", {
  base: { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "2" },
});

const Fieldset = styled("fieldset", {
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

const HiddenLegend = styled("legend", { base: { srOnly: true } });

const Card = styled("div", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5",
    px: "2",
    py: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    color: "fg.default",
    textAlign: "center",
  },
  variants: {
    interactive: {
      true: {
        cursor: "pointer",
        transition: "background-color 120ms, translate 120ms",
        _hover: { bg: "yellow.100", borderColor: "pine.500", translate: "-2px -2px" },
        _focusWithin: { outline: "3px solid", outlineColor: "pine.600", outlineOffset: "3px" },
      },
      false: {},
    },
    size: {
      question: { minH: "28" },
      preview: { minH: "14", py: "2" },
    },
  },
  defaultVariants: { interactive: false, size: "question" },
});

const Radio = styled("input", {
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

const Number = styled("span", {
  base: { fontWeight: "800", lineHeight: "1", letterSpacing: "-0.02em" },
  variants: {
    size: {
      question: { fontFamily: "body", fontSize: "kiosk-scale-number" },
      preview: { fontFamily: "body", fontSize: "kiosk-caption" },
    },
  },
  defaultVariants: { size: "question" },
});

const Text = styled("span", {
  base: { color: "fg.muted", fontWeight: "600", lineHeight: "1.25", wordBreak: "keep-all" },
  variants: {
    size: {
      question: { fontFamily: "body", fontSize: "kiosk-scale" },
      preview: { fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
    },
  },
  defaultVariants: { size: "question" },
});

export interface ScaleOption {
  readonly value: number;
  readonly label: string;
}

/** 다섯 칸 척도. 손님 문항 화면에서 한 칸을 누르면 바로 답이 된다. */
export function ScaleField({
  legend,
  options,
  onSelect,
}: {
  legend: string;
  options: readonly ScaleOption[];
  onSelect: (value: number) => void;
}) {
  return (
    <Fieldset>
      <HiddenLegend>{legend}</HiddenLegend>
      {options.map((option) => (
        <Card as="label" key={option.value} interactive>
          <Radio
            type="radio"
            name="scale"
            value={option.value}
            aria-label={option.label}
            onChange={() => onSelect(option.value)}
          />
          <Number aria-hidden="true">{option.value}</Number>
          <Text aria-hidden="true">{option.label}</Text>
        </Card>
      ))}
    </Fieldset>
  );
}

/** 관리자 미리보기용 다섯 칸. 눌리지 않고 모양만 보여 준다. */
export function ScalePreview({
  label,
  options,
}: {
  label: string;
  options: readonly ScaleOption[];
}) {
  return (
    <Grid role="group" aria-label={label}>
      {options.map((option) => (
        <Card key={option.value} size="preview">
          <Number size="preview" aria-hidden="true">
            {option.value}
          </Number>
          <Text size="preview" aria-hidden="true">
            {option.label}
          </Text>
        </Card>
      ))}
    </Grid>
  );
}
