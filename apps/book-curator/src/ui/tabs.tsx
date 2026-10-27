import { styled } from "styled-system/jsx";

export const TabList = styled("div", {
  base: {
    display: "flex",
    gap: "2",
    mt: "5",
    pb: "2",
    borderBottomWidth: "2px",
    borderColor: "border",
  },
});

/**
 * 운영 화면의 탭. 탭마다 다른 페이지라 링크다. 지금 페이지는 `aria-current="page"`로만
 * 표현해 스크린리더와 화면이 같은 값을 본다. 라우터 링크는 `createLink(Tab)`으로 만든다.
 */
export const Tab = styled("a", {
  base: {
    minH: "11",
    px: "4",
    borderWidth: "2px",
    borderColor: "transparent",
    borderRadius: "l2",
    bg: "transparent",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-body",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    cursor: "pointer",
    _hover: { bg: "paper.100" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "2px" },
    '&[aria-current="page"]': {
      borderColor: "border",
      bg: "yellow.100",
      color: "fg.default",
      boxShadow: "zine",
    },
  },
});
