import { queryOptions } from "@tanstack/react-query";

import { getAdminMe, getAdminShelf } from "./admin-api.ts";
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

/** 운영자 세션. 브라우저에서만 부르고, 401이면 `null`이라 로그인 화면을 보여 준다. */
export const adminQueries = {
  me: () =>
    queryOptions({
      queryKey: ["admin", "me"],
      queryFn: getAdminMe,
      retry: false,
      staleTime: 0,
    }),
  /**
   * 서가의 책·서랍 속 책·서랍 이름·게이트를 한 번에 읽는 단일 query.
   * 책이나 수량을 고친 뒤 이 query를 무효화해 두 탭이 같은 값을 본다.
   */
  shelf: () =>
    queryOptions({
      queryKey: ["admin", "shelf"],
      queryFn: getAdminShelf,
      retry: false,
      staleTime: 0,
    }),
};
