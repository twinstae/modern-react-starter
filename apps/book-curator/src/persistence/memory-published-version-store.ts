import type {
  PublishedVersion,
  PublishedVersionStore,
} from "../application/published-version-ports.ts";
import { parsePublishedSnapshot, toPublishedSnapshotDto } from "../domain/kiosk.ts";

/** 공개 버전을 프로세스 메모리에 둔다. 저장할 때 복사하므로 공개한 버전은 그대로 남는다. */
export function createMemoryPublishedVersionStore(): PublishedVersionStore {
  const versions: PublishedVersion[] = [];

  return {
    async list() {
      return [...versions];
    },
    async current() {
      return versions.at(-1) ?? null;
    },
    async publish(snapshot) {
      const published = {
        version: versions.length + 1,
        ...parsePublishedSnapshot(toPublishedSnapshotDto(snapshot)),
      };
      versions.push(published);
      return published;
    },
  };
}
