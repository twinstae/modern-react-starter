import { styled } from "styled-system/jsx";

const Notice = styled("p", {
  base: { px: "3", py: "1.5", borderRadius: "l2", bg: "red.a3", color: "red.11", fontSize: "sm" },
});

/** 저장하려다 다른 곳의 기록과 충돌해 다시 불러왔음을 알린다. 알림이 없으면 아무것도 그리지 않는다. */
export function ConflictNotice({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Notice role="alert" aria-label={message}>
      {message}
    </Notice>
  );
}
