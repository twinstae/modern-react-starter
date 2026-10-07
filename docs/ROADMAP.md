# 로드맵

[REQUEST.md](REQUEST.md)의 세 가지 가치(모범 사례, 표준 개발 도구, AI와 인간의 개발 흐름)를 기준으로 남은 과제를 정리한다.
SOLO QUEST(`apps/solo-quest`, 예정)는 이 과제를 실제로 부딪혀 보는 실험장이다. 거기서 배운 것은 회고를 거쳐 별도의 단계로 템플릿에 옮긴다.

## 0. 정리 (qr-quest 잔재)

- [ ] demo 의존성 정리: `@aws-sdk/*`, `@yudiel/react-qr-scanner`, `qrcode.react`, `@faker-js/faker`, `pg`/`postgres` 중복
- [ ] `src/fakes/react-qr-scanner.fake.tsx` 제거, 빈 `fake-aliases.ts`는 첫 실제 사례가 생길 때 다시 채운다
- [ ] `drizzle.config.ts`, `vite.config.ts` server 프로젝트가 가리키는 존재하지 않는 경로(`src/persistence` 등) 정리
- [ ] `ExapmleForm.tsx` 오타, ui `index.ts`에서 빠진 `Dialog` export
- [ ] demo 테스트의 `ReferenceError: module is not defined` 원인 찾기
- [ ] `bun run format`이 `docs/*.md`의 코드 블록 밖 예시를 망가뜨리는 문제 (코드 펜스 또는 ignore)

## 1. 코드 모범 사례

레이어마다 "이렇게 한다"를 보여 주는 최소한의 예시와, 그 결정의 이유(ADR)를 남긴다.

- [ ] **도메인 / 순수 로직**: DB 없이 테스트하는 순수 함수와 모듈 (SOLO QUEST의 이벤트 reducer가 첫 사례)
- [ ] **영속화**: drizzle + postgres, 테스트와 로컬 개발은 PGlite. 마이그레이션 흐름
- [ ] **API**: elysia + eden, TanStack Start와 어떻게 나누어 붙이는지
- [ ] **인증**: better-auth
- [ ] **클라이언트 상태와 서버 상태**: TanStack Query의 query option 관리 규칙, jotai / bunja의 역할 분담
- [ ] **폼**: react-hook-form + valibot(standard schema) — `SimpleForm` 패턴 확장
- [ ] **시간**: Temporal 사용 규칙 (Instant / PlainDateTime 구분)
- [ ] **의존성 바꿔 끼우기**: `vi.mock` 금지(lint로 강제 중) 대신 props 주입과 `*.fake.ts` alias. 실제 예시 하나
- [ ] **E2E**: DB를 직접 건드리지 않는 E2E 테스트 패턴
- [ ] **디자인 시스템**: 새 컴포넌트를 추가하는 절차 (park-ui `components.json` 정리 포함), 앱에서 테마를 확장하는 예

## 2. 표준 개발 도구

- [x] 모노레포: bun workspaces + Turborepo, Panda v2 `designSystem`
- [x] oxlint, oxfmt, TypeScript 7, vitest browser mode, Storybook
- [ ] jscpd (중복 코드) — SOLO QUEST TICKET-00007 이후 도입
- [ ] nose (https://github.com/corca-ai/nose) — SOLO QUEST TICKET-00007 이후 도입
- [ ] deprecated API 사용 검출: oxlint `typescript/no-deprecated`는 타입 정보가 필요하다 (type-aware linting 설정). SOLO QUEST에서 deprecated된 `ensureQueryData`를 lint가 잡지 못했다
- [ ] CI 워크플로 (turbo `--affected`, 캐시)
- [ ] 새 앱/패키지를 추가하는 절차 (예: `apps/solo-quest`)

## 3. AI와 인간의 개발 흐름

- [ ] `AGENTS.md`: 레포 구조, 명령, 레이어 규칙 (지금은 turbo 안내 블록만 있다)
- [ ] `CONTEXT.md` / ADR: 도메인 용어와 결정 기록 (`domain-modeling` 스킬)
- [ ] 회고 루프: 기능 하나를 끝낼 때마다 배운 것을 AGENTS.md / SKILL.md에 반영
- [ ] 평가 실험: 같은 과제를 과거 브랜치에서 다른 지침으로 다시 만들어 비교 (예: turbo ↔ Vite+, 지침 변경 전후)
- [ ] 작은 일을 sub agent에 맡기는 패턴과 그 결과 검증
