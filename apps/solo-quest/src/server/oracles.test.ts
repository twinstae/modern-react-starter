import { describe, expect, it } from "vite-plus/test";

import { ORACLE_ACTION, ORACLE_TROUBLE } from "../domain/oracle.fixture.ts";
import { createMemoryOracleStore } from "../domain/oracle-store.ts";
import { unwrap } from "../unwrap.ts";
import { createTestClient } from "./test-client.ts";

const seeded = () => createMemoryOracleStore([ORACLE_ACTION, ORACLE_TROUBLE]);

describe("오라클 API", () => {
  it("저장된 오라클을 모두 돌려준다", async () => {
    const client = createTestClient({ oracleStore: seeded() });

    expect(await unwrap(client.oracles.get())).toStrictEqual([ORACLE_ACTION, ORACLE_TROUBLE]);
  });

  it("오라클을 새로 넣으면 목록에 더해지고, 다시 넣으면 덮어쓴다", async () => {
    const client = createTestClient({ oracleStore: seeded() });
    const weather = {
      name: "날씨",
      category: "집안 규칙",
      group: "기타",
      sides: 6,
      kind: "ranges" as const,
      rows: [
        { min: 1, max: 3, result: "맑음" },
        { min: 4, max: 6, result: "폭풍" },
      ],
    };

    expect(await unwrap(client.oracles({ id: "weather" }).put(weather))).toStrictEqual({
      id: "weather",
      ...weather,
    });
    expect((await unwrap(client.oracles.get())).map(({ id }) => id)).toStrictEqual([
      "action",
      "trouble",
      "weather",
    ]);

    const renamed = { ...weather, name: " 하늘 ", description: "  d6 표  " };
    expect(await unwrap(client.oracles({ id: "weather" }).put(renamed))).toStrictEqual({
      id: "weather",
      name: "하늘",
      category: "집안 규칙",
      group: "기타",
      sides: 6,
      kind: "ranges",
      description: "d6 표",
      rows: weather.rows,
    });
    expect(await unwrap(client.oracles.get())).toHaveLength(3);
  });

  it("규칙을 어긴 표는 422와 이유를 돌려주고 저장하지 않는다", async () => {
    const client = createTestClient({ oracleStore: seeded() });

    await expect(
      unwrap(
        client.oracles({ id: "broken" }).put({
          name: "빈틈",
          category: "철의 맹세",
          group: "일반",
          sides: 100,
          kind: "ranges",
          rows: [{ min: 1, max: 99, result: "가" }],
        }),
      ),
    ).rejects.toMatchObject({ status: 422, value: "표는 100까지 덮어야 합니다: 99" });
    expect((await unwrap(client.oracles.get())).map(({ id }) => id)).toStrictEqual([
      "action",
      "trouble",
    ]);
  });

  it("한 칸씩 표에 구간 줄이 있으면 422다", async () => {
    const client = createTestClient({ oracleStore: seeded() });

    await expect(
      unwrap(
        client.oracles({ id: "mixed" }).put({
          name: "섞임",
          category: "철의 맹세",
          group: "일반",
          sides: 6,
          kind: "single",
          rows: [
            { min: 1, max: 3, result: "맑음" },
            { min: 4, max: 6, result: "폭풍" },
          ],
        }),
      ),
    ).rejects.toMatchObject({
      status: 422,
      value: "한 칸씩 표는 눈마다 결과가 하나여야 합니다: 1–3",
    });
  });

  it("오라클을 지우면 목록에서 빠지고, 없는 id를 지워도 204다", async () => {
    const client = createTestClient({ oracleStore: seeded() });

    await unwrap(client.oracles({ id: "action" }).delete());
    await unwrap(client.oracles({ id: "없는-오라클" }).delete());

    expect(await unwrap(client.oracles.get())).toStrictEqual([ORACLE_TROUBLE]);
  });
});
