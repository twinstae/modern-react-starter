import { defineGlobalFontface, defineThemeVariant } from "@pandacss/dev";

import { aliasPalette } from "../colors/alias-palette";
import { steloGray } from "../colors/stelo-gray";

/**
 * trpg-stelo 사이트의 색, 글꼴, 모서리를 따른 테마.
 * 앱은 staticCss.themes에 이름을 넣고, 런타임에 필요한 것은 trpg-red-document.ts에서 가져간다.
 */
export const trpgRed = defineThemeVariant({
  semanticTokens: {
    colors: {
      accent: aliasPalette("brick"),
      gray: steloGray,
      // trpg-stelo의 --rule
      border: { value: { _light: "{colors.gray.6}", _dark: "{colors.gray.6}" } },
    },

    fonts: {
      body: {
        value: [
          '"Pretendard Variable"',
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          '"Segoe UI"',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          "sans-serif",
        ],
      },
      heading: { value: ['"MaruBuri"', '"Noto Serif KR"', "serif"] },
    },

    // 사이트의 버튼과 입력은 각지고, 시트의 상자만 살짝 둥글다.
    radii: {
      l1: { value: "0" },
      l2: { value: "0" },
      l3: { value: "{radii.xs}" },
    },
  },
});

// 제목용 마루부리. 테마를 쓰지 않는 앱에서는 아무도 쓰지 않으니 내려받지 않는다.
const maruBuri = (fontWeight: number, file: string) => ({
  src: `url(https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-${file}.woff2) format("woff2")`,
  fontWeight,
  fontDisplay: "swap" as const,
});

export const trpgRedFontface = defineGlobalFontface({
  MaruBuri: [
    maruBuri(200, "ExtraLight"),
    maruBuri(300, "Light"),
    maruBuri(400, "Regular"),
    maruBuri(500, "SemiBold"),
    maruBuri(600, "Bold"),
  ],
});
