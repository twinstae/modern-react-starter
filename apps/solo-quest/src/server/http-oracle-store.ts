import type { Oracle } from "../domain/oracle.ts";
import type { OracleStore } from "../domain/oracle-store.ts";
import { unwrap } from "../unwrap.ts";
import type { createApiClient } from "../api-client.ts";

/** eden 클라이언트로 서버의 오라클 API를 부르는 저장소. 브라우저가 전역 오라클을 읽고 고친다. */
export function createHttpOracleStore(client: ReturnType<typeof createApiClient>): OracleStore {
  return {
    list: () => unwrap(client.oracles.get()),
    async save(oracle: Oracle) {
      await unwrap(
        client.oracles({ id: oracle.id }).put({
          name: oracle.name,
          category: oracle.category,
          group: oracle.group,
          sides: oracle.sides,
          kind: oracle.kind,
          ...(oracle.description !== undefined && { description: oracle.description }),
          rows: oracle.rows,
        }),
      );
    },
    async remove(oracleId) {
      await unwrap(client.oracles({ id: oracleId }).delete());
    },
  };
}
