import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // 토큰·레시피·전역 스타일은 디자인 시스템 패키지가 소유한다.
  // 앱에서 확장한 것만 로컬 styled-system에 생성되고 나머지는 @repo/ui에서 다시 내보낸다.
  designSystem: "@repo/ui",
  include: ["./src/**/*.{ts,tsx}"],
  outdir: "styled-system",
});
