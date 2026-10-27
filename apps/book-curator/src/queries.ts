import { queryOptions } from "@tanstack/react-query";

import { getAdminMe, getPublishCheck, listDrawers, listPublishedVersions } from "./admin-api.ts";
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
  /** 서랍·문항·책 전부. 서랍을 고친 뒤에는 이 query와 공개 점검을 무효화한다. */
  drawers: () =>
    queryOptions({
      queryKey: ["admin", "drawers"],
      queryFn: listDrawers,
      retry: false,
      staleTime: 0,
    }),
  /** 지금 서랍들을 공개해도 되는지 보는 자동 점검. */
  publishCheck: () =>
    queryOptions({
      queryKey: ["admin", "publish-check"],
      queryFn: getPublishCheck,
      retry: false,
      staleTime: 0,
    }),
  publishedVersions: () =>
    queryOptions({
      queryKey: ["admin", "published-versions"],
      queryFn: listPublishedVersions,
      retry: false,
      staleTime: 0,
    }),
};
