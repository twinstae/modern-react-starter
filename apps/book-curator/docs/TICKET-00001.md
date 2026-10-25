# TICKET-00001: 앱 뼈대, 테스트 단계, 속성 기반 검사 도구, 용어와 ADR

- 스펙: [TECH_SPEC](TECH_SPEC.md) §3, §4.1, §2.3, §3.7
- Blocked by: 없음
- Status: todo

## 만들 것

`@repo/book-curator` 앱을 만든다. `bun run dev`로 띄우면 첫 화면이 eden으로 `/api/health`를 불러 응답을 보여 준다.
이후 티켓이 바로 쓰도록 세 테스트 단계(domain, api, component)와 fast-check, 디렉터리 골격, 용어 문서를 갖춘다.

## 알아야 할 것

- `apps/solo-quest`의 설정을 출발점으로 한다: TanStack Start SPA, vite, tsconfig, panda `designSystem: "@repo/ui"`, Storybook, vitest projects, `fake-aliases.ts`, `setupTest.ts`.
  solo-quest TICKET-00001의 "작업하며 배운 것"(preset 직접 의존, `tsr generate` 금지, Storybook `viteFinal`에서 Start/nitro 플러그인 제거)을 먼저 읽는다.
- 포트는 demo·solo-quest와 겹치지 않게 한다(예: 3002, Storybook 6008).
- 디렉터리는 TECH_SPEC §3.2를 따른다. 이번 티켓은 `domain/ application/ persistence/ server/ components/ routes/`의 빈 골격과 예시 하나씩만.
  - `domain` 프로젝트 include: `src/domain/**`, `src/application/**`, `src/persistence/**`
- `createApp(deps)`는 의존성을 인자로 받는 팩토리다. `server/test-client.ts`는 메모리 의존성으로 앱을 만들고 `createApiClient(app)`을 돌려준다.
- `fast-check`를 루트 `catalog`에 더하고 앱 devDependency로 쓴다. 예시 속성 테스트 하나를 domain 프로젝트에 둔다.
- Storybook에 태블릿 뷰포트(세로·가로)를 기본으로 등록한다. 이 앱의 기본 화면은 태블릿이다.
- 앱 테마 확장 자리(`src/theme/`)를 만든다. 색·글꼴 결정은 TICKET-00006에서 한다.
- `CONTEXT.md`(TECH_SPEC §2.3 용어)와 ADR 다섯 개(§3.7)를 `mattpocock-skills:domain-modeling` 형식으로 쓴다. 루트 `CONTEXT-MAP.md`, `README.md` 구조 단락에 앱을 더한다.

## 인수 조건

- [x] 루트 `bun run dev`로 book-curator가 다른 앱과 겹치지 않는 포트로 뜨고, 첫 화면에 health 응답이 보인다.
  - 앱 단독 `bun run dev`(포트 3002)로 확인했다. 루트 `bun run dev`는 모든 앱을 함께 띄우므로 이번에는 돌리지 않았다.
- [x] `domain` 프로젝트에 예시 단위 테스트와 fast-check 속성 테스트가 하나씩 있고 통과한다.
- [x] `api` 프로젝트에 test-client로 `/api/health`를 부르는 테스트가 있고 통과한다.
- [x] `component` 프로젝트에 스토리 args로 렌더링하는 테스트가 있고, 그 스토리가 Storybook 태블릿 뷰포트에 보인다.
- [x] `CONTEXT.md`, ADR 다섯 개, `CONTEXT-MAP.md`·`README.md` 갱신이 있다.
- [ ] 루트 `bun run ci`가 통과한다.
  - 이번 작업 밖의 기존 lint 오류(`solo-quest`·`packages/ui`의 `vite.config.ts` triple-slash, `solo-quest/.storybook/preview.tsx`의 CSS side-effect import)로 막힌다. `lint:fix`가 다른 작업 중인 `apps/simple-event`까지 고치므로 루트 CI를 돌리지 않고, 바뀐 경로만 검사했다.

## 작업하며 배운 것

- Vite+의 type-aware lint는 `vite.config.ts`의 `/// <reference types="vite-plus" />`를 오류로 본다. 새 앱은 그 줄 없이 `import { defineConfig } from "vite-plus"`만으로 타입이 맞는다.
- TypeScript 7의 `noUncheckedSideEffectImports` 아래에서 Storybook preview의 `import "../src/styles.css"`는 선언이 필요하다. `src/styles.css.d.ts`의 `declare module "*.css";`로 해결한다.
- fast-check v4의 `fc.record`는 null 프로토타입 객체를 만든다. `toStrictEqual`로 JSON 왕복을 비교하려면 `.map`으로 평범한 객체를 만들고, `fc.date`에는 `noInvalidDate`와 valibot `isoTimestamp`가 받는 연도 범위를 준다.
- Storybook 10은 viewport가 코어에 있다. `.storybook/preview.tsx`의 `initialGlobals.viewport`와 `parameters.viewport.options`로 등록하고, 실제 iframe 너비가 세로 834px·가로 1112px인 것을 확인했다.
- health 응답에는 저장소가 필요 없어 `createApp`은 시계만 받는다. 메모리 저장소와 id 생성기는 그 포트가 생기는 티켓에서 `AppDeps`에 더한다.
