import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { Oracle } from "../domain/oracle.ts";
import type { OracleStore } from "../domain/oracle-store.ts";

interface FileShape {
  version: 1;
  oracles: Oracle[];
}

const isFileShape = (value: unknown): value is FileShape =>
  typeof value === "object" &&
  value !== null &&
  (value as FileShape).version === 1 &&
  Array.isArray((value as FileShape).oracles);

/**
 * 오라클 전체를 JSON 파일 하나에 담는다. 파일이 없으면 주어진 시드로 한 번 쓴다.
 * 서버 프로세스가 하나라고 가정하고, 읽기와 쓰기를 한 줄로 세워 서로 어긋나지 않게 한다.
 * 쓰기는 임시 파일에 쓴 뒤 바꿔 끼워, 쓰다 죽어도 반쪽짜리 파일이 남지 않는다.
 */
export function createFileOracleStore(
  path: string,
  { seed = [] }: { seed?: Oracle[] } = {},
): OracleStore {
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
    cache = parsed.oracles;
    return cache;
  };

  const write = async (oracles: Oracle[]) => {
    await mkdir(dirname(path), { recursive: true });
    const body: FileShape = { version: 1, oracles };
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
