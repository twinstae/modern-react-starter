export interface SessionSummary {
  id: string;
  title: string;
  /** Instant, ISO 문자열 */
  createdAt: string;
}

/** 세션 목록 저장소. 세션의 제목과 만든 시각만 다루고, 이벤트 로그는 모른다. */
export interface SessionListStore {
  add(session: SessionSummary): Promise<void>;
  get(id: string): Promise<SessionSummary | null>;
  /** 최근에 만든 세션부터 */
  list(): Promise<SessionSummary[]>;
}

export function createMemorySessionListStore(): SessionListStore {
  const sessions = new Map<string, SessionSummary>();

  return {
    async add(session) {
      sessions.set(session.id, session);
    },
    async get(id) {
      return sessions.get(id) ?? null;
    },
    async list() {
      return [...sessions.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
  };
}
