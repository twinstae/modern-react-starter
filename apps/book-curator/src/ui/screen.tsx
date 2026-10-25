import { styled } from "styled-system/jsx";

/**
 * 책방 화면의 공통 껍데기. 색·최소 높이·상단 띠만 소유하고, 배치( flex/grid )는
 * 화면이 정한다. 고객 화면은 노란 띠, 주인 모드는 빨간 띠로 구분한다.
 */
export const Screen = styled("main", {
  base: {
    minH: "100dvh",
    bg: "canvas",
    color: "fg.default",
  },
  variants: {
    tone: {
      customer: { borderTopWidth: "8px", borderTopColor: "yellow.500" },
      owner: { borderTopWidth: "8px", borderTopColor: "seal.500" },
      none: {},
    },
  },
  defaultVariants: { tone: "customer" },
});
