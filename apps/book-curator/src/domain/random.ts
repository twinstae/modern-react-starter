/**
 * 시드 고정 난수. 같은 시드는 같은 열을 낸다(mulberry32).
 * 도메인은 `Math.random`을 쓰지 않고, 점검처럼 난수가 필요한 곳은 이 함수를 인자로 받는다.
 */
export function seededRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
