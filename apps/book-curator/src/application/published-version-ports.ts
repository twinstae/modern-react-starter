import type { PublishedSnapshot } from "../domain/kiosk.ts";

/** 공개한 버전 하나. 한 번 공개한 뒤에는 고치지 않는다(I-11). */
export interface PublishedVersion extends PublishedSnapshot {
  readonly version: number;
}

/**
 * 공개 버전 저장소. `publish`는 지금까지의 최대 버전 + 1로 새 행을 만든다.
 * 손님에게는 가장 최근 버전이 나간다.
 */
export interface PublishedVersionStore {
  /** 버전 오름차순. */
  list(): Promise<PublishedVersion[]>;
  current(): Promise<PublishedVersion | null>;
  publish(snapshot: PublishedSnapshot): Promise<PublishedVersion>;
}
