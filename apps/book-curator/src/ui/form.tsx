import { styled } from "styled-system/jsx";

export const Field = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "2" },
});

export const Label = styled("label", {
  base: { fontFamily: "body", fontWeight: "700", color: "fg.default" },
  variants: {
    size: {
      sm: { fontSize: "kiosk-caption" },
      md: { fontSize: "kiosk-body" },
    },
  },
  defaultVariants: { size: "md" },
});

export const Hint = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption", lineHeight: "1.45" },
});

export const FieldError = styled("p", {
  base: { color: "red.9", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "600" },
});

export const Input = styled("input", {
  base: {
    width: "full",
    px: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    outline: "none",
    _placeholder: { color: "fg.muted" },
    _focusVisible: { borderColor: "pine.500", outline: "3px solid", outlineColor: "pine.500" },
    _disabled: { opacity: "0.55", cursor: "not-allowed" },
  },
  variants: {
    size: {
      sm: { minH: "9", fontSize: "kiosk-caption" },
      md: { minH: "11", fontSize: "kiosk-caption" },
      lg: { minH: "14", fontSize: "kiosk-body" },
    },
  },
  defaultVariants: { size: "md" },
});

export const Textarea = styled("textarea", {
  base: {
    width: "full",
    minH: "24",
    px: "3",
    py: "2",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    lineHeight: "1.5",
    outline: "none",
    resize: "vertical",
    _focusVisible: { borderColor: "pine.500", outline: "3px solid", outlineColor: "pine.500" },
  },
});

/** 입력 폼을 종이 카드처럼 묶는 틀. 폼 자체가 카드인 화면(별명)에서 쓴다. */
export const FormCard = styled("form", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4",
    width: "full",
    p: "6",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zineLg",
  },
});
