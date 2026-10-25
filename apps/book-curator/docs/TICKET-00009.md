# TICKET-00009: 운영자 인증과 태블릿의 주인 잠금

- 스펙: [TECH_SPEC](TECH_SPEC.md) §3.5, ADR 후보 5, I-15, R-6, C-4, C-6
- Blocked by: TICKET-00001
- Status: todo

## 만들 것

- better-auth 이메일+비밀번호. `createApp(deps)`에 auth를 주입하고, elysia 매크로로 운영 API를 감싼다.
- 운영자 계정을 만드는 시드 스크립트(가입 화면은 없다).
- 주인 잠금: 운영자가 PIN을 정하고, 태블릿은 PIN으로 짧게 사는 **주인 토큰**을 받는다. 주인 확인 API(열쇠 건넴, 산 책 기록)는 이 토큰으로 감싼다.
- 화면(표시용 + 스토리 + 테스트): 운영 로그인, PIN 입력.
- `/admin` 라우트 보호.

## 알아야 할 것

- `../qr-quest`의 `src/api/auth.ts`, `src/api/elysia/authGuard.ts`, `src/api/testHelpers.ts`(로그인 쿠키 얻기)를 따른다.
  basePath는 elysia `mount`가 접두사를 떼지 않으므로 `/api/auth`다.
- API 테스트는 메모리 PGlite 위의 실제 better-auth로 로그인한다. 가짜 인증을 만들지 않는다.
- 운영자는 MVP에서 한 역할이다(C-6). 나중에 나눌 수 있게 감싸는 매크로를 한곳에 모은다.
- PIN은 해시로 저장하고, 연속 실패를 제한한다(세부는 구현하며 정한다). 주인 토큰은 몇 분 안에 끝나고 태블릿 메모리에만 있다.
- 주인 휴대폰에서 확인하는 안(C-4)으로 바뀌어도 "주인 토큰으로 감싼 API"는 그대로 쓸 수 있게 둔다.
- 이 앱의 인증 연결은 ROADMAP "인증: better-auth"의 템플릿 예시가 된다.

## 인수 조건

- [ ] 로그인하지 않으면 운영 API가 401이다(api).
- [ ] 시드한 운영자로 로그인하면 운영 API를 부를 수 있다(api).
- [ ] 맞는 PIN이면 주인 토큰을 받고, 틀린 PIN이 이어지면 막힌다(api).
- [ ] 주인 토큰 없이는 주인 확인 API가 401이고, 시간이 지난 토큰도 401이다(api, I-15).
- [ ] 손님 API(`/api/kiosk/current`, `/api/events`)는 로그인 없이 된다(api).
- [ ] 로그인 폼과 PIN 입력이 값을 `onSubmit`에 넘기고, 실패를 보여 준다(컴포넌트).

## 작업하며 배운 것
