/** 서버가 실패한 곳. `stage`는 어느 과정인지, `detail`은 그 과정의 무엇인지(요청 경로 등)다. */
export interface FailureLog {
  readonly stage: string;
  readonly detail: string;
  readonly error: unknown;
}

export type LogFailure = (entry: FailureLog) => void;

/** 운영 로그. Vercel 함수 로그에서 `[book-curator]`로 찾는다. 비밀 값은 넣지 않는다. */
export const consoleFailureLog: LogFailure = ({ stage, detail, error }) => {
  console.error(`[book-curator] ${stage} 실패: ${detail}`, error);
};
