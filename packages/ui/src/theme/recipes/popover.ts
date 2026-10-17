import { popoverAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

/** park-ui의 popover 레시피를 이 디자인 시스템의 토큰과 Panda 2에 맞춘 것 */
export const popover = defineSlotRecipe({
  className: "popover",
  // size는 앱이 Popover.Root에 prop으로 넘긴다. Panda가 정적으로 찾지 못해도 CSS가 나오게 모두 뽑는다.
  staticCss: [{ size: ["*"] }],
  slots: popoverAnatomy.keys(),
  base: {
    // z-index를 쓰지 않는다. 떠 있는 층은 열 때 body 끝에 붙으므로 나중에 연 층이 위에 그려진다.
    positioner: {},
    content: {
      display: "flex",
      flexDirection: "column",
      gap: "1",
      p: "4",
      bg: "gray.surface.bg",
      borderRadius: "l3",
      boxShadow: "lg",
      // 폭은 size로 고르고, 좁은 화면에서는 화면 안에 들어오게 줄어든다
      maxWidth: "calc(100vw - 2rem)",
      // 화면 아래가 좁으면 넘치지 않고 안에서 스크롤한다
      maxHeight: "var(--available-height)",
      overflowY: "auto",
      outline: "0",
      _open: {
        animationStyle: "slide-fade-in",
        animationDuration: "fast",
      },
      _closed: {
        animationStyle: "slide-fade-out",
        animationDuration: "faster",
      },
    },
    title: {
      textStyle: "sm",
      fontWeight: "semibold",
    },
    description: {
      textStyle: "sm",
      color: "fg.muted",
    },
    closeTrigger: {
      position: "absolute",
      top: "2",
      insetEnd: "2",
      color: "fg.muted",
      _hover: { color: "fg.default" },
    },
    arrow: {
      "--arrow-size": "sizes.3",
      "--arrow-background": "colors.gray.surface.bg",
    },
    arrowTip: {
      borderTopWidth: "1px",
      borderInlineStartWidth: "1px",
      borderColor: "border",
    },
  },
  variants: {
    size: {
      sm: { content: { width: "xs" } },
      /** 긴 식이나 여러 칸처럼 넓은 내용 */
      md: { content: { width: "md" } },
    },
  },
  defaultVariants: { size: "sm" },
});
