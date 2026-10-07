# TICKET-00004 구현 계획

## 설계 결정

- `src/domain/parse-input.ts` — `parseInput(text)`: 순수 함수. 표기를 검증하지 않고 `notation` 문자열만 잘라 낸다.
- `src/domain/dice.ts` — 순수 함수 모음.
  - `parseNotation(text)` → `{ ok: true, terms: DiceTerm[] } | { ok: false, message }`. 상한은 `MAX_DICE`, `MAX_SIDES` 상수.
  - `roll(terms, random)` → `{ terms: RolledTerm[], total }`. `random: () => number`(0 이상 1 미만)을 주입받는다.
  - 항 타입: 굴리기 전 `{ type: "dice", sign, count, sides } | { type: "constant", sign, value }`,
    굴린 뒤 `{ type: "dice", sign, sides, values } | { type: "constant", sign, value }`.
- 이벤트 `session:dice_rolled { side, as, notation, terms, total, label? }`는 `sessionSchema`의 `event`에만 적는다(valibot).
  reducer는 기본 분기가 이전 상태를 돌려주므로 고치지 않는다. 서버 검증은 `parseEvent`가 따라온다.
- 변이 `session.rollDice(side, as, result, label?)`: 라벨은 `ShortText`로 검증하고 화자는 활성 캐릭터여야 한다.
- `LogEntry`는 `kind: "message" | "roll"`로 나뉘는 합집합. `SessionLog`는 계속 `entries` props만 받는다.
- 컨트롤러 `submit({ side, as, text })`가 `parseInput`으로 해석한다. 난수는 `createSessionController({ random })`로 주입하고,
  `crypto.getRandomValues` 기반 난수는 `session-client.ts`(앱 배선)에서만 만든다.
- 입력창은 바뀌지 않는다. 오류 문자열을 돌려주면 입력을 유지하고 보여 준다(TICKET-00003).

## 체크리스트

- [ ] parseInput
- [ ] 표기 파서(허용/거부/상한, 표 기반)
- [ ] roll(고정 난수, 상수와 빼기 항)
- [ ] roll 경계값(0, 1에 가장 가까운 값)
- [ ] dice_rolled 이벤트와 rollDice 변이(커밋 후 재불러오기 동일, 상태 불변, 141자 라벨/없는 화자 거부)
- [ ] API 왕복과 141자 라벨 422
- [ ] 로그 항목에 판정 추가
- [ ] SessionLog가 판정을 보여 줌(표기, 주사위 값, 합계, 라벨 유무)
- [ ] 마스터 왼쪽/플레이어 오른쪽 정렬
- [ ] 컨트롤러가 입력을 해석(판정, 오류, 알 수 없는 명령)과 앱 배선
