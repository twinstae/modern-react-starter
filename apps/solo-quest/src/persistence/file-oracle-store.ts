import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { DEFAULT_CATEGORY, DEFAULT_GROUP, inferKind, type Oracle } from "../domain/oracle.ts";
import type { OracleStore } from "../domain/oracle-store.ts";

interface FileShape {
  version: 1;
  /** 이 파일을 마지막으로 시드와 맞춘 시드 버전. 예전에 쓴 파일에는 없다. */
  seedVersion?: number;
  oracles: Oracle[];
}

const isFileShape = (value: unknown): value is FileShape =>
  typeof value === "object" &&
  value !== null &&
  (value as FileShape).version === 1 &&
  Array.isArray((value as FileShape).oracles);

/**
 * 분류와 방식이 없던 때에 쓴 파일도 읽을 수 있게 채운다.
 * 시드에 같은 id의 표가 있으면 그 분류와 묶음을 가져오고, 없으면 기본값으로 두고 줄 모양으로 방식을 알아낸다.
 * 다음에 저장할 때 새 모양으로 다시 쓴다.
 */
const normalize = (oracle: Oracle, seeds: Map<string, Oracle>): Oracle => {
  const seed = seeds.get(oracle.id);
  return {
    ...oracle,
    category: oracle.category ?? seed?.category ?? DEFAULT_CATEGORY,
    group: oracle.group ?? seed?.group ?? DEFAULT_GROUP,
    kind: oracle.kind ?? seed?.kind ?? inferKind(oracle.rows, oracle.sides),
  };
};

/**
 * 오라클 전체를 JSON 파일 하나에 담는다. 파일이 없으면 주어진 시드로 한 번 쓴다.
 * 파일이 있으되 시드 버전이 낮으면, 아직 없는 시드만 더한다. 그래야 새로 넣은 표가 이미 쓰던 사람에게도 보이고,
 * 지운 표가 다음에 켜질 때 되살아나지는 않는다.
 * 서버 프로세스가 하나라고 가정하고, 읽기와 쓰기를 한 줄로 세워 서로 어긋나지 않게 한다.
 * 쓰기는 임시 파일에 쓴 뒤 바꿔 끼워, 쓰다 죽어도 반쪽짜리 파일이 남지 않는다.
 */
export function createFileOracleStore(
  path: string,
  { seed = [], seedVersion = 1 }: { seed?: Oracle[]; seedVersion?: number } = {},
): OracleStore {
  const seeds = new Map(seed.map((oracle) => [oracle.id, oracle]));
  let cache: Oracle[] | undefined;
  /** 같은 파일에 대한 작업을 줄 세운다. 앞 작업이 실패해도 다음 작업은 돈다. */
  let queue: Promise<unknown> = Promise.resolve();
  const withLock = <T>(task: () => Promise<T>): Promise<T> => {
    const result = queue.then(task, task);
    queue = result.catch(() => {});
    return result;
  };

  const load = async (): Promise<Oracle[]> => {
    if (cache) return cache;
    let text: string;
    try {
      text = await readFile(path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      cache = [...seed];
      await write(cache);
      return cache;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`오라클 파일이 올바른 JSON이 아닙니다: ${path}`);
    }
    if (!isFileShape(parsed)) {
      throw new Error(`오라클 파일의 모양이 올바르지 않습니다: ${path}`);
    }
    const oracles = parsed.oracles.map((oracle) => normalize(oracle, seeds));
    if ((parsed.seedVersion ?? 0) >= seedVersion) {
      cache = oracles;
      return cache;
    }
    const known = new Set(oracles.map(({ id }) => id));
    cache = [...oracles, ...seed.filter((oracle) => !known.has(oracle.id))];
    await write(cache);
    return cache;
  };

  const write = async (oracles: Oracle[]) => {
    await mkdir(dirname(path), { recursive: true });
    const body: FileShape = { version: 1, seedVersion, oracles };
    const temporary = `${path}.tmp`;
    await writeFile(temporary, `${JSON.stringify(body, null, 2)}\n`);
    await rename(temporary, path);
  };

  return {
    list: () => withLock(load),
    save: (oracle) =>
      withLock(async () => {
        const oracles = await load();
        const index = oracles.findIndex(({ id }) => id === oracle.id);
        const next =
          index === -1
            ? [...oracles, oracle]
            : [...oracles.slice(0, index), oracle, ...oracles.slice(index + 1)];
        cache = next;
        await write(next);
      }),
    remove: (oracleId) =>
      withLock(async () => {
        const oracles = await load();
        const next = oracles.filter(({ id }) => id !== oracleId);
        cache = next;
        await write(next);
      }),
  };
}
