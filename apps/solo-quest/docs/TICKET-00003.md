# TICKET-00003: 세션을 열고 대화하기

- 스펙: [SPEC-0001](SPEC-0001.md) — User Stories 6–17, 39, 40, 49–54
- Blocked by: TICKET-00002
- Status: ready-for-agent

## 만들 것

세션 화면에서 대화를 주고받는다. 화면에는 이벤트 로그 하나와 입력창 두 개가 있다.

- 왼쪽 입력창에 쓰면 **마스터** 편 대화로 기록되고 로그 왼쪽에 보인다. 오른쪽 입력창에 쓰면 **플레이어** 편 대화로 기록되고 로그 오른쪽에 보인다.
- 처음 열린 세션에는 기본 캐릭터 `GM`과 `Player`가 있고, 각각 왼쪽과 오른쪽 입력창의 화자가 된다.
- 기록은 세션별 JSONL 파일에 쌓인다. 새로고침하거나 서버를 다시 띄워도 그대로 다시 보인다.

이 티켓은 저장이 끝난 뒤 화면에 반영하는 단순한 방식으로 만든다. 낙관적 업데이트는 TICKET-00006, 가상 스크롤은 TICKET-00007에서 한다.

## 알아야 할 것

- **ventyd** (v1.20.x)
  - `defineSchema("session", { schema: valibot({ event, state }), initialEventName: "session:started" })`, `defineReducer`, `Entity(schema, reducer)`, `mutation`, `createRepository(Entity, { adapter, generateId? })`를 쓴다.
  - 이벤트에는 `eventId`, `eventName`, `eventCreatedAt`(ISO), `entityName`, `entityId`, `version`, `body`가 붙는다.
  - 어댑터 계약
    - `getEventsByEntityId({ entityName, entityId, afterVersion? })`
    - `commitEvents({ entityName, entityId, events, state, expectedVersion })`
    - 충돌은 어댑터가 예외를 던져 알린다.
    - repository는 커밋할 때 `expectedVersion = 엔티티 버전 − 큐에 쌓인 이벤트 수`를 넘긴다.
  - 문서는 패키지의 `dist/docs/*.md`에 들어 있다.
- **이번 티켓의 이벤트**
  - `session:started { characters }`
  - `session:message_posted { side: "master" | "player", as: characterId, content }`
  - 상태는 캐릭터 목록 `{ id, name, archived, isDefault }[]`다. `message_posted`의 reducer는 이전 상태를 그대로 돌려준다.
  - 로그 화면은 상태가 아니라 이벤트 목록을 읽는다.
- **규칙** (mutation이 검사한다)
  - 대화 내용은 앞뒤 공백을 뺀 1~140자이고, 줄바꿈을 허용한다.
  - 화자는 활성 캐릭터여야 한다.
- **로그가 빈 세션:** 아직 시작되지 않은 세션이다. 컨트롤러가 기본 캐릭터 둘을 담은 `session:started`부터 커밋한다.
- **이벤트 로그 저장소** 인터페이스
  - `read(sessionId) → events`
  - `append(sessionId, expectedVersion, events)`: 버전이 맞지 않으면 충돌 오류
  - 메모리 구현과 파일 구현을 둔다.
    - 파일 구현은 `<dir>/<sessionId>.jsonl`에 한 줄에 이벤트 하나를 쓴다. dir은 주입받는다.
    - 세션마다 메모리 잠금을 걸고, 한 커밋은 `write` 한 번으로 쓴다. fsync는 하지 않는다.
- **API**
  - `GET /api/sessions/:id/events` → 이벤트 전체(버전순)
  - `POST /api/sessions/:id/events { expectedVersion, events }`
    - 응답: 성공 204, 버전 충돌 409, 스키마 위반이나 버전 불연속 422, 없는 세션 404
  - 서버는 도메인을 실행하지 않는다. 브라우저와 공유하는 valibot 이벤트 스키마로 검증하고, 버전이 `expectedVersion + 1`부터 1씩 증가하는지만 확인한다.
- **HTTP 어댑터:** eden 클라이언트로 위 API를 부르는 ventyd 어댑터다. 409 응답은 충돌 예외로 바꾼다.
- **세션 컨트롤러:** UI에 의존하지 않는다. 세션 id와 ventyd repository를 받아 다음을 맡는다.
  - 불러오기와 필요하면 시작
  - 대화 제출
  - 이벤트 목록과 캐릭터 상태 제공
  - 라우트가 이것을 TanStack Query 또는 React 상태로 컴포넌트에 연결한다.
- **표시용 컴포넌트** (props만 받는다)
  - 세션 로그: `entries`(이벤트에서 만든 표시용 항목: 편, 화자 이름, 내용, 시각)
  - 입력창: `side`, `characters`, `speakerId`, `onSpeakerChange`, `onSubmit({ side, as, text })`
    - 콜백이 오류를 돌려주면 입력을 유지하고 아래에 오류를 보여 준다. 성공하면 입력을 비운다.
    - 남은 글자 수를 보여 준다.
  - 텍스트를 명령으로 해석하는 것은 컨테이너 몫이다. 이 티켓에서는 모든 입력이 대화다(명령은 TICKET-00004).

## 인수 조건

**도메인/단위** (메모리 어댑터)

- [ ] 새 세션을 시작하면 상태는 활성 기본 캐릭터 `GM`, `Player` 둘이다.
- [ ] 마스터와 플레이어 편 대화를 커밋하고 repository로 다시 불러오면, 이벤트 목록과 순서, 본문이 같다.
- [ ] `message_posted`는 상태(캐릭터 목록)를 바꾸지 않는다.
- [ ] 빈 대화, 공백만 있는 대화, 141자 대화, 없는 화자로 말하는 mutation은 이벤트를 만들지 않고 오류를 낸다.
- [ ] 이벤트 로그 저장소 계약 테스트를 메모리 구현과 파일 구현(임시 디렉터리)에 모두 돌려 통과한다.
  - 추가 → 읽기 왕복
  - 버전이 어긋나면 충돌 오류
  - 같은 세션에 동시에 `append`해도 하나만 성공하고 줄이 섞이지 않음
  - 다른 세션 파일과 섞이지 않음

**API** (메모리 저장소 주입, 영속성 무지)

- [ ] 이벤트를 커밋하고 조회하면 같은 이벤트가 버전순으로 돌아온다.
- [ ] 잘못된 `expectedVersion`은 409, 스키마에 맞지 않는 이벤트(예: 141자 내용)나 버전 불연속은 422, 없는 세션은 404다.
- [ ] eden 클라이언트를 앱에 직접 연결한 HTTP 어댑터로 ventyd repository를 만들어 커밋하고 다시 불러오는 왕복이 성공하고, 409는 충돌 예외가 된다.

**컴포넌트** (스토리 args, props만)

- [ ] 세션 로그 스토리가 0개, 1개, 10개, 매우 많음을 보여 준다. 마스터 항목은 왼쪽, 플레이어 항목은 오른쪽에 정렬되고 화자 이름이 보인다.
- [ ] 줄바꿈이 있는 대화는 줄바꿈이 보이고, 마크다운 문법은 그대로 텍스트로 보인다.
- [ ] 입력창에 텍스트를 넣고 제출하면 `onSubmit`에 `{ side, as, text }`가 넘어가고 입력이 비워진다.
- [ ] `onSubmit`이 오류를 돌려주면 입력이 남고 오류가 보인다.
- [ ] 빈 입력은 제출되지 않는다. 140자를 넘으면 제출할 수 없고 남은 글자 수가 음수나 경고로 보인다.
