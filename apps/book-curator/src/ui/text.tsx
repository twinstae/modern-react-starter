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

/** 작은 제목. 카드 안에서 큰 제목 아래 단계로 쓴다. */
export const SubTitle = styled("h3", {
  base: { fontFamily: "body", fontSize: "kiosk-body", fontWeight: "700", lineHeight: "1.35" },
});

/** 인용. 손님이 실제로 한 답을 노란 선으로 표시한다. */
export const Citation = styled("blockquote", {
  base: {
    m: "0",
    pl: "3",
    borderLeftWidth: "4px",
    borderColor: "yellow.500",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-body",
    lineHeight: "1.55",
    textAlign: "left",
  },
});

/** 문단 안에서 쓰는 작은 글자. 제목·저자·비율처럼 한 줄에 섞일 때 쓴다. */
export const InlineText = styled("span", {
  base: { fontFamily: "body", fontSize: "kiosk-caption", wordBreak: "keep-all" },
  variants: {
    tone: {
      default: {},
      muted: { color: "fg.muted" },
      pine: { color: "pine.700" },
      seal: { color: "seal.600" },
    },
    weight: {
      normal: {},
      strong: { fontWeight: "700" },
      extra: { fontWeight: "800" },
    },
  },
  defaultVariants: { tone: "default", weight: "normal" },
});
