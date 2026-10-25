import { queryOptions } from "@tanstack/react-query";

import { api } from "./api-client.ts";
import { unwrap } from "./unwrap.ts";

/** 서버 상태 query option. 라우트 loader와 useSuspenseQuery가 같은 option을 쓴다. */
export const healthQueries = {
  current: () => queryOptions({ queryKey: ["health"], queryFn: () => unwrap(api.health.get()) }),
};
