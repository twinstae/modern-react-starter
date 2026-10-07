# TICKET-00002: 세션 목록과 세션 만들기

- 스펙: [SPEC-0001](SPEC-0001.md) — User Stories 1–5
- Blocked by: TICKET-00001
- Status: ready-for-agent

## 만들 것

첫 화면이 세션 목록이 된다. 지금까지 만든 세션을 최신순으로 제목과 만든 시각으로 보여 준다.
제목을 입력해 새 세션을 만들 수 있고, 목록에서 세션을 누르면 세션 화면(`/sessions/$sessionId`)으로 이동한다. 세션 화면은 아직 제목만 보이는 빈 화면이다.
세션 목록은 서버의 DB에 저장되어, 서버를 다시 띄워도 남는다.

## 알아야 할 것

- **세션 목록 저장소** 인터페이스를 둔다. `create({ title }) → session`, `list() → session[]`(최신순), `get(id) → session | null`
  - 구현은 두 가지다.
    - 메모리 구현: API 테스트용
    - drizzle 구현: 테이블 `(id, title, createdAt)`. 개발은 PGlite 파일(`.data/`, gitignore 됨), 운영은 postgres
  - 세션 id는 시간순으로 정렬되는 id를 쓴다.
  - drizzle 설정과 마이그레이션은 앱 안에 둔다. demo의 `drizzle.config.ts`는 남은 흔적일 뿐이니 참고만 한다.
- **제목:** 앞뒤 공백을 빼고 1~140자. 이 규칙은 valibot 스키마로 정의하고 서버와 브라우저가 같이 쓴다.
- **API:** `GET /api/sessions`(목록), `POST /api/sessions { title }`(만들기 → 세션), `GET /api/sessions/:id`(하나, 없으면 404)
- **화면**
  - 표시용 컴포넌트는 props만 받는다.
    - 세션 목록: `sessions`, 각 항목의 링크 또는 `onOpen`
    - 새 세션 폼: `onSubmit({ title })`
  - 라우트가 TanStack Query와 eden으로 이 컴포넌트들을 연결한다.
  - 컴포넌트는 `@repo/ui`(예: `Card`, `Input`, `SimpleForm`, `SubmitButton`)를 우선 쓴다.
- **시각 표시:** `createdAt`은 Instant(ISO 문자열)다. 화면에는 사용자 로캘의 날짜와 시각으로 보여 준다(Temporal 사용).

## 인수 조건

**도메인/단위**
- [ ] 세션 목록 저장소의 계약 테스트 하나를 메모리 구현과 drizzle(PGlite) 구현에 모두 돌려 통과한다. 내용: 만들기 → 조회, 최신순 정렬, 없는 id는 `null`.

**API** (메모리 저장소 주입, 영속성 무지)
- [ ] `POST /api/sessions`에 올바른 제목을 보내면 세션이 만들어지고, 이어서 `GET /api/sessions`에 나온다.
- [ ] 빈 제목, 공백만 있는 제목, 141자 제목은 422로 거부된다.
- [ ] `GET /api/sessions/:id`는 없는 id에 404를 돌려준다.

**컴포넌트** (스토리 args로 렌더링, props만)
- [ ] 세션 목록 스토리가 0개(빈 상태 안내), 1개, 10개, 매우 많음을 보여 주고, 각각을 테스트로 확인한다.
- [ ] 새 세션 폼에 제목을 넣고 제출하면 `onSubmit`에 `{ title }`이 넘어간다.
- [ ] 빈 제목이나 140자를 넘는 제목은 제출되지 않고 검증 오류가 보인다.

**직접 확인** (E2E 전까지)
- [ ] `bun run dev`에서 세션을 만들면 목록 맨 위에 나타나고, 누르면 세션 화면으로 이동한다. 서버를 다시 띄워도 목록이 남아 있다.
