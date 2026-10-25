# book-curator 작업 에이전트 안내

이 파일은 티켓을 맡은 에이전트가 **작업 전에 읽는** 안내다. 티켓 문서, `TECH_SPEC.md`,
`CONTEXT.md`와 함께 읽고, 충돌하면 티켓과 스펙이 우선한다.

## 1. 먼저 읽을 것

1. `docs/TICKET-XXXXX.md` — 인수 조건이 곧 할 일 목록이다.
2. `docs/TECH_SPEC.md` — 경계, 불변식, 검증 전략.
3. `CONTEXT.md` — 용어. 코드 이름과 문장은 이 용어를 따른다.
4. 이 파일의 3~7장.

프런트 작업이면 아래를 **반드시** 먼저 읽는다.

- https://github.com/twinstae/siheom-ts/blob/main/.claude/skills/siheom-frontend-test/SKILL.md
- https://github.com/twinstae/siheom-ts/blob/main/.claude/skills/siheom-frontend-test/API.md

참고 구현은 `apps/solo-quest`(같은 저장소)와 `../qr-quest`(운영자 인증, 저장소)다.
백엔드 참고는 `../cosmic-js`다. 참고 코드를 그대로 베끼지 말고, 이 앱의 스펙과
불변식에 맞는지 비판적으로 본다. 참고 구현이 더 복잡하면 더 단순한 쪽을 택한다.

## 2. 범위

- 티켓 하나만 한다. 다음 티켓의 코드를 미리 만들지 않는다.
- 인수 조건 밖의 기능, 화면, 추상화, 설정을 더하지 않는다.
- 다른 앱(`apps/demo`, `apps/solo-quest`, `apps/simple-event`)과 `packages/ui`의
  기존 동작을 바꾸지 않는다. 공용 원시 컴포넌트를 더할 때도 기존 API를 깨지 않는다.
- 배포, 실제 계정, 실제 책방 데이터, 사람의 확인이 필요한 일은 하지 않는다.
  막히면 `docs/OPEN-QUESTIONS.md`에 더하고 보고한다. 이미 정해진 것을 다시 묻지 않는다.

## 3. 경계: parse, don't validate

외부 세계에서 들어온 값은 **그 경계에서 도메인 모델로 파싱**한다. 검증만 하고
`unknown`/DTO를 안쪽으로 들여보내지 않는다.

- 스키마는 `domain/`에 한 번만 쓴다. 타입은 `v.InferOutput`으로 추론한다.
- HTTP 요청/응답, 저장소 행, JSON 문서, URL 파라미터는 모두 경계다.
- 경계마다 **매퍼**를 둔다: DTO → 도메인(파싱), 도메인 → DTO(직렬화).
  매퍼는 `toDomain`/`toDto`처럼 이름을 붙이고, 파싱 실패는 타입이 있는 오류로 돌려준다.
- 도메인 타입에 `any`, `unknown`, nullable 뭉치, 화면용 문자열을 넣지 않는다.
- 새 필드를 받을 때 스키마를 느슨하게 풀지 않는다. 모르는 필드는 거부한다
  (특히 이벤트: I-12).
- 직렬화는 도메인 타입을 그대로 `JSON.stringify` 하지 않는다. 필요한 필드만 옮긴다.
- **손님 DTO는 도메인 객체를 펼치지 않는다.** 명시적 mapper로 필요한 필드만 고르고,
  빠져야 할 필드(기준 응답, 서랍 표시, 점수, 서랍 코드)의 부재를 API 테스트로 고정한다.
- 새 `[가정]` 값(문구, 시간, 표시, 색)을 만들면 `docs/OPEN-QUESTIONS.md`에 먼저 더한다.
  코드에만 두고 "주인이 확인하면 된다"고 보고하지 않는다.

## 4. 구조

```
routes/        컨테이너: query/mutation/타이머를 컴포넌트에 연결. 분기 최소
components/    표시만: props in, 콜백 out. fetch/저장소/도메인 계산 없음
queries.ts     서버 상태 query option 한곳
api-client.ts  eden treaty + unwrap
server/        HTTP 모양(경로, 상태 코드, 인증). createApp(deps)
application/   유스케이스: 포트를 받아 코어를 부르고 저장
domain/        순수 코어. React·elysia·drizzle·Date.now·Math.random 금지
persistence/   포트 구현: memory, drizzle(PGlite). 같은 계약 테스트
```

- 시각과 난수는 인자로 받는다. 테스트는 고정 시각·시드 난수를 넣는다.
- `createApp(deps)`는 저장소, 시각, id 생성기, 인증을 인자로 받는다.
- API 테스트는 `server/test-client.ts`의 메모리 의존성과 eden 클라이언트로 부른다.
- 저장소는 포트 인터페이스 뒤에 숨기고, 메모리와 PGlite 구현에 같은 계약 테스트를
  돌린다. 계약 테스트를 복사해 두 벌 쓰지 않는다.
- 손님 화면에 점수·서랍 코드·다른 서랍 책이 새지 않게 **타입으로** 막는다(I-9).
- 별명은 손님 쪽 메모리에만 둔다. 이벤트·요청·저장소에 별명 자리를 만들지 않는다(I-12).

## 5. 테스트

- TDD: 인수 조건 하나 → 실패하는 테스트 하나 → 통과시키는 최소 코드 → 정리.
- **단위 테스트로 충분한 것을 컴포넌트 테스트로 만들지 않는다.** 순수 계산, 파싱,
  상태 전이는 `domain`에서 값으로 확인한다.
- 컴포넌트 테스트는 사용자가 보는 결과(접근성 이름, 보이는 글, 콜백 인자)만 확인한다.
  컴포넌트 테스트 수를 늘리는 것이 목표가 아니다.
- `vi.mock`/`vi.fn`/`spyOn` 금지. 의존성은 인자로 넣고, 가짜 구현은 `*.fake.ts`와
  `fake-aliases.ts`로 연결한다.
- 테스트 기대값은 구현에서 다시 계산하지 말고 스펙의 리터럴/픽스처로 적는다.
  같은 동작을 여러 각도에서 반복하는 테스트는 지운다.
- 속성 테스트는 생성기를 `*.arbitrary.ts`에 두고, 실패하면 시드를 줄여 원인을 찾는다.
- 컴포넌트는 스토리의 `args`로 렌더링한다. 스토리와 테스트가 같은 픽스처를 쓴다.
- `query.*("…")`의 문자열은 실제 접근성 이름과 맞춘다. 없으면 컴포넌트에
  `<label>`, `aria-label`, `aria-labelledby`를 먼저 붙인다.
- 스타일·CSS·DOM 구조를 단언하지 않는다. 레이아웃은 Storybook 태블릿 뷰포트에서 본다.
- 타이머는 시각·타이머를 주입해 순수 코어에서 확인한다.

## 5.1 이미 있는 코어 (다음 티켓이 다시 만들지 말 것)

- `domain/question-set.ts`: `QuestionSetSchema`, `parseQuestionSet`, `toQuestionSetDto`,
  `toQuestionSetJson`, `parseQuestionSetJson`, `drawerOrder`. 모르는 필드는 거부한다.
  `statementTemplate`(공통), 서랍별 `statement`(없으면 `null`), `citationTemplates`
  (item/choice)는 생략하면 기본 문형으로 정규화된다.
- `domain/josa.ts`: `attachJosa(word, pair)`. 이/가, 을/를, 은/는, 와/과, (으)로.
  한글 음절 받침과 ㄹ 받침을 보고, 한글이 아닌 끝은 받침 없음으로 본다.
- `domain/statement.ts`: `NicknameSchema`/`parseNickname`(trim, 1~10 코드 포인트),
  `renderStatement(template, { drawerName, nickname })`, `renderCitation(template, { quote })`.
  자리표시는 `{nickname}`, `{drawer}`, `{drawer:이/가}`, `{quote}`(인용만). 모르는
  자리표시·조사는 `UnknownPlaceholderError`/`UnknownJosaError`로 거부한다.
  별명 뒤에는 "님"을 한 번만 붙인다(별명에 이미 "님"이 있어도).
- `domain/citation.ts`: `cite(set, scores, drawer)` → `{ question, drawer, answer, quote, text }`.
  긍정 기여가 가장 큰 답, 같으면 문항 순서가 빠른 답. 없으면 `NoCitationError`.
- `domain/curate.ts`: `curate(set, answers, nickname)` → `{ drawers, scores, ranking,
  statements: { first, second, recommended }, citation, customer }`. `customer`는
  `firstStatement`, `secondStatement`, `recommendedDrawerName`, `recommendedStatement`,
  `citation`만 가진 손님 view model이다(I-9). 주인 확인(TICKET-00005)은 내부 값을 쓴다.
- `domain/book.ts`: `BookSchema`/`parseBook`, `BookRelevanceSchema`(B1~B7 모두 0~5 정수),
  `toBookDto`/`toBookJson`/`parseBookJson`. 모르는 필드와 빠진 관련도를 거부한다.
- `domain/shelf.ts`: `DrawerStockEntry`(서랍 코드, 책 id, 수량 0 이상), `parseDrawerStock`,
  `shelfKinds`, `checkShelfGate(stock, drawers)` → `{ passed, lacking: [{ drawer, name,
  kinds }] }`, `MissingBookError`. 서랍 이름은 질문 세트에서 인자로 받는다.
- `domain/owner-view.ts`: `ownerView(curation, stock, books)` → 추천·2순위(상태 문장 포함),
  비슷함, 모든 서랍의 책·수량·종류 수·3종 미만 경고, 게이트. `drawerBooksView(drawer,
  stock, books)` → 건넨 서랍의 책만(제목, 저자, 이유, 질문, 수량).
- `domain/shelf.fixture.ts`: B6 3종(게이트 통과), B1·B2 부족, 수량 0 책 예시.
  `domain/shelf.arbitrary.ts`: 무작위 서가 + 큐레이션 가능한 답.
- `application/shelf-ports.ts`: `BookStore`(`list`/`get`/`save`), `DrawerStockStore`
  (`list`/`setQuantity`/`remove`). 구현은 `persistence/memory-shelf-store.ts`와
  `persistence/drizzle-*.ts`, `persistence/database.ts`(PGlite + migrate). 계약은
  `persistence/shelf-store.contract.ts` 하나를 메모리·PGlite 테스트가 함께 쓴다.
- `domain/answer.ts`: `AnswerValueSchema`(1~5 정수 또는 선택지 id), `answerValueFor`,
  `InvalidAnswerError`.
- `domain/turn.ts`: `startTurn(nickname)`, `answer(set, turn, value)`, `back(turn)`,
  `endTurn()`(→ `undefined`). 답 목록 하나가 진행 상태다.
- `domain/scoring/`: `scoreItemMean`, `scoreChoiceWeight`, 공통 `DrawerScores`.
  문항 없는 서랍은 점수 0으로 남는다. 동점의 "5의 수"는 반전 후 유효값 기준이다.
- `domain/rank.ts`: `rank(scores, order)` → `{ first, second, similar }`.
  `SIMILAR_SCORE_GAP = 0.5`는 표시일 뿐 순위를 바꾸지 않는다.
- `domain/seoyun.fixture.ts`: 기준 응답 예시(B6 1순위, B1 2순위).
- `domain/analyze.ts`: `analyze(set, rng, recorded?)` → `SetReport`. 표본
  `SAMPLE_SIZE`(4,000), 서랍별 1순위 10~18% 게이트(`FIRST_RATE_MIN/MAX`), 구조·
  기준 응답·실패/경고를 한 보고에 담는다. 같은 시드는 같은 보고를 낸다.
- `domain/random.ts`: `seededRng(seed)` 시드 고정 난수. 도메인에서 `Math.random` 대신 쓴다.
- `domain/seed-question-set.ts`: MVP 시드 7서랍×2문항과 서윤 기준 응답. 상태 문장과
  인용 문형도 데이터로 들어 있다. `SEED_RANDOM_SEED`(79)로 점검한다.
- `domain/question-set.arbitrary.ts`: 무작위 질문 세트·답·상호작용열 생성기.
  `curatableAnsweredQuestionSetArbitrary`는 모든 서랍에 긍정 기여가 남는 세트다.
- `domain/health.ts`는 뼈대 예시다. 새 도메인 규칙과 섞지 않는다.

## 6. 도구와 명령

이 저장소는 Vite+를 쓴다. `vite`/`vitest` 대신 `vp dev`, `vp test`, `vp build`,
`vp lint`, `vp fmt`를 쓴다. 루트 스크립트도 `vp`를 부른다.

```bash
# 앱 의존성/코드젠
cd apps/book-curator && bun run codegen

# 티켓의 좁은 테스트 (예)
cd apps/book-curator && bun run test run src/domain/turn.test.ts

# 앱 타입 검사
bunx turbo run typecheck --filter=@repo/book-curator

# 앱 테스트 전체
bunx turbo run test --filter=@repo/book-curator -- run

# 이 앱의 커밋 전 게이트 (lint + format + typecheck + test)
cd apps/book-curator && bun run check
```

- **루트 `bun run ci` 대신 앱의 `bun run check`를 게이트로 쓴다.** 루트 lint는
  `apps/simple-event`(다른 작업 중)와 `solo-quest`의 기존 오류를 함께 검사해 실패한다.
  이번 작업과 무관한 실패를 고치지 않는다. 루트 CI가 고쳐지면 그때 게이트를 바꾼다.
- `solo-quest`의 `message-input` 매크로 라벨 테스트는 간헐 실패한다. 만나면 이름과
  재실행 결과만 보고한다.
- `storybook-static/`은 `.gitignore`에 있으므로 커밋하지 않는다.
- PGlite 테스트는 **파일당 DB 하나**를 `beforeAll`에서 열고, `beforeEach`에서 테이블을
  비운다. 테스트마다 새 PGlite를 띄우면 느리고 메모리가 남는다. 저장소 계약은
  `persistence/*.contract.ts` 하나를 메모리·PGlite 테스트가 함께 부른다.
- 앱 포트는 3002, Storybook은 6008을 쓴다.
- 패키지를 더하면 루트 `package.json`의 `catalog`에 넣고 `bun install` 한다.

## 7. 커밋

작게, 자주. 한 커밋은 한 가지 일만 한다.

- 구조 변경(rename, extract, 설정)과 동작 변경을 같은 커밋에 섞지 않는다.
- 테스트를 먼저 통과시킨 뒤 커밋한다. 커밋 전 좁은 테스트와 타입 검사를 돌린다.
- 메시지는 한국어 conventional style: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`,
  `chore:`. 예: `feat: 손님이 답을 되돌아가면 뒤의 답을 버린다`.
- **`git add -A`, `git add .` 금지.** 이 저장소에는 다른 작업의 미커밋 파일이 있다.
  자기 작업 경로만 명시해서 더한다. 루트 공용 파일(`package.json`, `bun.lock`,
  `CONTEXT-MAP.md`, `README.md`)은 바꾼 경우에만 명시해서 더한다.
- 티켓 체크박스와 "작업하며 배운 것"은 마지막에 갱신하고 `docs:` 커밋으로 남긴다.

## 8. 끝내고 보고할 것

- 무엇을 만들었는지 3~6줄.
- 바꾼 파일과 커밋 해시.
- 돌린 테스트 명령과 결과. 실패가 있으면 이름과 이유.
- 인수 조건 체크 상태.
- 막힌 것, 사람이 정해야 할 것, 다음 에이전트가 알아야 할 것.
- "이번에 어디서 헤맸고, 다음에 무엇을 미리 알면 좋았을지" 1~3줄.
