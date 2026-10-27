import { styled } from "styled-system/jsx";

/** 왼쪽 목록과 오른쪽 내용의 2단. 좁은 화면에서는 목록이 위로 온다. */
export const SideLayout = styled("div", {
  base: {
    display: "grid",
    gap: "6",
    alignItems: "start",
    minW: "0",
    md: { gridTemplateColumns: "17rem minmax(0, 1fr)" },
  },
});

/** 왼쪽 목록. 넓은 화면에서는 스크롤해도 따라온다. */
export const SideNav = styled("nav", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "1",
    minW: "0",
    md: { position: "sticky", top: "4" },
  },
});

/**
 * 왼쪽 목록의 항목. 다른 페이지로 가는 링크라 화살표와 hover로 누를 수 있음을 보이고,
 * 지금 페이지는 `aria-current="page"`로만 표시한다. 라우터 링크는 `createLink`로 만든다.
 */
export const SideNavItem = styled("a", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2",
    minH: "12",
    px: "3",
    py: "2",
    borderWidth: "2px",
    borderColor: "transparent",
    borderRadius: "l2",
    color: "fg.default",
    fontFamily: "body",
    textDecoration: "none",
    cursor: "pointer",
    _hover: { bg: "paper.100", borderColor: "paper.300" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "2px" },
    _after: { content: '"›"', ml: "auto", color: "fg.muted", fontSize: "xl" },
    '&[aria-current="page"]': { bg: "yellow.100", borderColor: "border" },
  },
});

/** 항목 이름 아래의 작은 설명. */
export const SideNavMeta = styled("span", {
  base: { display: "block", color: "fg.muted", fontSize: "sm" },
});
