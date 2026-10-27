import { styled } from "styled-system/jsx";

/**
 * 파일을 끌어 놓거나 눌러서 고르는 자리. 안의 파일 입력을 감싸는 label이라 어디를 눌러도
 * 파일 고르기가 열린다. 끌어 오는 동안은 `data-dragging`으로 테두리를 바꾼다.
 */
export const DropZone = styled("label", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    minH: "36",
    px: "6",
    py: "8",
    borderWidth: "2px",
    borderStyle: "dashed",
    borderColor: "paper.300",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    textAlign: "center",
    cursor: "pointer",
    _hover: { borderColor: "pine.600", bg: "paper.100" },
    _focusWithin: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "2px" },
    '&[data-dragging="true"]': { borderColor: "pine.600", bg: "yellow.100" },
  },
});
