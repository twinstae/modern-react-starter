import type { LogFailure } from "./failure-log.ts";

/** 이름 붙은 한 단계를 돌린다. 실패하면 그 단계 이름으로 남기고 다시 던진다. */
export type Step = <T>(stage: string, run: () => Promise<T>) => Promise<T>;

/**
 * 앱을 첫 요청 때 한 번만 연다. 여는 과정은 단계마다 이름을 붙여, 실패하면 어느 단계인지
 * 로그에 남는다. 실패한 약속은 버려서 다음 요청이 다시 연다. 한 번의 연결 실패가 그
 * 인스턴스의 모든 요청을 막지 않게 한다.
 */
export function createLazyApp<App>({
  steps,
  logFailure,
}: {
  steps: (step: Step) => Promise<App>;
  logFailure: LogFailure;
}): () => Promise<App> {
  let appPromise: Promise<App> | undefined;

  const step: Step = async (stage, run) => {
    try {
      return await run();
    } catch (error) {
      logFailure({ stage, detail: "앱을 열지 못했습니다", error });
      throw error;
    }
  };

  return () => {
    appPromise ??= steps(step).catch((error: unknown) => {
      appPromise = undefined;
      throw error;
    });
    return appPromise;
  };
}
