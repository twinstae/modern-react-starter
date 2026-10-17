import { defineSemanticTokens } from "@pandacss/dev";

// trpg-stelo의 강조색(#8a2b22)에서 만든 벽돌색. 1~8단계는 바탕색에 강조색을 섞었다.
export const brick = defineSemanticTokens.colors({
  "1": { value: { _light: "#fefcfc", _dark: "#181413" } },
  "2": { value: { _light: "#fbf9f8", _dark: "#1d1514" } },
  "3": { value: { _light: "#f7f0f0", _dark: "#281816" } },
  "4": { value: { _light: "#f2e8e7", _dark: "#321a18" } },
  "5": { value: { _light: "#eddfde", _dark: "#3c1c19" } },
  "6": { value: { _light: "#e8d5d3", _dark: "#471f1b" } },
  "7": { value: { _light: "#dec4c1", _dark: "#57231e" } },
  "8": { value: { _light: "#cea6a2", _dark: "#722a23" } },
  "9": { value: { _light: "#8a2b22", _dark: "#b23a2e" } },
  "10": { value: { _light: "#74241d", _dark: "#c24538" } },
  "11": { value: { _light: "#8a2b22", _dark: "#e08a7e" } },
  "12": { value: { _light: "#3d130f", _dark: "#f6d3cd" } },
  a1: { value: { _light: "#8a2b2203", _dark: "#b23a2e0a" } },
  a2: { value: { _light: "#8a2b2208", _dark: "#b23a2e12" } },
  a3: { value: { _light: "#8a2b2212", _dark: "#b23a2e24" } },
  a4: { value: { _light: "#8a2b221c", _dark: "#b23a2e33" } },
  a5: { value: { _light: "#8a2b2226", _dark: "#b23a2e42" } },
  a6: { value: { _light: "#8a2b2233", _dark: "#b23a2e54" } },
  a7: { value: { _light: "#8a2b2247", _dark: "#b23a2e6e" } },
  a8: { value: { _light: "#8a2b226b", _dark: "#b23a2e99" } },
  a9: { value: { _light: "#8a2b22", _dark: "#b23a2e" } },
  a10: { value: { _light: "#74241d", _dark: "#c24538" } },
  a11: { value: { _light: "#8a2b22", _dark: "#e08a7e" } },
  a12: { value: { _light: "#3d130f", _dark: "#f6d3cd" } },
  solid: {
    bg: {
      DEFAULT: { value: { _light: "{colors.brick.9}", _dark: "{colors.brick.9}" } },
      hover: { value: { _light: "{colors.brick.10}", _dark: "{colors.brick.10}" } },
    },
    fg: { DEFAULT: { value: { _light: "white", _dark: "white" } } },
  },
  subtle: {
    bg: {
      DEFAULT: { value: { _light: "{colors.brick.a3}", _dark: "{colors.brick.a3}" } },
      hover: { value: { _light: "{colors.brick.a4}", _dark: "{colors.brick.a4}" } },
      active: { value: { _light: "{colors.brick.a5}", _dark: "{colors.brick.a5}" } },
    },
    fg: { DEFAULT: { value: { _light: "{colors.brick.a11}", _dark: "{colors.brick.a11}" } } },
  },
  surface: {
    bg: {
      DEFAULT: { value: { _light: "{colors.brick.a2}", _dark: "{colors.brick.a2}" } },
      active: { value: { _light: "{colors.brick.a3}", _dark: "{colors.brick.a3}" } },
    },
    border: {
      DEFAULT: { value: { _light: "{colors.brick.a6}", _dark: "{colors.brick.a6}" } },
      hover: { value: { _light: "{colors.brick.a7}", _dark: "{colors.brick.a7}" } },
    },
    fg: { DEFAULT: { value: { _light: "{colors.brick.a11}", _dark: "{colors.brick.a11}" } } },
  },
  outline: {
    bg: {
      hover: { value: { _light: "{colors.brick.a2}", _dark: "{colors.brick.a2}" } },
      active: { value: { _light: "{colors.brick.a3}", _dark: "{colors.brick.a3}" } },
    },
    border: { DEFAULT: { value: { _light: "{colors.brick.a7}", _dark: "{colors.brick.a7}" } } },
    fg: { DEFAULT: { value: { _light: "{colors.brick.a11}", _dark: "{colors.brick.a11}" } } },
  },
  plain: {
    bg: {
      hover: { value: { _light: "{colors.brick.a3}", _dark: "{colors.brick.a3}" } },
      active: { value: { _light: "{colors.brick.a4}", _dark: "{colors.brick.a4}" } },
    },
    fg: { DEFAULT: { value: { _light: "{colors.brick.a11}", _dark: "{colors.brick.a11}" } } },
  },
});
