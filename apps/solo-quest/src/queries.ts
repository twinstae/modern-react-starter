import { queryOptions } from "@tanstack/react-query";

import { api } from "./api-client.ts";
import { sessionController } from "./session-client.ts";
import { unwrap } from "./unwrap.ts";

/**
 * 서버 상태의 query option 모음. 같은 option을 라우트 loader의 `queryClient.query`(staleTime: "static"), useSuspenseQuery, 무효화에서 함께 쓴다.
 */
export const oracleQueries = {
  /** 세션과 무관한 전역 오라클 목록. 오라클을 고치면 이 키로 무효화한다. */
  list: () => queryOptions({ queryKey: ["oracles"], queryFn: () => unwrap(api.oracles.get()) }),
};

export const sessionQueries = {
  /** 세션 목록. 이 키로 무효화하면 세션 단건 조회도 함께 무효화된다. */
  list: () => queryOptions({ queryKey: ["sessions"], queryFn: () => unwrap(api.sessions.get()) }),
  detail: (id: string) =>
    queryOptions({ queryKey: ["sessions", id], queryFn: () => unwrap(api.sessions({ id }).get()) }),
  /**
   * 세션 하나를 메모리에서 이어 가는 컨트롤러. 만들면서 로그를 한 번 읽고(비어 있으면 세션을 시작한다),
   * 그 뒤로는 컨트롤러가 상태를 들고 있으므로 다시 불러오지 않는다. 세션 목록 키와 따로 두어 무효화에 딸려 오지 않는다.
   */
  controller: (id: string) =>
    queryOptions({
      queryKey: ["session-controllers", id],
      queryFn: async () => {
        const controller = sessionController(id);
        await controller.load();
        return controller;
      },
      staleTime: Infinity,
    }),
};
