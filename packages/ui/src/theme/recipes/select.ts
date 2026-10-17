import { selectAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const select = defineSlotRecipe({
  className: "select",
  slots: selectAnatomy.keys(),
  base: {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5",
      width: "full",
    },
    label: {
      color: "fg.default",
      textAlign: "start",
      textStyle: "label",
      userSelect: "none",
      _disabled: {
        layerStyle: "disabled",
      },
    },
    control: {
      position: "relative",
    },
    trigger: {
      appearance: "none",
      alignItems: "center",
      borderRadius: "l2",
      borderWidth: "1px",
      borderColor: "gray.outline.border",
      cursor: "pointer",
      display: "inline-flex",
      gap: "2",
      justifyContent: "space-between",
      minHeight: "var(--select-height)",
      outline: "0",
      px: "3",
      textAlign: "start",
      transition: "colors",
      width: "full",
      focusVisibleRing: "inside",
      _invalid: {
        borderColor: "error",
        focusRingColor: "error",
      },
      _disabled: {
        layerStyle: "disabled",
        cursor: "not-allowed",
      },
    },
    valueText: {
      lineClamp: "1",
      _placeholderShown: {
        color: "fg.muted",
      },
    },
    indicator: {
      color: "fg.muted",
      flexShrink: "0",
      _icon: {
        boxSize: "4",
      },
    },
    positioner: {
      // z-index를 쓰지 않는다. 열 때 body 끝에 붙어, 팝오버나 대화 상자 안에서 열어도 그 위에 그려진다.
      width: "var(--reference-width)",
    },
    content: {
      bg: "gray.surface.bg",
      borderRadius: "l2",
      borderWidth: "1px",
      borderColor: "gray.outline.border",
      boxShadow: "lg",
      display: "flex",
      flexDirection: "column",
      maxHeight: "96",
      outline: "0",
      overflowY: "auto",
      p: "1",
      _open: {
        animationName: "fade-in",
        animationDuration: "fast",
      },
      _closed: {
        animationName: "fade-out",
        animationDuration: "faster",
      },
    },
    item: {
      alignItems: "center",
      borderRadius: "l1",
      cursor: "pointer",
      display: "flex",
      gap: "2",
      justifyContent: "space-between",
      px: "2",
      py: "1.5",
      textStyle: "md",
      _highlighted: {
        bg: "gray.subtle.bg",
      },
      _disabled: {
        layerStyle: "disabled",
        cursor: "not-allowed",
      },
    },
    itemIndicator: {
      _icon: {
        boxSize: "4",
      },
    },
    itemGroupLabel: {
      color: "fg.muted",
      px: "2",
      py: "1.5",
      textStyle: "sm",
    },
  },
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      sm: { root: { "--select-height": "sizes.9" }, trigger: { textStyle: "sm" } },
      md: { root: { "--select-height": "sizes.10" }, trigger: { textStyle: "md" } },
      lg: { root: { "--select-height": "sizes.11" }, trigger: { textStyle: "md" } },
    },
  },
});
