// import { fileURLToPath } from "node:url";

/**
 * 브라우저 테스트·Storybook에서 진짜 대신 연결하는 가짜 구현체.
 * vi.mock 대신 모듈 해석 단계에서 바꿔 끼운다 (lint: vitest/no-restricted-vi-methods).
 */
// const fake = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export const fakeAliases = [];
