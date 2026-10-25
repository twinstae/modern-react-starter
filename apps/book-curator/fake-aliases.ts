/**
 * 컴포넌트 테스트와 Storybook에서 진짜 대신 연결하는 가짜 구현체.
 * vi.mock 대신 모듈 해석 단계에서 바꿔 끼운다 (lint: vitest/no-restricted-vi-methods).
 *
 * 표시용 컴포넌트가 라우터나 저장소를 가져오기 시작하면 여기에 `*.fake.ts`를 연결한다.
 */
export const fakeAliases: { find: RegExp | string; replacement: string }[] = [];
