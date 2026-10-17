import { defineSemanticTokens } from "@pandacss/dev";

/**
 * 레시피가 colorPalette로 쓰는 변형(solid, subtle, surface, outline, plain)을 다른 팔레트로 넘긴다.
 * 테마는 이 별칭이 가리키는 팔레트만 바꿔서 강조색을 바꾼다.
 */
export const aliasPalette = (name: string) => {
  const ref = (path: string) => ({ value: `{colors.${name}.${path}}` });

  return defineSemanticTokens.colors({
    solid: {
      bg: { DEFAULT: ref("solid.bg"), hover: ref("solid.bg.hover") },
      fg: { DEFAULT: ref("solid.fg") },
    },
    subtle: {
      bg: {
        DEFAULT: ref("subtle.bg"),
        hover: ref("subtle.bg.hover"),
        active: ref("subtle.bg.active"),
      },
      fg: { DEFAULT: ref("subtle.fg") },
    },
    surface: {
      bg: { DEFAULT: ref("surface.bg"), active: ref("surface.bg.active") },
      border: { DEFAULT: ref("surface.border"), hover: ref("surface.border.hover") },
      fg: { DEFAULT: ref("surface.fg") },
    },
    outline: {
      bg: { hover: ref("outline.bg.hover"), active: ref("outline.bg.active") },
      border: { DEFAULT: ref("outline.border") },
      fg: { DEFAULT: ref("outline.fg") },
    },
    plain: {
      bg: { hover: ref("plain.bg.hover"), active: ref("plain.bg.active") },
      fg: { DEFAULT: ref("plain.fg") },
    },
  });
};
