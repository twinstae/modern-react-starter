# 실행 안내

태블릿 키오스크를 로컬에서 띄우고 확인하는 순서다. 데이터는 `.data/pglite`(git 무시)에
남는다.

## 처음 한 번

```bash
cd apps/book-curator
bun install                 # 루트에서 이미 했으면 생략
bun run seed:published      # 시드 내용이 바뀌었을 때만 새 공개 버전을 만든다
```

시드에는 공개 질문 세트만 들어간다. 서가(책·수량)는 TICKET-00010의 운영 화면이나
별도 시드로 채운다. 아직 공개 버전이 없으면 키오스크는 "질문을 준비하고 있어요"를
보여 준다. 시드 문구나 서랍 데이터가 바뀌면 `seed:published`가 새 버전을 만든다.
공개 버전은 고치지 않는다(I-11).

## 운영자 계정과 주인 PIN

가입 화면은 없다. 환경 변수로 운영자 한 명을 만든다. 같은 이메일이 이미 있으면
아무것도 바꾸지 않으므로 다시 돌려도 안전하다. 비밀번호는 로그에 남기지 않는다.

```bash
cd apps/book-curator
ADMIN_EMAIL=owner@example.com \
ADMIN_PASSWORD='bookshop-79-1' \
ADMIN_NAME='책방 주인' \
bun run seed:operator
```

- 운영자 화면은 `http://localhost:3002/admin`이다. 로그인한 뒤 주인 PIN(숫자 4~6자리)을
  정하거나 바꾼다. PIN은 해시로만 저장된다.
- 주인 토큰은 태블릿 메모리에만 두고 10분 뒤 끝난다. 지금은 `/api/owner/check`가 그
  토큰으로 열리는지 확인하는 자리이고, 실제 주인 확인 API는 TICKET-00012가 잇는다.
- 개발에서는 `BETTER_AUTH_SECRET`이 없어도 요청 origin으로 동작한다. 배포에서는
  `BETTER_AUTH_SECRET`(길고 무작위인 값)과 `BETTER_AUTH_URL`(실제 공개 주소)을 정한다.
  `BETTER_AUTH_URL`을 넣지 않으면 better-auth가 경고를 남긴다.
- 확인:

  ```bash
  curl -i http://localhost:3002/api/admin/me          # 401
  curl -i -H 'content-type: application/json' \
    -d '{"pin":"4821"}' http://localhost:3002/api/owner/unlock
  ```

## 개발

```bash
cd apps/book-curator
bun run dev                 # http://localhost:3002
bun run storybook           # http://localhost:6008
```

- 태블릿 세로 834×1112, 가로 1112×834 뷰포트가 Storybook 기본값이다.
- 키오스크 흐름: 별명 → 문항 → (TICKET-00007 전까지) 완료 안내 → 처음으로.
- 유휴 90초에 "계속하시겠어요?"가 한 번 뜨고, 120초에 처음 화면으로 돌아간다.
  이 값은 `src/domain/idle.ts`의 `IDLE_LIMITS`다.
- 태블릿 이름은 `VITE_KIOSK_NAME`으로 정한다. 예: `VITE_KIOSK_NAME="창가 자리" bun run dev`.
  없으면 "계산대 옆"이다. 이벤트의 `kioskName`에만 쓰고 사람과 연결하지 않는다.
- 이벤트는 `POST /api/events`로 `.data/pglite`의 `funnel_events`에 추가 전용으로 쌓인다.
  전송이 실패해도 화면을 막지 않고, 다음 전송 때 남은 것부터 다시 보낸다.

## 확인

```bash
cd apps/book-curator
bun run check               # lint + format + typecheck + test
bun run check:layout        # Storybook이 6008에 떠 있을 때 화면 겹침·넘침 검사
bun run test run src/domain/turn.test.ts   # 좁은 테스트
```

- API만: `curl http://localhost:3002/api/health`,
  `curl http://localhost:3002/api/kiosk/current`.
- `bun run check`가 PGlite 테스트 때문에 몇 초 걸린다. 정상이다.
- `check:layout`은 `bun run storybook`을 먼저 띄운 뒤 다른 터미널에서 돌린다.
  세로 834×1112, 가로 1112×834에서 결과·질문·별명 화면의 직접 자식이 겹치거나
  화면을 넘지 않는지 본다.
- 루트 `bun run ci`는 `apps/simple-event`와 `solo-quest`의 기존 오류로 실패한다.
  book-curator 게이트로 쓰지 않는다.

## 데이터 초기화

```bash
cd apps/book-curator
rm -rf .data/pglite
bun run seed:published
```

## 자주 막히는 곳

- 첫 화면이 "준비 중"이면 `bun run seed:published`를 안 돌린 것이다.
- Storybook에서 TanStack Start/nitro 플러그인 오류가 나면 `.storybook/main.ts`의
  `viteFinal`이 서버 플러그인을 걸러 내는지 본다.
- 컴포넌트 테스트가 "Failed to import test file"로 죽으면 브라우저 프로젝트의
  `fileParallelism: false`가 유지되는지 본다.
- Panda가 `design_system_token_conflict` info를 내는 것은 앱 테마가 `canvas`·`fg`·
  `border`를 의도적으로 덮기 때문이다. 로컬 값이 이긴다.
