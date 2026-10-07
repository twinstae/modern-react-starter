# TICKET-00005 구현 계획 (작업 중에만 두는 파일, 완료 커밋에서 지운다)

## 핵심 결정

- **이벤트:** `session:character_added { characterId, name: ShortText }`, `session:character_archived { characterId }`.
  - reducer: added는 `{ id, name, archived: false, isDefault: false }`를 목록 끝에 더하고, archived는 그 캐릭터만 `archived: true`로 바꾼다.
- **mutation 규칙** (`Session`)
  - `addCharacter(name)`: `parseShortText`로 이름 검사 → 활성 캐릭터와 같은 이름이면 거부. 보관된 것과 같은 이름은 허용. id는 엔티티처럼 uuidv7을 mutation 안에서 만든다(컨트롤러에 id 생성기를 새로 주입하지 않는다. 테스트는 이름으로 찾는다).
  - `archiveCharacter(characterId)`: 없는 것, 기본 캐릭터, 이미 보관된 것은 거부.
  - 보관된 화자의 대화/판정 거부는 `#assertActiveSpeaker`가 이미 한다(보관이 생겨서 처음으로 경로가 열린다. 테스트로 못박는다).
- **로그 항목:** 화자 이름을 `character_added`에서도 모은다(새 캐릭터의 이름이 로그에 나오려면 필요). `LogEntry`에 `speakerId`를 더하고, 묶음은 `side + speakerId`로 비교한다(이름이 같은 활성/보관 캐릭터를 합치지 않으려고).
- **컨트롤러:** `addCharacter({ name })`, `archiveCharacter(characterId)`는 `submit`처럼 오류 문자열 또는 undefined를 돌려준다. 커밋/오류 처리(규칙 위반, 충돌, 저장 실패)는 한 함수로 모은다(먼저 `refactor:`로 뽑는다).
- **활성/보관 구분:** 도메인 상태는 목록 하나다. 표시용 컴포넌트가 `archived`로 나눈다(`activeCharacters` 헬퍼는 도메인에 두고 `MessageInput`과 패널이 같이 쓴다).
- **CharacterPanel props:** `characters: Character[]`(전체), `onAdd({ name }): Promise<string | undefined>`, `onArchive(characterId): void | Promise`. 기본 캐릭터에는 보관 버튼이 없다. 보관된 캐릭터는 흐리게 따로 보인다.
- **MessageInput:** `characters`를 전체로 받아 활성만 화자 목록에 낸다. 고른 화자가 보관되면 그 편의 기본 화자로 돌아간다(폼 상태를 바꾸므로 `@repo/ui`에 폼 값을 바꾸는 hook을 더한다).
- **레이아웃:** 패널은 제목 줄 옆의 접이식(Collapsible)이다. 닫혀 있으면 "캐릭터 n" 버튼 하나만 자리를 차지하고, 열면 로그 영역이 그만큼 줄어든다. 입력창은 아래에 남는다.

## 체크리스트

- [ ] refactor: 컨트롤러의 커밋 처리를 한 함수로 뽑는다
- [ ] 도메인: 캐릭터 추가 / 보관 이벤트와 reducer (왕복 포함)
- [ ] 도메인: 이름 규칙 (빈, 141자, 활성 중복 거부, 보관과 중복 허용)
- [ ] 도메인: 보관 규칙 (기본, 없는, 이미 보관된 것 거부)
- [ ] 도메인: 보관된 화자의 대화/판정 거부
- [ ] API: 새 이벤트 왕복, 141자 이름 422
- [ ] 로그 항목: 새 캐릭터와 보관된 캐릭터의 이름, speakerId 묶음
- [ ] 컨트롤러: addCharacter / archiveCharacter
- [ ] 컴포넌트: MessageInput 화자 목록 활성만, 보관 시 기본 화자로 복귀
- [ ] 컴포넌트: CharacterPanel 스토리 4종, 추가, 오류, 보관
- [ ] 컴포넌트: SessionLog 보관된 캐릭터 이름
- [ ] 라우트 연결
- [ ] 티켓 완료 표시
