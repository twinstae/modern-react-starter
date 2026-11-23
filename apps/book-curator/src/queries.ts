import { queryOptions } from "@tanstack/react-query";

import {
  getAdminAccess,
  getPublishCheck,
  getRecordCounts,
  listDrawers,
  listPublishedVersions,
} from "./admin-api.ts";
import { currentKioskBundle } from "./application/kiosk-bundle.ts";
import { device } from "./device.ts";

/**
 * 손님이 시작할 때 받는 공개 묶음. 한 번 받으면 차례가 끝날 때까지 다시 부르지 않고,
 * 처음으로 돌아갈 때만 라우트가 새로 받는다(I-11).
 */
export const kioskQueries = {
  current: () =>
    queryOptions({
      queryKey: ["kiosk", "current"],
      queryFn: async () => currentKioskBundle((await device()).versions),
      staleTime: Infinity,
    }),
};

/** 운영 화면이 읽는 기기 상태. 고친 뒤에는 해당 query를 무효화한다. */
export const adminQueries = {
  /** 운영 비밀번호를 정했는지, 이 탭에서 로그인했는지. */
  access: () =>
    queryOptions({
      queryKey: ["admin", "access"],
      queryFn: getAdminAccess,
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
  /** 이 태블릿에 쌓인 이벤트·열쇠 건넴의 수. */
  recordCounts: () =>
    queryOptions({
      queryKey: ["admin", "record-counts"],
      queryFn: getRecordCounts,
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
