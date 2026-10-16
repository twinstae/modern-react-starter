# 목록의 항목을 한 번에, 순서와 함께 확인하는 단언 제안 (`assertions.textContents` 외)

## 배경

컴포넌트 테스트를 siheom으로 쓰면서, 목록을 다룰 때 두 가지 일이 되풀이됐다.

- 같은 단언을 항목마다 반복한다.
- siheom 밖으로 나가 `screen.getAllByRole` 등을 직접 쓴다.

아래는 실제 테스트에서 모은 사례다(`@siheom/core`/`@siheom/react` 0.3.0, React 19, vitest browser 모드).

## 사례

### 1. 항목마다 같은 단언을 되풀이한다

판정 두 개가 섞인 세션 로그에서, 항목 하나당 여러 줄을 쓴다.

```tsx
assertions.textContent(query.listitem("플레이어 Player"), "2d6+1"),
assertions.textContent(query.listitem("플레이어 Player"), "[4, 6] + 1"),
assertions.textContent(query.listitem("플레이어 Player"), "= 11"),
assertions.textContent(query.listitem("플레이어 Player"), "자물쇠 따기"),
assertions.textContent(query.listitem("마스터 경비병"), "d20-1"),
assertions.textContent(query.listitem("마스터 경비병"), "[13] - 1"),
assertions.textContent(query.listitem("마스터 경비병"), "= 12"),
```

```tsx
assertions.visible(query.listitem("GM")),
assertions.visible(query.listitem("Player")),
```

### 2. "이것만 있다"(있음과 없음을 함께)를 표현할 수 없다

화자 선택 목록에 활성 캐릭터만 나오는지 확인하려면, 있는 것과 없는 것을 따로 확인해야 한다. 없음은 siheom으로 확인할 수 없어서 Testing Library로 나간다.

```tsx
await runSiheom(
  given.render(<MessageInput {...args} />),
  actions.click(query.combobox("마스터 화자")),
  assertions.visible(query.option("경비병")),
);
const optionNamed = (name: string) => screen.queryByRole("option", { name });
expect(optionNamed("GM")).not.toBeNull();
expect(optionNamed("Player")).not.toBeNull();
expect(optionNamed("상인")).toBeNull(); // 보관된 캐릭터
```

### 3. 순서를 확인할 수 없다

"세션 목록은 최신순"이라는 요구 사항이 있다. 그런데 순서를 확인할 단언이 없어서, 컴포넌트 테스트에서는 순서를 아예 확인하지 않았다. 세션 로그의 기록 순서도 마찬가지다.

### 4. 항목마다 보이는 글을 비교하려고 DOM을 직접 다룬다

같은 화자가 이어 말하면 이름을 생략하는 동작을 확인하는 테스트다. 각 항목의 앞부분(이름)을 꺼내려고 `getAllByRole`과 `textContent`를 직접 쓴다.

```tsx
await runSiheom(given.render(<SessionLog {...Stories.Consecutive.args} />));

const shown = Stories.Consecutive.args.entries.map((entry, index) => {
  const item = screen.getAllByRole("listitem")[index];
  return item?.textContent?.split(entry.content)[0];
});
expect(shown).toStrictEqual(["GM", "", "Player", "GM", "GM"]);
```

### 5. 범위를 좁혀 셀 수 없다

캐릭터 패널에는 "활성 캐릭터" 목록과 "보관된 캐릭터" 목록이 함께 있다. 그런데 `query.listitem(/./)`은 문서 전체의 항목을 센다. 그래서 "활성 캐릭터가 10개"를 확인하려면 다른 목록이 비어 있는 스토리에 기대야 한다.

```tsx
assertions.count(query.listitem(/./), 10), // 보관된 캐릭터 목록의 항목도 함께 센다
```

## 제안

### A. `assertions.textContents(container, expected)`: 항목의 글을 순서대로, 빠짐없이

```ts
assertions.textContents(target: Locator, expected: (string | RegExp)[])
```

- **항목 고르기:** 컨테이너의 역할에 따라 그 안에 직접 속한 항목을 고른다.
  - `list` → `listitem`
  - `listbox` → `option`
  - `menu` → `menuitem`
  - `tablist` → `tab`
  - `radiogroup` → `radio`
  - `table`/`rowgroup` → `row`
  - 중첩된 목록의 항목은 넣지 않는다.
- **비교 방법:** 항목 수와 순서가 정확히 같아야 한다. 그래서 "이것만 있다"(사례 2)와 순서(사례 3)를 한 줄로 표현할 수 있다.
- **각 항목의 비교 기준:**
  - 문자열이면 공백을 정규화한 뒤 **전체 일치**로 비교한다.
  - 정규식이면 일치하는지 본다. 기록 옆의 시각처럼 덜 중요한 글이 섞일 때는 정규식으로 앞부분만 확인한다.
  - 기존 `textContent`는 부분 일치다. 목록에서는 전체 일치가 더 유용해 보이지만, 일관성을 위해 부분 일치를 기본으로 하고 옵션을 둘 수도 있다. 판단은 맡기겠다.
- **실패 메시지:** 기대한 배열과 실제 배열을 diff로 보여 준다. a11y 스냅숏과 함께 보이면 더 좋다.
- **기다리기:** 다른 단언처럼 `waitFor` 안에서 기다린다.

사례 1, 2, 4가 이렇게 바뀐다.

```tsx
actions.click(query.combobox("마스터 화자")),
assertions.textContents(query.listbox("마스터 화자"), ["GM", "Player", "경비병"]), // 상인은 없다

assertions.textContents(query.list("활성 캐릭터"), ["GM", "Player", "상인"]),
assertions.textContents(query.list("보관된 캐릭터"), ["경비병"]),

// 이름이 생략된 항목은 내용으로 시작한다
assertions.textContents(query.list("세션 로그"), [
  /^GM문이 열린다/,
  /^안은 어둡다/,
  /^Player들어간다/,
  /^GM바닥이 삐걱인다/,
  /^GM혼잣말/,
]),
```

### B. `assertions.names(container, expected)`: 항목의 접근성 이름을 순서대로

```ts
assertions.names(target: Locator, expected: (string | RegExp)[])
```

A와 같은 방식으로 항목을 고르고, 글 대신 **접근성 이름**을 비교한다. 항목에 `aria-label`로 "편 + 화자"를 붙여 둔 세션 로그라면, 기록의 순서와 화자를 글과 상관없이 확인할 수 있다.

```tsx
assertions.names(query.list("세션 로그"), ["마스터 GM", "플레이어 Player", "마스터 경비병"]),
```

### C. 범위를 좁히는 쿼리

사례 5를 위한 것이다. 형태는 둘 중 하나를 제안한다.

```ts
query.within(query.list("활성 캐릭터")).listitem(/./); // Testing Library의 within처럼
query.listitem(/./, { within: query.list("활성 캐릭터") });
```

`assertions.count(query.within(query.list("활성 캐릭터")).listitem(/./), 10)`처럼 기존 단언과 그대로 조합된다. A가 있으면 개수만 세는 경우에도 덜 필요해진다.

## 우선순위

- A가 가장 효과가 크다. 반복(사례 1), 있음과 없음(사례 2), 순서(사례 3), DOM 직접 접근(사례 4)이 한 번에 해결된다.
- B, C는 A가 정해진 뒤 같은 모양으로 이어 붙이면 된다.
