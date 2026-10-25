# book-curator

이 앱에서 일할 때 먼저 읽을 것.

1. `docs/AGENT_PLAYBOOK.md` — 작업 원칙, 이미 있는 코어, 테스트·커밋 규칙.
2. `docs/TICKET-XXXXX.md` — 지금 티켓의 인수 조건.
3. `CONTEXT.md` — 용어. `docs/TECH_SPEC.md` — 경계와 불변식(필요한 절만).
4. `docs/DESIGN.md` — 색·글꼴·문구·레이아웃 기준과 레퍼런스.
5. `docs/RUNBOOK.md` — 시드, 개발 서버, Storybook, 테스트 명령.
6. `docs/OPEN-QUESTIONS.md` — 사람이 정할 것. 새 `[가정]` 값이 생기면 여기에 먼저 더한다.

커밋 전 게이트는 `cd apps/book-curator && bun run check` 하나다. 루트 `bun run ci`는
다른 앱의 기존 오류로 실패하므로 쓰지 않는다.

`apps/simple-event`는 다른 작업 중이다. 건드리지 않는다. 커밋은 자기 경로만 명시해서
더한다(`git add -A` 금지).
