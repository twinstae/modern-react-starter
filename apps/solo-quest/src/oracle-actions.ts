import { api } from "./api-client.ts";
import type { Oracle } from "./domain/oracle.ts";
import { messageOfApiError, unwrap } from "./unwrap.ts";

/** 오라클을 저장한다. 규칙을 어겼거나 서버가 거절하면 보여 줄 메시지를 돌려준다. */
export async function saveOracle(oracle: Oracle): Promise<string | undefined> {
  try {
    await unwrap(
      api.oracles({ id: oracle.id }).put({
        name: oracle.name,
        category: oracle.category,
        group: oracle.group,
        sides: oracle.sides,
        kind: oracle.kind,
        ...(oracle.description !== undefined && { description: oracle.description }),
        rows: oracle.rows,
      }),
    );
  } catch (error) {
    return messageOfApiError(error, "오라클을 저장하지 못했습니다");
  }
  return undefined;
}

/** 오라클을 지운다. 저장과 달리 돌이킬 수 없으므로 화면이 한 번 더 확인한다. */
export async function removeOracle(oracleId: string): Promise<string | undefined> {
  try {
    await unwrap(api.oracles({ id: oracleId }).delete());
  } catch (error) {
    return messageOfApiError(error, "오라클을 지우지 못했습니다");
  }
  return undefined;
}
