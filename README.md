# modern-react-starter

모던 리액트 풀스택 템플릿. 목적과 방향은 [docs/REQUEST.md](docs/REQUEST.md)를 본다.

## 구조

bun workspaces + Turborepo 모노레포.

```
apps/
  demo/        # TanStack Start 템플릿 앱 (@repo/demo)
packages/
  ui/          # 디자인 시스템: Panda preset(토큰·레시피) + 컴포넌트 + Storybook (@repo/ui)
```

- 내부 패키지는 빌드하지 않고 TypeScript 소스를 그대로 내보낸다. 앱의 Vite가 직접 컴파일한다.
- `@repo/ui`는 Panda v2 디자인 시스템이다. `panda lib`이 `dist/panda/`에 테마와 추출된 스타일을 기록하고,
  앱은 `panda.config.ts`의 `designSystem: "@repo/ui"`로 이를 불러온다. 앱의 `include`에 ui 소스를 넣지 않는다.

## 명령

루트에서 실행한다.

| 명령                | 하는 일                                                                         |
| ------------------- | ------------------------------------------------------------------------------- |
| `bun run dev`       | ui의 `panda lib --watch`와 demo의 `vite dev`를 함께 띄운다 (ui 수정 → demo HMR) |
| `bun run typecheck` | 의존 순서대로 codegen 후 타입 검사. 바뀐 패키지만 다시 실행한다 (turbo 캐시)    |
| `bun run test`      | 모든 패키지의 vitest                                                            |
| `bun run build`     | demo 빌드                                                                       |
| `bun run lint`      | oxlint (레포 전체)                                                              |
| `bun run format`    | oxfmt (레포 전체)                                                               |

패키지 하나만: `bunx turbo run test --filter=@repo/ui`, Storybook: `bunx turbo run storybook --filter=@repo/ui`.
