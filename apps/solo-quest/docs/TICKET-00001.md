# TICKET-00001: 앱 뼈대, 서버 연결, 테스트 단계 설정

- 스펙: [SPEC-0001](SPEC-0001.md)
- Blocked by: 없음 (바로 시작 가능)
- Status: done

## 만들 것

`@repo/solo-quest` 앱을 만든다. `bun run dev`로 띄우면 첫 화면이 eden 클라이언트로 elysia 서버의 상태 확인 API를 부르고, 그 응답을 화면에 보여 준다.
이후 티켓들이 바로 쓸 수 있게 세 단계 테스트(도메인/단위, API, 컴포넌트)의 설정과 예시 테스트를 하나씩 갖추고, 도메인 용어와 핵심 결정을 문서로 남긴다.

## 알아야 할 것

- **레포 구조:** bun workspaces + Turborepo 모노레포다(루트 README 참고). 새 앱은 `apps/` 아래에 두고 `@repo/` 스코프를 쓴다.
  - `apps/demo`의 설정(TanStack Start SPA, vite, tsconfig, panda, tsr)을 출발점으로 삼는다.
  - 의존성은 앱 `package.json`에 직접 선언한다. bun이 패키지별로 격리해 설치하므로 루트에 있는 것도 쓸 수 없다.
- **디자인 시스템:** `panda.config.ts`에 `designSystem: "@repo/ui"`를 두고, `include`에는 앱 소스만 넣는다.
  - 컴포넌트는 `@repo/ui`에서 가져오고, 스타일 함수는 앱의 `styled-system`에서 가져온다.
  - turbo의 `codegen`, `lib` 의존 관계는 루트 `turbo.json`에 이미 있다. 앱 `package.json`에 `codegen`, `dev`, `build`, `typecheck`, `test` 스크립트를 두면 연결된다.
- **elysia를 TanStack Start에 붙이는 방법**
  - `/api` 접두사를 가진 elysia 앱을 만든다.
  - catch-all 서버 라우트(`/api/$`)의 `server.handlers`에서 HTTP 메서드마다 `app.fetch(request)`로 넘긴다.
  - 브라우저는 `treaty<typeof app>(origin)`으로 부른다. 앱 인스턴스는 의존성(저장소 등)을 인자로 받는 팩토리 함수로 만든다. 이후 티켓에서 테스트가 메모리 구현을 주입할 수 있도록 하기 위해서다.
- **테스트 단계와 위치** (vitest projects, demo의 `vite.config.ts`처럼 디렉터리로 나눈다)
  - `domain`(node): 도메인과 순수 로직, 저장소 계약 테스트
  - `api`(node): elysia 앱을 메모리 저장소로 HTTP 요청 테스트. 영속성을 모른다.
  - `component`(browser, playwright chromium): 스토리 args로 렌더링하는 컴포넌트 테스트. API와 서버 상태를 모른다.
  - E2E는 이번 스펙에서 다루지 않는다.
- **테스트 규칙:**
  - `vi.mock`/`vi.fn`/`spyOn` 등은 oxlint로 금지된다(루트 `.oxlintrc.json`). 의존성은 주입한다.
  - 브라우저 테스트는 `@siheom/react`의 `runSiheom`(given/actions/assertions)을 쓴다. 예시는 `packages/ui`의 `ExampleForm` 테스트다.
  - setup 파일은 `packages/ui`의 `setupTest.ts`를 따른다.
- **Storybook:** 컴포넌트 테스트는 스토리 args로 렌더링한다. 앱에도 Storybook(`@storybook/react-vite`)을 둔다. 설정은 `packages/ui/.storybook`을 따른다.
- **문서로 남길 것** (`mattpocock-skills:domain-modeling` 스킬의 형식을 따른다)
  - `CONTEXT.md` 용어: 세션, 이벤트 로그, 편(마스터/플레이어), 캐릭터, 화자, 보관, 판정, 표기, 넘겨받은 상태
  - ADR 세 개
    1. 이벤트 소싱에 ventyd를 쓴다.
    2. 세션 로그를 DB가 아닌 세션별 JSONL 파일에 추가만 한다. 세션 목록은 DB에 둔다.
    3. 도메인은 브라우저에서 실행하고, 서버는 스키마와 버전만 검증해 저장한다.
  - 결정의 근거는 SPEC-0001의 Implementation Decisions와 Further Notes에 있다.

## 인수 조건

- [x] 루트에서 `bun run dev`를 실행하면 solo-quest가 demo와 겹치지 않는 포트로 뜨고, 첫 화면에 상태 확인 API의 응답이 보인다.
- [x] 루트의 `bun run typecheck`, `bun run test`, `bun run lint`가 solo-quest를 포함해 통과한다.
- [x] `domain` 프로젝트에 예시 단위 테스트가 하나 있고 통과한다.
- [x] `api` 프로젝트에 상태 확인 API를 `app.handle(new Request(...))`로 부르는 테스트가 하나 있고 통과한다.
- [x] `component` 프로젝트에 스토리 args로 렌더링하는 컴포넌트 테스트가 하나 있고 통과한다. 그 스토리는 Storybook에서도 보인다.
- [x] elysia 앱은 의존성을 인자로 받는 팩토리이고, 서버 라우트는 그 팩토리에 실제 의존성을 넘겨 만든다.
- [x] `apps/solo-quest/CONTEXT.md`와 ADR 세 개가 있다.
- [x] 루트 README의 구조 단락에 solo-quest가 추가되어 있다.

## 작업하며 배운 것

- `designSystem`을 쓰는 앱은 `@pandacss/preset-base`, `@pandacss/preset-panda`를 직접 의존성으로 가져야 한다. Panda가 디자인 시스템의 preset을 앱 기준으로 찾고, bun은 패키지별로 격리해 설치하기 때문이다.
- TanStack Start 앱에서는 `tsr generate`를 쓰지 않는다. 이 CLI는 Start 타입 등록(`declare module "@tanstack/react-start"`)을 빠뜨려 서버 라우트의 `server` 옵션 타입이 깨진다. 라우트 트리는 Start vite 플러그인이 만든다.
- 앱 `vite.config.ts`를 그대로 쓰는 Storybook은 Start, nitro 플러그인 때문에 빌드가 깨진다. `viteFinal`에서 두 플러그인을 걸러 낸다.
- turbo에 `-- run`을 넘기면 함께 실행하는 모든 작업(예: `tsc`)에 인자가 전달된다. 커밋 전 검사는 루트의 `bun run ci`로 한다.
- vitest 설정의 node 프로젝트에서 `ReferenceError: module is not defined` 경고가 demo와 똑같이 나온다. 앱 vite 플러그인에서 나오는 것으로 보이며, 원인은 ROADMAP 정리 항목으로 남겨 둔다.
