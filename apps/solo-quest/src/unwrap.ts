/** API가 2xx가 아닌 응답을 돌려줬을 때 던지는 오류 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly value: unknown,
  ) {
    super(`API 오류 ${status}`);
    this.name = "ApiError";
  }
}

type EdenResponse = { data: unknown; error: { status: unknown; value: unknown } | null };
type SuccessData<R extends EdenResponse> = Extract<R, { error: null }>["data"];

/**
 * eden 요청의 `{ data, error }`를 풀어, 성공하면 data를 돌려주고 실패하면 ApiError를 던진다.
 * 호출하는 쪽이 매번 error를 확인하지 않아도 되고, data의 타입은 성공 응답의 타입이 된다.
 */
export async function unwrap<R extends EdenResponse>(request: Promise<R>): Promise<SuccessData<R>> {
  const { data, error } = await request;
  if (error) throw new ApiError(Number(error.status), error.value);
  return data as SuccessData<R>;
}

/** API 오류가 보낸 글(대개 422의 규칙 위반 메시지)을 꺼낸다. 없으면 대신할 메시지다. */
export function messageOfApiError(error: unknown, fallback: string): string {
  return error instanceof ApiError && typeof error.value === "string" ? error.value : fallback;
}
