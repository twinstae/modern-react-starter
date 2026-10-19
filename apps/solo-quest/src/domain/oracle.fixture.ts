import type { Oracle } from "./oracle.ts";

/** 구간이 나뉜 d100 표. 고정 난수 0.5면 51이 나와 `불러낸다`가 된다. */
export const ORACLE_ACTION: Oracle = {
  id: "action",
  name: "행동",
  category: "철의 맹세",
  group: "일반",
  sides: 100,
  kind: "ranges",
  rows: [
    { min: 1, max: 50, result: "꾸민다" },
    { min: 51, max: 100, result: "불러낸다" },
  ],
};

/** 한 줄짜리 d100 표 */
export const ORACLE_TROUBLE: Oracle = {
  id: "trouble",
  name: "문제",
  category: "철의 맹세",
  group: "마을",
  sides: 100,
  kind: "ranges",
  rows: [{ min: 1, max: 100, result: "위험이 닥친다" }],
};

/** d6 구간 표. 고정 난수 0.5면 4가 나온다. */
export const ORACLE_WEATHER: Oracle = {
  id: "weather",
  name: "날씨",
  category: "집안 규칙",
  group: "기타",
  sides: 6,
  kind: "ranges",
  rows: [
    { min: 1, max: 3, result: "맑음" },
    { min: 4, max: 6, result: "폭풍" },
  ],
};

/** 눈마다 결과가 하나씩 있는 d6 한 칸씩 표. */
export const ORACLE_NAMES: Oracle = {
  id: "names",
  name: "이름",
  category: "집안 규칙",
  group: "인물",
  sides: 6,
  kind: "single",
  rows: [
    { min: 1, max: 1, result: "가람" },
    { min: 2, max: 2, result: "나래" },
    { min: 3, max: 3, result: "다온" },
    { min: 4, max: 4, result: "라온" },
    { min: 5, max: 5, result: "마루" },
    { min: 6, max: 6, result: "바다" },
  ],
};

/**
 * 줄마다 설명과 링크가 있는 d6 표. 사이퍼처럼 결과를 더 자세히 보여 줄 때 쓴다.
 * 고정 난수 0.5면 4가 나와, 설명과 링크가 둘 다 있는 `최적의 도구`가 된다.
 */
export const ORACLE_CRYPTIC: Oracle = {
  id: "cryptic",
  name: "사이퍼",
  category: "사이퍼 시스템",
  group: "사이퍼",
  sides: 6,
  kind: "ranges",
  rows: [
    { min: 1, max: 3, result: "놀라운 노력", description: "일에 무료 분발 두 단계를 더합니다." },
    {
      min: 4,
      max: 6,
      result: "최적의 도구",
      description: "도구를 쓸 때 보탬 두 개를 더 얻습니다.",
      url: "https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/#최적의-도구",
    },
  ],
};

/** 테스트와 스토리가 함께 쓰는 작은 오라클 목록 */
export const ORACLE_FIXTURES: Oracle[] = [
  ORACLE_ACTION,
  ORACLE_TROUBLE,
  ORACLE_WEATHER,
  ORACLE_NAMES,
];
