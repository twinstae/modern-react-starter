import { styled } from "styled-system/jsx";

export const Eyebrow = styled("p", {
  base: {
    color: "pine.600",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "800",
    letterSpacing: "0.08em",
  },
  variants: {
    tone: {
      pine: {},
      seal: { color: "seal.600" },
      muted: { color: "fg.muted" },
    },
  },
  defaultVariants: { tone: "pine" },
});

export const PageTitle = styled("h1", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-title",
    fontWeight: "600",
    lineHeight: "1.25",
    wordBreak: "keep-all",
  },
});

export const ResultTitle = styled("h1", {
  base: {
    maxW: "22ch",
    fontFamily: "heading",
    fontSize: "kiosk-result",
    fontWeight: "600",
    lineHeight: "1.28",
    wordBreak: "keep-all",
  },
});

export const SectionTitle = styled("h2", {
  base: {
    fontFamily: "heading",
    fontSize: "1.5rem",
    fontWeight: "600",
    lineHeight: "1.3",
    wordBreak: "keep-all",
  },
});

export const CardTitle = styled("h2", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-question",
    fontWeight: "600",
    lineHeight: "1.35",
    wordBreak: "keep-all",
  },
});

export const BodyText = styled("p", {
  base: { fontFamily: "body", fontSize: "kiosk-body", lineHeight: "1.55" },
});

export const Caption = styled("p", {
  base: { fontFamily: "body", fontSize: "kiosk-caption", lineHeight: "1.45" },
});

export const MutedText = styled(Caption, {
  base: { color: "fg.muted" },
});

export const WarningText = styled("p", {
  base: {
    color: "seal.600",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    lineHeight: "1.45",
  },
});

export const StatusText = styled("p", {
  base: {
    color: "pine.700",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "600",
    lineHeight: "1.45",
  },
});

export const WarningBox = styled("p", {
  base: {
    px: "3",
    py: "2",
    borderWidth: "1px",
    borderColor: "seal.500",
    borderRadius: "l2",
    bg: "surface",
    color: "seal.600",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    lineHeight: "1.45",
  },
});

export const SecondaryTitle = styled("h2", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-question",
    fontWeight: "600",
    lineHeight: "1.4",
    wordBreak: "keep-all",
  },
});

export const MarkText = styled("p", {
  base: {
    color: "seal.600",
    fontFamily: "body",
    fontSize: "kiosk-mark",
    fontWeight: "800",
    lineHeight: "1",
  },
});

export const ReasonText = styled("p", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-body",
    lineHeight: "1.6",
    wordBreak: "keep-all",
  },
});
