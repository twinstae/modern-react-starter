import type { LogEntry } from "../domain/log-entries.ts";

export function SessionLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section aria-label="세션 로그">{entries.length === 0 && <p>아직 기록이 없습니다</p>}</section>
  );
}
