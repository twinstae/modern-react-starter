export type ServerStatusValue = "checking" | "ok" | "unreachable";

const LABELS: Record<ServerStatusValue, string> = {
  checking: "확인 중",
  ok: "정상",
  unreachable: "연결 안 됨",
};

export function ServerStatus({ status }: { status: ServerStatusValue }) {
  return (
    <p role="status" aria-label="서버 상태">
      {LABELS[status]}
    </p>
  );
}
