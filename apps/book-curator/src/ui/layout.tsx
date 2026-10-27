import { styled } from "styled-system/jsx";

/** 세로로 쌓는 기본 틀. 페이지는 gap과 정렬만 고른다. */
export const Stack = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "4", minW: "0" },
});

/** 화면 안의 한 구역. 제목과 내용을 세로로 묶는다. */
export const Section = styled("section", {
  base: { display: "flex", flexDirection: "column", gap: "3", minW: "0" },
});

/** 가로로 나란히 두는 기본 틀. */
export const Row = styled("div", {
  base: { display: "flex", alignItems: "center", gap: "3", minW: "0" },
});

/** 화면·패널의 머리말. 기본은 아래 테두리가 있고, 필요하면 끈다. */
export const PageHeader = styled("header", {
  base: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "4",
    flexWrap: "wrap",
    pb: "3",
    borderBottomWidth: "2px",
    borderColor: "border",
  },
  variants: {
    divider: { false: { pb: "0", borderBottomWidth: "0" } },
    align: {
      end: { alignItems: "flex-end" },
      center: { alignItems: "center" },
      baseline: { alignItems: "baseline" },
    },
  },
  defaultVariants: { divider: true, align: "end" },
});

/** 카드 안의 머리말. 제목과 표시를 양끝에 둔다. */
export const CardHeader = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "2",
    minW: "0",
  },
  variants: {
    divider: { true: { pb: "2", borderBottomWidth: "1px", borderColor: "paper.300" } },
  },
  defaultVariants: { divider: false },
});

/** 내용 폭에 맞춰 자동으로 열이 늘어나는 격자. */
export const AutoGrid = styled("div", {
  base: { display: "grid", gap: "4", minW: "0" },
  variants: {
    min: {
      sm: { gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))" },
      md: { gridTemplateColumns: "repeat(auto-fit, minmax(19rem, 1fr))" },
      lg: { gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))" },
    },
  },
  defaultVariants: { min: "md" },
});

/** 열 수를 고정하는 격자. 좁은 화면에서는 한 열로 접힌다. */
export const Grid = styled("div", {
  base: { display: "grid", gap: "4", minW: "0" },
  variants: {
    columns: {
      one: {},
      two: { md: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } },
      three: {
        md: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
        lg: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
      },
    },
  },
  defaultVariants: { columns: "one" },
});

/** 주인 화면처럼 큰 카드와 작은 곁가지를 나누는 2단. */
export const Split = styled("div", {
  base: {
    display: "grid",
    gap: "4",
    alignItems: "start",
    minW: "0",
    lg: { gridTemplateColumns: "minmax(0, 1.25fr) minmax(18rem, 0.75fr)" },
  },
});

/** 목록의 기본 틀. 불릿·여백을 지우고 열 수만 고른다. */
export const List = styled("ul", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2",
    m: "0",
    p: "0",
    listStyle: "none",
    minW: "0",
  },
  variants: {
    layout: {
      column: {},
      two: { md: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } },
      three: {
        md: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
        lg: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
      },
    },
  },
  defaultVariants: { layout: "column" },
});

/** 목록 한 줄. 양끝 정렬이 기본이고, 필요하면 baseline으로 맞춘다. */
export const ListItem = styled("li", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "2",
    minW: "0",
  },
  variants: {
    align: {
      center: {},
      baseline: { alignItems: "baseline" },
      start: { alignItems: "flex-start" },
    },
    bordered: { true: { pb: "2", borderBottomWidth: "1px", borderColor: "paper.200" } },
  },
  defaultVariants: { align: "center" },
});

/** 버튼 줄. 기본은 오른쪽 정렬, 필요하면 양끝·가운데·세로로 둔다. */
export const Actions = styled("div", {
  base: { display: "flex", alignItems: "center", gap: "3", flexWrap: "wrap" },
  variants: {
    align: {
      end: { justifyContent: "flex-end" },
      between: { justifyContent: "space-between" },
      center: { justifyContent: "center" },
    },
    direction: {
      row: {},
      column: { flexDirection: "column", alignItems: "stretch" },
    },
    divider: { true: { pt: "3", borderTopWidth: "2px", borderColor: "border" } },
  },
  defaultVariants: { align: "end", direction: "row" },
});

/** 수량·표시·상태처럼 짧은 값을 알약 모양으로 보여 준다. */
export const Badge = styled("span", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    flexShrink: "0",
    px: "2",
    py: "0.5",
    borderRadius: "l2",
    bg: "paper.100",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
  },
  variants: {
    tone: {
      neutral: {},
      pine: { bg: "transparent", color: "pine.700" },
      seal: {
        alignSelf: "flex-start",
        bg: "surface",
        borderWidth: "2px",
        borderColor: "seal.500",
        color: "seal.600",
        fontWeight: "800",
        letterSpacing: "0.08em",
      },
    },
  },
  defaultVariants: { tone: "neutral" },
});

/** 안내 문장 상자. 주인 화면처럼 배경과 테두리로 구분할 때 쓴다. */
export const InfoBox = styled("p", {
  base: {
    p: "3",
    borderWidth: "2px",
    borderColor: "pine.500",
    borderRadius: "l2",
    bg: "surface",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
  },
});

/** 접어 두는 상세. 기본은 위쪽 구분선만, `boxed`는 카드처럼 감싼다. */
export const Disclosure = styled("details", {
  base: { borderTopWidth: "1px", borderColor: "paper.300", pt: "2" },
  variants: {
    boxed: {
      true: {
        p: "4",
        borderWidth: "1px",
        borderColor: "paper.300",
        borderRadius: "l2",
        bg: "surface",
      },
    },
  },
});

export const DisclosureSummary = styled("summary", {
  base: {
    cursor: "pointer",
    color: "pine.700",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "2px" },
  },
});
