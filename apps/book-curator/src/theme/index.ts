/**
 * 책방79-1의 종이·잉크 테마. 공용 디자인 시스템을 다시 만들지 않고, 이 앱에서만
 * 색·글꼴·태블릿 기준 크기를 덧붙인다.
 */
export const bookCuratorTheme = {
  extend: {
    tokens: {
      colors: {
        paper: {
          50: { value: "#f8f3e8" },
          100: { value: "#f1e9d8" },
          200: { value: "#e7dcc5" },
          300: { value: "#d6c6a9" },
        },
        ink: {
          700: { value: "#4b4339" },
          800: { value: "#332c25" },
          900: { value: "#211c17" },
        },
        seal: {
          500: { value: "#8a4b32" },
          600: { value: "#713b27" },
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
        "kiosk-question": { value: "2rem" },
        "kiosk-title": { value: "2.5rem" },
        "kiosk-result": { value: "3.25rem" },
        "kiosk-mark": { value: "2.5rem" },
        "kiosk-scale": { value: "1.375rem" },
      },
      spacing: {
        page: { value: "2.5rem" },
        "page-wide": { value: "4rem" },
      },
    },
    semanticTokens: {
      colors: {
        canvas: { value: "{colors.paper.50}" },
        fg: {
          default: { value: "{colors.ink.900}" },
          muted: { value: "{colors.ink.700}" },
        },
        border: { value: "{colors.paper.300}" },
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
