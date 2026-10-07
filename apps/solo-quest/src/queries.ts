import { queryOptions } from "@tanstack/react-query";

import { api } from "./api-client.ts";
import { sessionController } from "./session-client.ts";
import { unwrap } from "./unwrap.ts";

/**
 * 서버 상태의 query option 모음. 같은 option을 라우트 loader의 `queryClient.query`(staleTime: "static"), useSuspenseQuery, 무효화에서 함께 쓴다.
 */
export const sessionQueries = {
  /** 세션 목록. 이 키로 무효화하면 세션 단건 조회도 함께 무효화된다. */
  list: () => queryOptions({ queryKey: ["sessions"], queryFn: () => unwrap(api.sessions.get()) }),
  detail: (id: string) =>
    queryOptions({ queryKey: ["sessions", id], queryFn: () => unwrap(api.sessions({ id }).get()) }),
  /** 세션 화면이 그리는 이벤트 로그와 캐릭터. 로그가 비어 있으면 불러오면서 세션을 시작한다. */
  view: (id: string) =>
    queryOptions({
      queryKey: ["sessions", id, "view"],
      queryFn: () => sessionController(id).load(),
    }),
};
