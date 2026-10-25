# 회고 기록

티켓마다 "다음 에이전트가 더 잘 일하게" 바꾼 것을 남긴다. 결론만 적고, 이미 반영한 것은
`AGENT_PLAYBOOK.md`에만 둔다. 여기에는 왜 바꿨는지와 다음에 확인할 것을 적는다.

## 00001 — 앱 뼈대

**관찰**

- 루트 `bun run ci`가 book-curator와 무관한 `simple-event` 타입 오류와 `solo-quest` lint
  오류로 실패한다. 티켓 인수 조건을 앱 밖의 실패가 막았다.
- 에이전트가 앱 단독 dev/Storybook 확인은 잘했지만, "루트 dev"와 "앱 단독 dev"의 차이를
  스스로 판단해 기록해야 했다. 포트와 확인 방법을 더 명시할 필요가 있었다.
- Vite+ type-aware lint, Storybook 10 viewport, fast-check v4 함정은 티켓 문서에 없었다.
  해결책은 티켓의 "작업하며 배운 것"에만 남아 다음 에이전트가 다시 만날 수 있었다.

**반영**

- `apps/book-curator`에 `check` 스크립트를 더했다. 루트 CI 대신 앱 범위 lint·format·
  typecheck·test를 한 번에 돌리는 커밋 전 게이트다.
- playbook에 루트 CI를 쓰지 않는 이유와 `storybook-static`을 커밋하지 않는 규칙을 적었다.
- 다음 회고 때 확인할 것: 에이전트가 `check`를 실제로 돌렸는지, 루트 CI 실패를 다시
  조사하느라 시간을 썼는지.
