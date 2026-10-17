import { green } from "./src/theme/colors/green";
import { red } from "./src/theme/colors/red";
import { mauve } from "./src/theme/colors/mauve";
import { blue } from "./src/theme/colors/blue";
import { olive } from "./src/theme/colors/olive";
import { tomato } from "./src/theme/colors/tomato";
import { amber } from "./src/theme/colors/amber";
import { iris } from "./src/theme/colors/iris";
import { brown } from "./src/theme/colors/brown";
import { aliasPalette } from "./src/theme/colors/alias-palette";
import { animationStyles } from "./src/theme/animation-styles";
import { zIndex } from "./src/theme/tokens/z-index";
import { shadows } from "./src/theme/tokens/shadows";
import { durations } from "./src/theme/tokens/durations";
import { colors } from "./src/theme/tokens/colors";
import { textStyles } from "./src/theme/text-styles";
import { layerStyles } from "./src/theme/layer-styles";
import { keyframes } from "./src/theme/keyframes";
import { globalCss } from "./src/theme/global-css";
import { conditions } from "./src/theme/conditions";
import { slotRecipes, recipes } from "./src/theme/recipes";
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Panda v2는 기본 preset을 자동으로 추가하지 않으므로 명시해야 한다.
  // (v1은 eject가 아니면 항상 preset-base/preset-panda를 추가했음)
  // preset-panda가 기본 breakpoints(sm, md, lg, xl, 2xl)와 토큰을 제공한다.
  presets: ["@pandacss/preset-base", "@pandacss/preset-panda"],

  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      animationStyles: animationStyles,
      recipes: recipes,
      slotRecipes: slotRecipes,
      keyframes: keyframes,
      layerStyles: layerStyles,
      textStyles: textStyles,

      tokens: {
        colors: colors,
        durations: durations,
        zIndex: zIndex,
      },

      semanticTokens: {
        colors: {
          fg: {
            default: {
              value: {
                _light: "{colors.gray.12}",
                _dark: "{colors.gray.12}",
              },
            },

            muted: {
              value: {
                _light: "{colors.gray.11}",
                _dark: "{colors.gray.11}",
              },
            },

            subtle: {
              value: {
                _light: "{colors.gray.10}",
                _dark: "{colors.gray.10}",
              },
            },
          },

          border: {
            value: {
              _light: "{colors.gray.4}",
              _dark: "{colors.gray.4}",
            },
          },

          error: {
            value: {
              _light: "{colors.red.9}",
              _dark: "{colors.red.9}",
            },
          },

          // 레시피의 기본 colorPalette. 테마는 이 별칭이 가리키는 팔레트를 바꾼다.
          accent: aliasPalette("gray"),
          blue: blue,
          gray: mauve,
          red: red,
          green: green,
          // 테마에서 고를 수 있는 팔레트 (ticket 18)
          olive: olive,
          tomato: tomato,
          amber: amber,
          iris: iris,
          brown: brown,
        },

        shadows: shadows,

        // 테마가 글꼴을 바꿀 수 있도록 전역 CSS는 이 토큰만 쓴다.
        fonts: {
          body: { value: "{fonts.sans}" },
          heading: { value: "{fonts.body}" },
        },

        radii: {
          l1: {
            value: "{radii.sm}",
          },

          l2: {
            value: "{radii.md}",
          },

          l3: {
            value: "{radii.lg}",
          },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
  jsxFramework: "react",
  globalCss: globalCss,
  conditions: conditions,
});
