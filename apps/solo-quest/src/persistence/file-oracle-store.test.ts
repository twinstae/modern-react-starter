import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ORACLE_ACTION, ORACLE_TROUBLE, ORACLE_WEATHER } from "../domain/oracle.fixture.ts";
import { createFileOracleStore } from "./file-oracle-store.ts";

describe("JSON 파일 오라클 저장소", () => {
  let dir: string;
  const path = () => join(dir, "oracles.json");

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "oracles-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("파일이 없으면 시드로 한 번 쓰고 그대로 돌려준다", async () => {
    const store = createFileOracleStore(path(), { seed: [ORACLE_ACTION] });
    const expected = { version: 1, oracles: [ORACLE_ACTION] };

    expect(await store.list()).toStrictEqual([ORACLE_ACTION]);
    expect(JSON.parse(await readFile(path(), "utf8"))).toStrictEqual(expected);
    // 다음에 만들면 파일에서 읽는다
    expect(await createFileOracleStore(path()).list()).toStrictEqual([ORACLE_ACTION]);
  });

  it("시드가 없고 파일도 없으면 빈 표를 돌려준다", async () => {
    expect(await createFileOracleStore(path()).list()).toStrictEqual([]);
  });

  it("저장하면 같은 id를 덮어쓰고, 다른 저장소 인스턴스에서도 보인다", async () => {
    const store = createFileOracleStore(path(), { seed: [ORACLE_ACTION] });
    await store.list();

    await store.save({ ...ORACLE_TROUBLE, name: "문제 (고침)" });
    await store.save(ORACLE_WEATHER);
    await store.save({ ...ORACLE_ACTION, name: "행동 (고침)" });

    expect(await createFileOracleStore(path()).list()).toStrictEqual([
      { ...ORACLE_ACTION, name: "행동 (고침)" },
      { ...ORACLE_TROUBLE, name: "문제 (고침)" },
      ORACLE_WEATHER,
    ]);
  });

  it("지우면 파일에서도 사라지고, 없는 id를 지워도 오류가 아니다", async () => {
    const store = createFileOracleStore(path(), { seed: [ORACLE_ACTION, ORACLE_TROUBLE] });
    await store.list();

    await store.remove(ORACLE_ACTION.id);
    await store.remove("없는-오라클");

    expect(await store.list()).toStrictEqual([ORACLE_TROUBLE]);
    expect(await createFileOracleStore(path()).list()).toStrictEqual([ORACLE_TROUBLE]);
  });

  it("망가진 파일은 조용히 덮어쓰지 않고 오류로 알린다", async () => {
    await writeFile(path(), "{ 이건 JSON이 아니다");

    await expect(createFileOracleStore(path()).list()).rejects.toThrow(
      "오라클 파일이 올바른 JSON이 아닙니다",
    );
  });

  it("모양이 다른 JSON도 오류다", async () => {
    await writeFile(path(), JSON.stringify({ version: 2, oracles: [] }));

    await expect(createFileOracleStore(path()).list()).rejects.toThrow(
      "오라클 파일의 모양이 올바르지 않습니다",
    );
  });
});
