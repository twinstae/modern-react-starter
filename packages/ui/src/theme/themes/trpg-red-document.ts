// 앱 번들에 들어가는 쪽. 테마 정의(trpg-red.ts)는 @pandacss/dev를 불러오므로 따로 둔다.
export const trpgRedDocument = {
  // <html>에 붙이면 staticCss로 만든 테마 변수가 적용된다.
  attributes: { "data-panda-theme": "trpg-red" },
  // Pretendard는 쓰는 글자만 받는 동적 서브셋 CSS로 불러온다.
  stylesheets: [
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
  ],
} as const;
