import { queryOptions } from "@tanstack/react-query";

import { api } from "./api-client.ts";
import { unwrap } from "./unwrap.ts";

/**
 * 서버 상태의 query option 모음. 같은 option을 라우트 loader의 prefetch, useSuspenseQuery, 무효화에서 함께 쓴다.
 */
export const sessionQueries = {
  /** 세션 목록. 이 키로 무효화하면 세션 단건 조회도 함께 무효화된다. */
  list: () => queryOptions({ queryKey: ["sessions"], queryFn: () => unwrap(api.sessions.get()) }),
  detail: (id: string) =>
    queryOptions({ queryKey: ["sessions", id], queryFn: () => unwrap(api.sessions({ id }).get()) }),
};
