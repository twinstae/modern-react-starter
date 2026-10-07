# TICKET-00008: 세션 화면 구조 정리 (리팩터링)

- 스펙: [SPEC-0001](SPEC-0001.md)
- Blocked by: TICKET-00003
- Status: done

## 만들 것

TICKET-00003 리뷰에서 나온 구조 문제를 고친다. 사용자가 보는 동작은 그대로다. 대화를 남기고, 새로고침하면 그대로 있고, 오류는 입력을 남긴 채 보인다.
이 티켓이 끝나면 TICKET-00004~00007이 같은 구조 위에서 진행된다. 고칠 것은 다섯 가지다.

1. **세션 컨트롤러가 세션을 메모리에 들고 있다.**
   - 지금은 제출할 때마다 컨트롤러를 새로 만들고, 이벤트 로그 전체를 세 번 읽는다(`findOne` 한 번, `load()`가 두 번).
   - 스펙은 "브라우저가 세션을 메모리에서 이어 가고 이벤트만 저장한다"이다. TICKET-00006의 낙관적 업데이트도 메모리에 있는 엔티티의 큐를 전제로 한다.
2. **저장소 인터페이스는 도메인이 소유한다.**
   - 지금은 `domain/`이 `server/event-log-store.ts`의 `EventLogStore`, `VersionConflictError`를 가져다 쓴다. 의존 방향이 거꾸로다.
   - 세션 목록 저장소(`server/session-list-store.ts`)도 같은 문제가 있다.
3. **이벤트 정의를 한 곳에 둔다.**
   - 지금은 ventyd 스키마와 서버 검증용 `SessionEventSchema`가 따로 있다. 이벤트를 추가할 때마다 두 곳을 고쳐야 한다.
4. **폼은 `SimpleForm`과 `simple-field`로 만든다.**
   - 입력창이 `useState`로 폼을 직접 만들고, 화자 선택을 라디오로 만들었다.
   - 이 템플릿의 폼 관례는 `@repo/ui`의 `SimpleForm`(react-hook-form과 standard schema)과 `simple-field`의 `SimpleXxx` 필드다.
   - 필요한 필드(여러 줄 입력, 선택)는 `@repo/ui`의 `simple-field`에 추가해서 쓴다.
5. **테스트 파일 위치를 정리한다.** `src/http-event-log.test.ts`가 `src/` 바로 아래에 있어서 `vite.config.ts`의 include에 따로 추가되어 있다. 테스트 단계 디렉터리 관례에 맞게 옮긴다.

## 알아야 할 것

- **원칙:** 이 티켓은 리팩터링이다. 각 단계는 `refactor:` 커밋이고, 기존 테스트가 동작을 지키는 그물이다.
  - 테스트를 고쳐야 한다면 그것은 공개 인터페이스(컴포넌트 props, 컨트롤러 API)가 바뀌어서다. 바뀐 인터페이스로 같은 동작을 확인하도록 옮기고, 동작 검증을 빼지 않는다.
  - 새 동작이 필요한 곳(예: 새 `Simple` 필드)은 `feat:`로 테스트를 먼저 쓴다.
- **1. 메모리에 들고 있는 컨트롤러 — 권장 형태** (더 단순한 방법이 있으면 그것을 쓰고 기록한다)
  - 컨트롤러는 세션 하나에 대해 한 번만 만들어진다. `load()`는 처음 한 번만 이벤트 로그를 읽어 엔티티와 이벤트 목록을 메모리에 둔다.
  - `submit()`은 들고 있는 엔티티에 mutation을 적용하고 커밋한다. 성공하면 커밋된 이벤트를 메모리의 이벤트 목록에 더한다. 다시 읽지 않는다.
  - 충돌(`VersionConflictError`)이면 컨트롤러가 스스로 다시 읽어 엔티티와 목록을 새로 만들고, 사용자에게 보여 줄 메시지를 돌려준다.
  - 화면은 컨트롤러 상태를 구독한다. 예: `subscribe`/`getSnapshot`과 `useSyncExternalStore`.
  - 컨트롤러 인스턴스를 라우트가 어떻게 얻을지는 query option 관례에 맞춘다. 예: `sessionQueries.controller(id)`의 queryFn이 컨트롤러를 만들고 `load()`를 기다린다. `staleTime: Infinity`로 두고 loader에서 `queryClient.query`로 미리 불러온다.
  - 제출 뒤 `invalidateQueries`로 로그를 다시 불러오지 않는다.
  - 라우트에 남아 있는 화자 `useState`, `toLogEntries` 호출 같은 조립 로직도 가능하면 컨트롤러 스냅샷이나 표시용 컴포넌트로 옮긴다. 컨테이너에는 분기 로직을 두지 않는다.
  - 테스트: 컨트롤러 테스트에 "제출해도 이벤트 로그를 다시 읽지 않는다"를 추가한다. 읽기 횟수를 세는 메모리 저장소를 감싼 가짜로 확인한다(`vi.fn` 금지, 평범한 변수에 센다). 그 밖의 기존 컨트롤러 테스트는 그대로 통과해야 한다.
- **2. 저장소 인터페이스의 위치**
  - `EventLogStore`, `VersionConflictError`, `SessionListStore`, `SessionSummary`는 `src/domain/`으로 옮긴다.
  - 메모리 구현도 도메인 쪽(또는 명확한 위치)에 둔다. 메모리 구현은 테스트와 서버 기본값이 함께 쓴다.
  - `server/`와 `persistence/`가 `domain/`에 의존하고, `domain/`은 `server/`, `persistence/`를 import하지 않는다. 옮긴 뒤 `domain/`에서 `../server`, `../persistence` import가 없어야 한다.
- **3. 이벤트 정의를 한 곳에**
  - TICKET-00003의 기록: ventyd 1.20.4는 `schema.event`의 타입 키(접두사 없음)와 런타임 키(`session:started`)가 다르다. 그래서 서버용 스키마를 `eventBodies`에서 따로 만들었다.
  - 먼저 ventyd의 schema 객체가 이벤트 파싱 함수(타입 정의에 `parseEvent`가 보인다)를 공개적으로 내놓는지 확인한다. 공개되어 있으면 서버가 그것으로 검증한다.
  - 공개되어 있지 않으면, 이벤트 본문 정의 하나에서 ventyd 스키마와 서버 스키마를 함께 만든다. 이벤트 목록을 두 번 적지 않는다.
  - 어느 쪽이든, 이벤트를 하나 추가할 때 고치는 곳이 한 곳이어야 한다.
- **4. `SimpleForm`과 `simple-field`**
  - `packages/ui/src/form/simple-field.tsx`의 `SimpleInput`, `SimpleCheckbox`처럼 `Controller`와 `Field.*`로 레이블, 힌트, 오류(`aria-errormessage`, `role="alert"`)를 연결하는 형식을 따른다.
  - 추가할 필드
    - **`SimpleTextarea`:** 여러 줄. `@repo/ui`의 `Textarea` 사용.
    - **`SimpleSelect`:** 화자 선택.
      - Ark UI `Select` 기반으로 `@repo/ui`에 `Select` 컴포넌트와 레시피를 추가한다. 디자인 시스템 컴포넌트를 추가하는 기존 방식과 park-ui 형식을 따른다.
      - siheom 가이드: Ark UI Select의 트리거는 보통 `query.combobox("레이블")`로 찾는다. 테스트를 쓰기 전에 실패한 테스트의 a11y 스냅샷으로 실제 역할과 이름을 확인한다.
      - `{ArrowDown}{Enter}` 같은 키보드 우회는 쓰지 않는다.
  - `@repo/ui` 쪽 새 필드는 `packages/ui`에 스토리와 테스트를 둔다. 기존 `ExampleForm`, `SubmitButton` 테스트 형식을 따른다. 테스트할 것은 값이 `onSubmit`으로 넘어가는 것과 검증 오류 표시다.
  - **입력창(`MessageInput`)을 `SimpleForm` 위에서 다시 만든다.** 스키마는 `{ as: 캐릭터 id, text: ShortText }`이고, `side`는 props다. 화자 선택은 폼 필드가 되므로 `speakerId`/`onSpeakerChange` props는 기본값 props로 바꿀 수 있다. 정한 것은 기록한다.
    - 제출에 성공하면 대화 입력만 비우고 화자는 유지한다.
    - `onSubmit`이 오류 메시지를 돌려주면 입력을 유지하고 오류를 보여 준다. `SimpleForm`이 이것을 지원하지 않으면 `@repo/ui`의 `SimpleForm`에 일반적인 방법을 추가한다(예: 제출 콜백이 돌려준 메시지를 폼 수준 오류 `root`로 보여 주기). 이 경우 `feat:`로 `packages/ui`에 테스트를 먼저 쓴다.
    - 남은 글자 수 표시는 유지한다. 지금 글자 수 세기 구현(`countGraphemes`)과 `ShortText` 검증이 같은 기준을 따로 구현하고 있다. 한쪽에서 다른 쪽을 쓰도록 정리할 수 있으면 정리한다.
  - **입력창 테스트는 같은 동작을 그대로 확인해야 한다.** 제출하면 `{ side, as, text }`가 넘어가고 입력이 비워진다. 오류는 입력을 유지한 채 보인다. 빈 입력과 141자는 제출되지 않는다. 화자를 바꾸면 그 화자로 제출된다.
- **5. 테스트 위치:** HTTP 이벤트 로그와 그 테스트를 테스트 단계 디렉터리 관례(`src/domain`, `src/persistence`, `src/server`, `src/components`)에 맞는 곳으로 옮기고, `vite.config.ts`의 단일 파일 include를 없앤다.
- **함께 읽을 것:** TICKET-00001~00003의 "작업하며 배운 것", `CONTEXT.md`, ADR, SPEC-0001의 Testing Decisions

## 인수 조건

- [x] 세션 화면에서 대화를 제출해도 이벤트 로그를 다시 읽지 않는다(컨트롤러 테스트). 로그는 세션을 처음 열 때 한 번만 읽는다.
- [x] 충돌이 나면 컨트롤러가 다시 읽어 다른 탭의 이벤트까지 포함한 목록을 갖고, 안내 메시지를 돌려준다(컨트롤러 테스트).
- [x] 제출 뒤 로그를 `invalidateQueries`로 다시 불러오지 않고, 라우트 컨테이너에 분기 로직이 없다.
- [x] `src/domain/`이 `src/server/`, `src/persistence/`를 import하지 않는다.
- [x] 이벤트를 하나 추가할 때 고칠 곳이 한 곳이다. 서버 검증과 ventyd 스키마가 같은 정의에서 나온다.
- [x] `@repo/ui`에 `SimpleTextarea`, `SimpleSelect`(Ark UI `Select` 기반)가 있고, 각각 스토리와 테스트(`onSubmit` 값, 검증 오류)가 있다.
- [x] 입력창이 `SimpleForm`과 `simple-field`로 만들어져 있고, 기존 입력창 동작 테스트(제출 값, 입력 비움, 오류 유지, 빈 입력과 141자 차단, 화자 선택)가 모두 통과한다.
- [x] `vite.config.ts`에 단일 파일 include가 없고, 모든 테스트가 단계 디렉터리에 있다.
- [x] 루트 `bun run ci`가 통과한다.

## 작업하며 배운 것

- **ventyd schema 객체는 `parseEvent`를 공개한다.** `defineSchema`가 돌려주는 값에 `parseEvent`, `parseEventByName`이 있고 타입도 `session:started` 같은 런타임 키의 유니언으로 나온다(TICKET-00003 때 본 접두사 없는 키는 `schema.event`만의 일이다). 다만 문서(`dist/docs`)에는 나오지 않고 내부 타입(`@internal`)에만 보여서, 공개 API라고 보장되지는 않는다. 서버 검증은 이것을 쓰고, ventyd가 보지 않는 두 가지만 더한다. 이 엔티티의 이벤트인지(`entityName`)와 버전이 있는지다. 이벤트를 추가하면 `defineSchema`의 `event`와 reducer만 고친다.
  - `parseEvent`가 던지는 일반 `Error`를 valibot `rawTransform`으로 감싸 Standard Schema 오류로 바꾼다. elysia는 이것을 422로 돌려준다. 그 대가로 eden 클라이언트의 `events` 입력 타입이 `unknown[]`이 된다(호출하는 쪽은 `SessionEvent[]`를 그대로 넘길 수 있다).
- **컨트롤러 형태는 권장안을 따랐다.** `load()`는 처음 한 번만 읽고, `submit()`은 엔티티에 mutation을 적용해 커밋한 이벤트를 메모리 목록에 더한다. 몇 가지는 직접 정했다.
  - 커밋한 이벤트는 엔티티 큐에서 꺼낼 수 없으므로(공개되지 않는다), `createEventLogAdapter`가 저장에 성공한 이벤트를 `onCommitted`로 알려 준다.
  - 읽기 한 번으로 엔티티를 만들려고 이미 읽은 이벤트를 돌려주는 어댑터로 `findOne`을 한다(`restore`). `findOne`이 로그를 또 읽지 않는다.
  - 충돌이 아닌 다른 오류로 커밋이 실패하면, 저장하지 못한 이벤트가 엔티티 큐에 남아 다음 제출에 딸려 가므로 메모리의 목록으로 엔티티를 되살리고 오류를 다시 던진다.
  - 규칙 위반은 엔티티를 바꾸지 않으므로 구독자에게 알리지 않는다.
- **컨트롤러는 query option 키를 세션 목록과 따로 둔다**(`["session-controllers", id]`). `["sessions"]` 아래에 두면 세션을 만들어 목록을 무효화할 때 컨트롤러까지 낡은 것으로 표시된다. 컨트롤러는 직렬화할 수 없는 객체지만 `spa: { enabled: true }`라 서버에서 dehydrate하지 않는다.
- **`HttpEventLog`는 `src/server/`로 옮겼다.** 테스트가 `createTestClient`(api 단계)를 쓰기 때문이다. 브라우저 쪽 구현이 `server/`에 있는 어색함은 남는다. 구현이 늘면 별도 디렉터리와 테스트 단계를 정한다.
- **`SimpleForm`을 넓혔다.**
  - `onSubmit`이 문자열을 돌려주면 폼 수준 오류(`errors.root`)로 `role="alert"`와 함께 폼 끝에 보여 준다. react-hook-form은 `root` 오류를 다음 제출에서 지운다.
  - `resetOnSuccess`로 고른 필드만 성공 뒤에 기본값으로 되돌린다. 입력창이 대화만 비우고 화자를 유지하는 데 쓴다.
  - `SimpleWatch`(필드 값을 읽어 그리는 render prop)를 더했다. 남은 글자 수 표시 때문이다. 앱이 react-hook-form에 직접 의존하지 않게 하려는 선택이다.
- **입력창 테스트에서 바뀐 것 둘.**
  - 오류는 이제 필드에 연결된 `aria-errormessage`가 아니라 폼 수준 오류(`query.alert`)로 확인한다. 폼 수준 오류를 특정 필드에 묶는 것은 `SimpleForm`이 알 수 없다. 오류가 보이고 입력이 남는 확인은 그대로다.
  - 빈 입력과 141자는 버튼을 막는 대신(`disabled`) 제출 때 검증 오류로 막는다. `SimpleForm`의 관례다. 제출되지 않는 것과 오류 메시지를 확인한다.
- **Ark UI `Select`의 트리거 역할은 `combobox`**다. 첫 시도에 siheom 쿼리가 그대로 맞았다. 다만 옵션을 고른 뒤 메뉴가 닫히기 전에 다음 입력(`fill`)을 하면 값이 사라진다(바깥 클릭으로 처리된다). 테스트는 `assertions.not.expanded`로 닫힌 것을 기다린 뒤 이어 간다. `assertions.expanded(target, false)`는 거꾸로 `true`를 기대하므로 `not.`을 쓴다.
- **`withProvider(Select.Root)`는 Ark `Select.Root`의 제네릭을 지운다.** `collection: ListCollection<unknown>`이 되어 항목 타입이 맞지 않으므로, `RootProps<T>`를 직접 만들어 캐스트한다.
- **필드 넷(`SimpleInput`, `SimpleTextarea`, `SimpleSelect`, `SimpleCheckbox`)이 되풀이하던 힌트/오류 표시와 aria 연결을 `FieldMessage`, `fieldAria`로 모았다.** `Controller` + `Field.Root` 틀 자체는 필드마다 레이블 위치가 달라 그대로 두었다.
- **글자 수 기준은 `countGraphemes` 하나다.** `ShortText`가 `v.maxGraphemes` 대신 이것을 쓰고, 남은 글자 수는 `remainingGraphemes`가 계산한다.
- **(작업 방식) vitest browser는 새 의존성이 생기면 첫 실행이 실패한다.** `@repo/ui`에 `Select`를 추가한 직후 `solo-quest`의 component 프로젝트가 한 번 실패했고, 재실행하니 통과했다.
