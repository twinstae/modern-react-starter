import { styled } from "styled-system/jsx";

/**
 * 종이 카드. `paper`는 결과·서랍 카드, `flat`은 운영 화면의 반복 카드,
 * `owner`는 주인 확인의 강조 카드다. 레이아웃은 화면이 정한다.
 */
export const Card = styled("article", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
    minW: "0",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    color: "fg.default",
    textAlign: "left",
  },
  variants: {
    tone: {
      paper: { p: "5", boxShadow: "zine" },
      flat: { p: "4", borderWidth: "1px", borderColor: "paper.300", boxShadow: "none" },
      owner: { p: "4", borderWidth: "3px", borderColor: "seal.500", boxShadow: "zine" },
      bare: { p: "0", borderWidth: "0", bg: "transparent", boxShadow: "none" },
    },
    padding: {
      sm: { p: "3" },
      md: { p: "5" },
      lg: { p: "6" },
    },
  },
  defaultVariants: { tone: "paper" },
});
