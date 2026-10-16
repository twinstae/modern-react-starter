# vitest browser 모드에서 합성 이벤트가 Ark UI(zag)의 바깥 상호작용을 일으키지 못하고, 요소가 없음을 확인할 단언이 없다

## 환경

- `@siheom/core` 0.3.0, `@siheom/react` 0.3.0
- `vitest` 5.0.3, `@vitest/browser-playwright` 5.0.3 (chromium, headless), `playwright` 1.63.0
- `@testing-library/user-event` 14.6.7
- `react` 19.3.0, `@ark-ui/react` 5.39.3 (`@zag-js/interact-outside` 1.45.0)

## 문제 1: `actions.click`이 바깥 클릭으로 처리되지 않는다

`createDefaultActions`는 `@testing-library/user-event`의 `userEvent.setup()`을 기본 `user`로 쓴다. 테스트는 실제 브라우저(vitest browser 모드)에서 돌지만, 이벤트는 user-event가 JS로 만든 합성 이벤트(`isTrusted: false`)다.

이 합성 이벤트는 Ark UI(zag)의 "바깥 상호작용" 감지(`@zag-js/interact-outside`)에 닿지 않는다. 그래서 팝오버, 셀렉트, 메뉴처럼 바깥을 누르면 닫히는 컴포넌트를 테스트할 수 없다.

### 재현

Ark UI Popover를 연 뒤 바깥 버튼을 누르는 테스트:

```tsx
import { screen, waitFor } from "@testing-library/dom";
import { userEvent } from "vitest/browser";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

it("바깥을 누르면 닫힌다", async () => {
  await runSiheom(
    given.render(<PopoverExample />), // 위에 "바깥 버튼", 아래에 Popover.Trigger "팝오버 열기"
    actions.click(query.button("팝오버 열기")),
    assertions.visible(query.dialog("팝오버 제목")),
    actions.click(query.button("바깥 버튼")), // ❌ 팝오버가 닫히지 않는다
  );

  await waitFor(() => expect(screen.queryByRole("dialog", { name: "팝오버 제목" })).toBeNull());
});
```

- `actions.click(query.button("바깥 버튼"))`을 쓰면 실패한다. 실패 시 스크린샷에서 팝오버가 열린 채로 있고, 바깥 버튼은 가려져 있지 않다.
- 같은 자리를 `await userEvent.click(screen.getByRole("button", { name: "바깥 버튼" }))`로 바꾸면 통과한다. 이 `userEvent`는 `vitest/browser`의 것으로, Playwright가 실제 입력을 보낸다.
- Escape(`actions.type(..., "{Escape}")`)와 닫기 버튼 클릭은 siheom으로도 잘 닫힌다. 바깥 클릭만 실패한다.

### 같은 원인으로 보이는 불안정

Ark UI `Select`에서 옵션을 고른 직후 다른 입력란에 `actions.fill`을 하면, 가끔 입력이 사라진다. 메뉴가 닫히는 과정과 다음 상호작용이 엉키는 것으로 보인다.

- `assertions.not.expanded(combobox)`로 닫히기를 기다려도 완전히 막히지 않았다.
- 지금은 테스트 순서를 바꿔(글을 먼저 쓰고 셀렉트를 나중에 고름) 피하고 있다.

### 제안

vitest browser 모드에서는 실제 입력(`vitest/browser`의 `userEvent`)으로 동작하는 방법이 있으면 좋겠다.

- `createDefaultActions({ user })`는 이미 `user`를 주입받는다. 그리고 `vitest/browser`의 `userEvent`에는 siheom이 쓰는 `click`, `dblClick`, `hover`, `clear`, `type`, `tab`, `upload`가 모두 있다.
- 그런데 `@siheom/react`의 `runSiheom`은 `createDefaultActions()`(기본 user)로 고정되어 있다. act로 감싸는 `wrapInActAsync`, `actAsync`도 공개되어 있지 않다. 그래서 사용하는 쪽에서 user만 바꾼 `runSiheom`을 조립하기 어렵다.
- 다음 중 하나가 가능하면 해결될 것 같다.
  1. `@siheom/react`가 `user`를 받는 팩토리를 공개한다. 예: `createReactSiheom({ user })`
  2. vitest browser 모드용 진입점을 둔다. 예: `@siheom/react/vitest-browser`. 기본 user가 `vitest/browser`의 `userEvent`이고, act로 감싼다.

## 문제 2: 요소가 없음을 확인할 단언이 없다

"기본 캐릭터에는 보관 버튼이 없다", "남은 글자 수는 20자 이하일 때만 보인다"처럼 **요소가 없음**을 확인하고 싶은데, 쓸 수 있는 단언이 없다.

- **`assertions.not.visible(target)`은 요소가 있어도 통과한다.** 구현은 요소가 있으면 `expect(element).not.toHaveAttribute("aria-hidden", "false")`만 확인한다. 그래서 화면에 그대로 보이는 요소에도 통과한다. TDD에서 Red가 나와야 할 테스트가 처음부터 통과해 버려서 알아차리기 어렵다.

  ```tsx
  await runSiheom(
    given.render(<MessageInput {...args} />), // status "마스터 남은 글자 수"가 "140"으로 보이는 상태
    assertions.not.visible(query.status("마스터 남은 글자 수")), // ✅ 통과해 버린다
  );
  ```

- **`assertions.count(target, 0)`은 오류가 난다.** 맞는 요소가 하나도 없으면 "Unable to find role=… and name …"으로 실패한다. 요소를 찾을 때 `getAll…` 계열을 쓰는 것으로 보인다.

### 지금의 우회

`runSiheom`을 여러 번 나눠 부르고(정리는 `afterEach`에서만 하므로 DOM이 남아 있다), 그 사이에 Testing Library로 직접 확인한다.

```tsx
await runSiheom(given.render(<MessageInput {...args} />));
expect(screen.queryByRole("status", { name: "마스터 남은 글자 수" })).toBeNull();

await runSiheom(
  actions.fill(query.textbox("마스터 대화"), "가".repeat(120)),
  assertions.textContent(query.status("마스터 남은 글자 수"), "20"),
);
```

### 제안

- `assertions.not.visible`이 요소가 없거나, 접근성 트리에서 숨겨져 있거나, 화면에 보이지 않을 때만 통과하게 한다. 예를 들어 `waitFor` 안에서 `queryBy…`가 `null`이거나 `not.toBeVisible()`인지 확인한다.
- `assertions.count(target, 0)`을 지원한다(`queryAll…` 사용).
- 또는 이름을 분명히 한 단언을 추가한다. 예: `assertions.absent(target)`
