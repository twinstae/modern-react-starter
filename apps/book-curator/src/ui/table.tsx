import { styled } from "styled-system/jsx";

/** 운영 화면의 데이터 표. 좁은 화면에서는 가로로 스크롤한다. */
export const Table = styled("table", {
  base: {
    width: "full",
    minW: "48rem",
    borderCollapse: "collapse",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    textAlign: "left",
  },
});

export const Th = styled("th", {
  base: {
    px: "3",
    py: "3",
    borderBottomWidth: "2px",
    borderColor: "border",
    color: "pine.700",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
});

export const Td = styled("td", {
  base: {
    px: "3",
    py: "3",
    borderBottomWidth: "1px",
    borderColor: "paper.300",
    verticalAlign: "top",
    overflowWrap: "anywhere",
  },
});
