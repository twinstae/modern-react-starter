import type { Oracle } from "./oracle.ts";

/** 범위가 나뉜 d100 표. 고정 난수 0.5면 51이 나와 `불러낸다`가 된다. */
export const ORACLE_ACTION: Oracle = {
  id: "action",
  name: "행동",
  sides: 100,
  rows: [
    { min: 1, max: 50, result: "꾸민다" },
    { min: 51, max: 100, result: "불러낸다" },
  ],
};

/** 한 줄짜리 d100 표 */
export const ORACLE_TROUBLE: Oracle = {
  id: "trouble",
  name: "문제",
  sides: 100,
  rows: [{ min: 1, max: 100, result: "위험이 닥친다" }],
};

/** d6 표. 고정 난수 0.5면 4가 나온다. */
export const ORACLE_WEATHER: Oracle = {
  id: "weather",
  name: "날씨",
  sides: 6,
  rows: [
    { min: 1, max: 3, result: "맑음" },
    { min: 4, max: 6, result: "폭풍" },
  ],
};

/** 테스트와 스토리가 함께 쓰는 작은 오라클 목록 */
export const ORACLE_FIXTURES: Oracle[] = [ORACLE_ACTION, ORACLE_TROUBLE, ORACLE_WEATHER];
