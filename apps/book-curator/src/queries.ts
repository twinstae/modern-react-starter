import { queryOptions } from "@tanstack/react-query";

import { api } from "./api-client.ts";
import { parseKioskCurrent } from "./domain/kiosk.ts";
import { unwrap } from "./unwrap.ts";

/** 서버 상태 query option. 라우트 loader와 useSuspenseQuery가 같은 option을 쓴다. */
export const healthQueries = {
  current: () => queryOptions({ queryKey: ["health"], queryFn: () => unwrap(api.health.get()) }),
};

/**
 * 손님이 시작할 때 받는 공개 묶음. 한 번 받으면 차례가 끝날 때까지 다시 부르지 않고,
 * 처음으로 돌아갈 때만 라우트가 새로 받는다(I-11).
 */
export const kioskQueries = {
  current: () =>
    queryOptions({
      queryKey: ["kiosk", "current"],
      queryFn: async () => parseKioskCurrent(await unwrap(api.kiosk.current.get())),
      staleTime: Infinity,
    }),
};
