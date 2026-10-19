import type { Oracle } from "./oracle.ts";

/** 오라클을 읽기만 하는 곳(세션 컨트롤러)이 쓰는 좁은 인터페이스. */
export interface OracleSource {
  /** 등록 순서대로 전체 오라클을 읽는다. */
  list(): Promise<Oracle[]>;
}

/** 오라클 저장소. 세션에 묶이지 않는 전역 자료를 읽고, 덮어쓰고, 지운다. */
export interface OracleStore extends OracleSource {
  /** 같은 id가 있으면 덮어쓴다. */
  save(oracle: Oracle): Promise<void>;
  /** 없는 id를 지워도 오류가 아니다. */
  remove(oracleId: string): Promise<void>;
}

export function createMemoryOracleStore(seed: Oracle[] = []): OracleStore {
  let oracles = [...seed];

  return {
    async list() {
      return [...oracles];
    },
    async save(oracle) {
      const index = oracles.findIndex(({ id }) => id === oracle.id);
      oracles =
        index === -1
          ? [...oracles, oracle]
          : [...oracles.slice(0, index), oracle, ...oracles.slice(index + 1)];
    },
    async remove(oracleId) {
      oracles = oracles.filter(({ id }) => id !== oracleId);
    },
  };
}
