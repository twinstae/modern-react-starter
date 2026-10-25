import { forwardRef, type ComponentProps } from "react";
import { styled } from "styled-system/jsx";

const BaseButton = styled("button", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    borderWidth: "2px",
    borderRadius: "l2",
    fontFamily: "body",
    fontWeight: "700",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition:
      "background-color 120ms, border-color 120ms, color 120ms, translate 120ms, box-shadow 120ms",
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "3px" },
    _disabled: { cursor: "not-allowed", opacity: "0.55" },
  },
  variants: {
    tone: {
      primary: {
        borderColor: "pine.700",
        bg: "pine.600",
        color: "paper.50",
        boxShadow: "zine",
        _hover: { bg: "pine.700" },
        _active: { translate: "2px 2px", boxShadow: "none" },
      },
      owner: {
        borderColor: "seal.600",
        bg: "seal.500",
        color: "paper.50",
        boxShadow: "zine",
        _hover: { bg: "seal.600" },
        _active: { translate: "2px 2px", boxShadow: "none" },
      },
      outline: {
        borderColor: "pine.600",
        bg: "surface",
        color: "pine.700",
        _hover: { bg: "paper.100" },
      },
      quiet: {
        borderWidth: "0",
        bg: "transparent",
        color: "fg.muted",
        _hover: { bg: "paper.100", color: "fg.default" },
      },
      link: {
        alignSelf: "center",
        borderWidth: "0",
        borderBottomWidth: "1px",
        borderColor: "currentColor",
        borderRadius: "0",
        bg: "transparent",
        color: "fg.muted",
        px: "1",
        py: "0",
        _hover: { color: "fg.default" },
      },
      danger: {
        borderColor: "seal.500",
        bg: "surface",
        color: "seal.600",
        _hover: { bg: "paper.100" },
      },
    },
    size: {
      sm: { minH: "9", px: "3", fontSize: "kiosk-caption" },
      md: { minH: "11", px: "4", fontSize: "kiosk-caption" },
      lg: { minH: "14", px: "6", fontSize: "kiosk-body" },
    },
    fullWidth: {
      true: { width: "full" },
    },
  },
  defaultVariants: { tone: "primary", size: "md" },
});

type ButtonProps = ComponentProps<typeof BaseButton>;

/** 공통 버튼. type을 생략하면 form 안에서 의도치 않게 submit되지 않도록 button으로 둔다. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { type = "button", ...props },
  ref,
) {
  return <BaseButton ref={ref} type={type} {...props} />;
});
