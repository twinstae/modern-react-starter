import { styled } from "styled-system/jsx";

import { FONT_OPTIONS, type FontId } from "../lib/font-preference.ts";
import { Card, MutedText, SectionTitle } from "../ui/index.ts";

const Options = styled("fieldset", {
  base: { display: "grid", gap: "3", m: "0", p: "0", borderWidth: "0" },
});

const HiddenLegend = styled("legend", { base: { srOnly: true } });

const Option = styled("label", {
  base: {
    position: "relative",
    display: "grid",
    gap: "2",
    px: "4",
    py: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    cursor: "pointer",
    transition: "background-color 120ms, translate 120ms",
    _hover: { bg: "yellow.100", borderColor: "pine.500" },
    _focusWithin: { outline: "3px solid", outlineColor: "pine.600", outlineOffset: "3px" },
  },
  variants: {
    selected: {
      true: { bg: "yellow.100", borderColor: "pine.600" },
    },
  },
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

const Name = styled("span", {
  base: { fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700", color: "fg.muted" },
});

const Sample = styled("span", {
  base: {
    fontFamily: "body",
    fontSize: "kiosk-question",
    fontWeight: "600",
    lineHeight: "1.4",
    wordBreak: "keep-all",
  },
  variants: {
    font: {
      kimyui: { fontFamily: "var(--font-kimyui)" },
      microorganism: { fontFamily: "var(--font-microorganism)" },
      noto: { fontFamily: "var(--font-noto)" },
    },
  },
});

/** 화면 글꼴 고르기. 고르는 즉시 이 브라우저의 글꼴이 바뀐다. */
export function FontPicker({ value, onChange }: { value: FontId; onChange: (id: FontId) => void }) {
  return (
    <Card tone="paper" p="6" gap="4" maxW="42rem" aria-labelledby="font-settings-title">
      <SectionTitle id="font-settings-title">화면 글꼴</SectionTitle>
      <MutedText>
        질문, 결과, 버튼까지 이 브라우저의 글꼴이 바뀌어요. 기기마다 따로 저장되니 키오스크
        태블릿에서 골라 주세요.
      </MutedText>
      <Options>
        <HiddenLegend>화면 글꼴</HiddenLegend>
        {FONT_OPTIONS.map((option) => (
          <Option key={option.id} selected={value === option.id}>
            <Radio
              type="radio"
              name="font"
              value={option.id}
              aria-label={option.label}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            <Name aria-hidden="true">{option.label}</Name>
            <Sample font={option.id} aria-hidden="true">
              지금, 어떤 책이 필요한가
            </Sample>
          </Option>
        ))}
      </Options>
    </Card>
  );
}
