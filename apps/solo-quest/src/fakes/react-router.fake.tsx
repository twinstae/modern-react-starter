import type { ComponentProps, ReactNode } from "react";

type FakeLinkProps = Omit<ComponentProps<"a">, "href"> & {
  to?: string;
  params?: Record<string, string>;
  children?: ReactNode;
};

/**
 * 컴포넌트 테스트와 Storybook에서 `@tanstack/react-router` 대신 연결되는 가짜 구현체 (fake-aliases.ts).
 * 표시용 컴포넌트가 라우터 없이 렌더링되도록 Link를 `to`와 `params`로 href를 만든 <a>로 그린다.
 * 컴포넌트가 여기 없는 것을 가져오면 테스트가 바로 실패한다. 그때는 컨테이너로 옮길지, 가짜를 늘릴지 정한다.
 */
export function Link({ to = "", params = {}, children, ...props }: FakeLinkProps) {
  const href = to.replace(/\$(\w+)/g, (_, key: string) => encodeURIComponent(params[key] ?? ""));
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
