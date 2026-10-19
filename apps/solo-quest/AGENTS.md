# solo-quest 작업 규칙

## 컴포넌트 테스트는 siheom 공개 API 문서를 먼저 읽는다

`@siheom/react`의 query·action·assertion 이름과 역할은 설치된 패키지 버전에 따라 다를 수 있다.
`node_modules` 안의 타입 정의나 구현을 뒤지지 말고, 아래 문서를 먼저 읽고 그대로 따른다.

- https://github.com/twinstae/siheom-ts/blob/main/.claude/skills/siheom-frontend-test/SKILL.md
- https://github.com/twinstae/siheom-ts/blob/main/.claude/skills/siheom-frontend-test/API.md

`@siheom/core`에서 직접 가져오지 않는다. 앱 테스트는 `@siheom/react` 하나만 쓴다.

접근성 이름으로 찾는다. placeholder·`data-testid`·CSS로는 찾지 않는다.
없는 이름이면 컴포넌트에 `aria-label`이나 `<label>`을 먼저 붙인다.
Ark UI Select는 `query.combobox("레이블")`, 표는 `query.table`/`query.listitem`, 구역은 `query.region("aria-label")`이다.

## 테스트는 기능과 함께 쓴다

기능을 다 만든 뒤 테스트를 몰아서 붙이지 않는다.
한 동작씩 `it`을 먼저 쓰고 빨간 것을 확인한 뒤, 그 테스트를 통과시키는 만큼 코드를 쓴다.
`runSiheom` 사슬은 `given.render` → `actions` → `assertions` 차례로 읽히게 적는다.
