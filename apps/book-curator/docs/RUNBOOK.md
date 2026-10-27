# 실행 안내

태블릿 키오스크를 로컬에서 띄우고 확인하는 순서다. 데이터는 `.data/pglite`(git 무시)에
남는다.

## 처음 한 번

```bash
cd apps/book-curator
bun install                 # 루트에서 이미 했으면 생략
bun run seed:published      # 서랍이 없으면 시드 서랍을 만들고, 공개 버전이 없으면 공개한다
```

시드는 서랍 7개에 문항 2개, 예시 책 3권씩이다. 서랍이 이미 있거나 공개 버전이 이미
있으면 그대로 둔다. 공개 버전이 없으면 키오스크는 "질문을 준비하고 있어요"를 보여 준다.
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

- 운영자 화면은 `http://localhost:3002/admin`이다. 탭은 **서랍**과 **주인 PIN** 둘이다.
- **주인 PIN**에서 `새 PIN 만들기`를 누르면 숫자 6자리가 한 번 보인다. 해시로만 저장되므로
  잊으면 새로 만든다. 새로 만들면 예전 PIN은 더 쓸 수 없다.
- 배포에서는 `BETTER_AUTH_SECRET`(길고 무작위인 값)과 `BETTER_AUTH_URL`(실제 공개 주소)을
  정한다.

## 서랍 채우기와 공개

서랍은 이름, 문항, 책만 가진다. 책은 제목·저자·출판사뿐이고 한 서랍에만 든다.

1. **서랍 만들기.** **서랍** 탭 아래 `새 서랍 이름`을 넣고 `서랍 만들기`를 누르면 그
   서랍 페이지로 간다. 목록 순서는 만든 순서이고, 동점이 끝까지 가면 앞 서랍이 이긴다.
2. **문항.** 서랍 페이지의 `문항` 칸에 한 줄에 하나씩 쓴다. 이 서랍이 맞는 손님이라면
   "그렇다"고 답할 문장이다. 서랍마다 2~3개를 권한다. 손님에게는 서랍들의 문항이
   서랍마다 돌아가며 섞여 나온다.
3. **책 올리기.** `양식 내려받기`로 CSV 양식을 받아 채운다. 첫 줄은 `제목,저자,출판사`,
   그 아래 한 줄에 한 권이다. 출판사는 비워도 된다. 엑셀은 "CSV UTF-8(쉼표로 분리)"로,
   구글 시트는 파일 → 다운로드 → 쉼표로 구분된 값(.csv)으로 저장한다. 엑셀의 그냥 "CSV"
   (CP949)도 읽는다. 파일을 고르면 먼저 읽어 보여 주고, `N권 올리기`를 눌러야 서랍에
   더해진다. 한 줄이라도 틀리면 몇 번째 줄인지 알려 주고 아무것도 올리지 않는다.
4. **책 고치기.** 표에서 `고치기`·`빼기`로 한 권씩 다루고, `책 한 권 더하기`로 손으로 한
   권을 더한다.
5. **공개.** **서랍** 탭 아래 `손님 화면에 공개`에서 `지금 서랍으로 공개`를 누르면 지금
   서랍·문항·책이 새 버전이 된다. 서랍을 고쳐도 다시 공개하기 전까지 태블릿은 앞 버전을
   쓴다. 서랍이 2개 미만이거나 문항 없는 서랍이 있으면 공개하지 않는다. 결과가 한 서랍에
   쏠리거나(서랍 수에 맞춘 1/N의 0.7~1.26배 밖), 문항 수가 서랍마다 다르거나, 책이
   3권보다 적으면 경고만 한다.

## 주인 확인과 열쇠 건넴

1. 손님이 결과 화면에서 `주인 확인`을 누르면 PIN 화면이 나온다. 맞으면 10분짜리 주인
   토큰을 태블릿 메모리에만 받는다(I-15).
2. 주인 확인은 추천 서랍, 2순위 서랍, 모든 서랍의 책 제목·저자를 보여 준다.
   `이 서랍 열쇠 건넴` 또는 `{서랍 이름} 열쇠 건넴`을 누르면 추천과 건넨 서랍이 함께
   기록된다(R-7).
3. 태블릿은 "{서랍 이름} 서랍을 열어 보세요"를 보이고, `처음으로`를 누르거나 120초가
   지나면 다음 손님을 위해 처음 화면으로 돌아간다(I-13).

- PIN을 5번 연속 틀리면 60초 잠긴다. PIN을 아직 만들지 않았으면 409로 안내한다.
- 토큰이 끝나면 확인 화면은 PIN 화면으로 돌아간다.

## 개발

```bash
cd apps/book-curator
bun run dev                 # http://localhost:3002
bun run storybook           # http://localhost:6008
```

- 태블릿 세로 834×1112, 가로 1112×834 뷰포트가 Storybook 기본값이다.
- 키오스크 흐름: 별명 → 문항 → 결과 → (주인 확인) → 서랍 속 책 → 처음으로.
- 손님 차례에는 유휴 90초에 "계속하시겠어요?"가 한 번 뜨고, 120초에 처음 화면으로
  돌아간다. 값은 `src/domain/idle.ts`의 `IDLE_LIMITS`다. 주인 모드에서는 이 타이머를
  멈추고 10분 주인 토큰 만료를 쓴다.
- 태블릿 이름은 `VITE_KIOSK_NAME`으로 정한다. 예: `VITE_KIOSK_NAME="창가 자리" bun run dev`.
  없으면 "계산대 옆"이다. 이벤트의 `kioskName`에만 쓰고 사람과 연결하지 않는다.
- 이벤트는 `POST /api/events`로 `.data/pglite`의 `funnel_events`에 추가 전용으로 쌓인다.
  전송이 실패해도 화면을 막지 않고, 다음 전송 때 남은 것부터 다시 보낸다.

## 확인

```bash
cd apps/book-curator
bun run check               # design boundary + lint + format + typecheck + test
bun run build               # 프리렌더까지 확인. API·DB는 첫 요청 때 열린다
bun run check:layout        # Storybook이 6008에 떠 있을 때 화면 겹침·넘침 검사
bun run test run src/domain/turn.test.ts   # 좁은 테스트
```

- API만: `curl http://localhost:3002/api/health`,
  `curl http://localhost:3002/api/kiosk/current`.
- `bun run check`가 PGlite 테스트 때문에 몇 초 걸린다. 정상이다.
- `check:layout`은 `bun run storybook`을 먼저 띄운 뒤 다른 터미널에서 돌린다.
  세로 834×1112, 가로 1112×834에서 결과·질문·별명·주인 확인·서랍 속 책 화면의
  직접 자식이 겹치거나 화면을 넘지 않는지 본다.
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
