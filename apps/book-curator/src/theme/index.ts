/**
 * 책방79-1의 실제 가게에서 가져온 테마. 초록 간판, 노란 벽, 나무와 종이, 빨간 스탬프.
 * 공용 디자인 시스템을 다시 만들지 않고, 이 앱에서만 색·글꼴·태블릿 기준 크기를 덧붙인다.
 */
export const bookCuratorTheme = {
  extend: {
    tokens: {
      colors: {
        paper: {
          50: { value: "#fbf9f4" },
          100: { value: "#f4efe5" },
          200: { value: "#e9e1d2" },
          300: { value: "#d8ccb8" },
        },
        ink: {
          700: { value: "#4b564f" },
          800: { value: "#2a362f" },
          900: { value: "#18231d" },
        },
        pine: {
          500: { value: "#1f5a45" },
          600: { value: "#174634" },
          700: { value: "#103528" },
        },
        seal: {
          500: { value: "#c4473a" },
          600: { value: "#a6362b" },
        },
        yellow: {
          100: { value: "#fbeab8" },
          500: { value: "#f2c94c" },
        },
      },
      fonts: {
        heading: {
          value: ['"Noto Serif KR"', '"Nanum Myeongjo"', '"Apple SD Gothic Neo"', "serif"],
        },
        body: {
          value: [
            '"Noto Sans KR"',
            '"Pretendard Variable"',
            "Pretendard",
            '"Apple SD Gothic Neo"',
            "sans-serif",
          ],
        },
      },
      fontSizes: {
        "kiosk-caption": { value: "1rem" },
        "kiosk-body": { value: "1.25rem" },
        "kiosk-question": { value: "clamp(2.25rem, 3.8vw, 3rem)" },
        "kiosk-result": { value: "clamp(2rem, 3.4vw, 3rem)" },
        "kiosk-title": { value: "clamp(2.25rem, 4vw, 3.5rem)" },
        "kiosk-scale": { value: "1.25rem" },
        "kiosk-scale-number": { value: "2.25rem" },
        "kiosk-mark": { value: "clamp(1.75rem, 3vw, 2.5rem)" },
      },
      spacing: {
        page: { value: "clamp(1.5rem, 4vw, 3rem)" },
      },
      radii: {
        l1: { value: "0" },
        l2: { value: "2px" },
        l3: { value: "4px" },
      },
      shadows: {
        zine: { value: "4px 4px 0 {colors.ink.900}" },
        zineLg: { value: "6px 6px 0 {colors.ink.900}" },
      },
    },
    semanticTokens: {
      colors: {
        canvas: { value: "{colors.paper.50}" },
        surface: { value: "#fffefa" },
        fg: {
          default: { value: "{colors.ink.900}" },
          muted: { value: "{colors.ink.700}" },
        },
        border: { value: "{colors.ink.900}" },
      },
      fonts: {
        body: {
          value: [
            '"Noto Sans KR"',
            '"Pretendard Variable"',
            "Pretendard",
            '"Apple SD Gothic Neo"',
            "sans-serif",
          ],
        },
        heading: {
          value: ['"Noto Serif KR"', '"Nanum Myeongjo"', '"Apple SD Gothic Neo"', "serif"],
        },
      },
    },
  },
};
