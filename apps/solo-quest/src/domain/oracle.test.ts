import { describe, expect, it } from "vitest";

import { SEED_ORACLES } from "../data/oracle-seed.ts";
import {
  collapseRanges,
  emptyRows,
  formatOracleRows,
  inferKind,
  parseOracle,
  parseOracleRows,
  rollOracle,
  rowsByFace,
  type Oracle,
  type OracleKind,
  type OracleRow,
} from "./oracle.ts";

const at = (random: number) => () => random;

const rows = (...pairs: [number, number, string][]) =>
  pairs.map(([min, max, result]) => ({ min, max, result }));

const row = (min: number, max: number, result: string, extra: Partial<OracleRow> = {}) => ({
  min,
  max,
  result,
  ...extra,
});

const input = (overrides: Partial<Oracle> = {}): Oracle => ({
  id: "o-1",
  name: "행동",
  category: "철의 맹세",
  group: "일반",
  sides: 10,
  kind: "ranges",
  rows: rows([1, 4, "꾸민다"], [5, 10, "불러낸다"]),
  ...overrides,
});

describe("오라클 표 읽기", () => {
  it("이름과 결과의 앞뒤 공백을 빼고 줄을 눈 순서로 돌려준다", () => {
    const parsed = parseOracle(
      input({
        name: " 행동 ",
        rows: rows([5, 10, " 불러낸다 "], [1, 4, "꾸민다"]),
      }),
    );

    expect(parsed).toStrictEqual({
      ok: true,
      oracle: {
        id: "o-1",
        name: "행동",
        category: "철의 맹세",
        group: "일반",
        sides: 10,
        kind: "ranges",
        rows: rows([1, 4, "꾸민다"], [5, 10, "불러낸다"]),
      },
    });
  });

  it("설명이 있으면 앞뒤 공백을 빼고 담는다", () => {
    const parsed = parseOracle(input({ description: " 세 열을 합친 것 " }));

    expect(parsed.ok && parsed.oracle.description).toBe("세 열을 합친 것");
  });

  it.each([
    ["빈 이름", { name: "  " }, "내용을 입력해주세요"],
    ["빈 분류", { category: "  " }, "분류: 내용을 입력해주세요"],
    ["빈 묶음", { group: " " }, "묶음: 내용을 입력해주세요"],
    ["면이 1", { sides: 1 }, "주사위 면은 2 이상이어야 합니다"],
    ["면이 정수가 아님", { sides: 10.5 }, "주사위 면은 정수여야 합니다"],
    ["줄이 없음", { rows: [] }, "표에 줄이 하나도 없습니다"],
    ["1부터 시작하지 않음", { rows: rows([2, 10, "가"]) }, "표는 1부터 시작해야 합니다: 2"],
    [
      "범위가 이어지지 않음",
      { rows: rows([1, 4, "가"], [6, 10, "나"]) },
      "범위가 이어지지 않습니다: 5",
    ],
    ["범위가 겹침", { rows: rows([1, 5, "가"], [5, 10, "나"]) }, "범위가 겹칩니다: 5–10"],
    [
      "시작이 끝보다 큼",
      { rows: rows([1, 4, "가"], [8, 6, "나"], [7, 10, "다"]) },
      "범위의 시작이 끝보다 큽니다: 8–6",
    ],
    ["끝까지 덮지 않음", { rows: rows([1, 9, "가"]) }, "표는 10까지 덮어야 합니다: 9"],
    [
      "면을 넘는 범위",
      { rows: rows([1, 4, "가"], [5, 11, "나"]) },
      "범위는 1부터 10 사이여야 합니다: 5–11",
    ],
    [
      "정수가 아닌 범위",
      { rows: rows([1.5, 4, "가"], [5, 10, "나"]) },
      "범위의 시작과 끝은 정수여야 합니다",
    ],
    ["빈 결과", { rows: rows([1, 4, " "], [5, 10, "나"]) }, "1–4: 결과를 입력해주세요"],
    [
      "빈 설명",
      { rows: [row(1, 4, "가", { description: " " }), row(5, 10, "나")] },
      "1–4: 설명을 입력해주세요",
    ],
    [
      "긴 설명",
      { rows: [row(1, 4, "가", { description: "가".repeat(501) }), row(5, 10, "나")] },
      "1–4: 설명은 500자 이하로 입력해주세요",
    ],
    [
      "주소가 아닌 링크",
      { rows: [row(1, 4, "가", { url: "trpg-stelo.netlify.app" }), row(5, 10, "나")] },
      "1–4: 링크는 http://나 https://로 시작하는 주소여야 합니다",
    ],
    [
      "한 칸씩 표에 구간",
      { kind: "single" as const, rows: rows([1, 4, "가"], [5, 10, "나"]) },
      "한 칸씩 표는 눈마다 결과가 하나여야 합니다: 1–4",
    ],
  ])("%s은 오류다", (_name, overrides, message) => {
    expect(parseOracle(input(overrides))).toStrictEqual({ ok: false, message });
  });

  it("한 칸씩 표는 눈마다 줄이 하나씩 있고, 결과가 비면 어느 칸인지 알려 준다", () => {
    expect(
      parseOracle(
        input({
          sides: 2,
          kind: "single",
          rows: rows([1, 1, "앞"], [2, 2, ""]),
        }),
      ),
    ).toStrictEqual({ ok: false, message: "2번 칸: 결과를 입력해주세요" });
  });

  it("결과가 500자를 넘으면 오류다", () => {
    expect(
      parseOracle(input({ rows: rows([1, 4, "가".repeat(501)], [5, 10, "나"]) })),
    ).toStrictEqual({
      ok: false,
      message: "1–4: 결과는 500자 이하로 입력해주세요",
    });
  });

  it("줄에 설명과 링크가 있으면 앞뒤 공백을 빼고 담는다", () => {
    const parsed = parseOracle(
      input({
        rows: [
          row(1, 4, "가", {
            description: " 높은 곳에 있다 ",
            url: " https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/#최적의-도구 ",
          }),
          row(5, 10, "나"),
        ],
      }),
    );

    expect(parsed.ok && parsed.oracle.rows[0]).toStrictEqual(
      row(1, 4, "가", {
        description: "높은 곳에 있다",
        url: "https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/#최적의-도구",
      }),
    );
  });
});

describe("오라클 줄 모양", () => {
  it("눈마다 한 칸씩 있는 표와 구간 표를 줄 모양으로 알아낸다", () => {
    expect(inferKind(rows([1, 1, "가"], [2, 2, "나"]), 2)).toBe("single");
    expect(inferKind(rows([1, 2, "가"]), 2)).toBe("ranges");
    expect(inferKind(rows([1, 1, "가"]), 2)).toBe("ranges");
  });

  it("빈 표는 한 칸씩이면 눈마다 한 줄, 구간이면 한 줄을 만든다", () => {
    expect(emptyRows("single", 3)).toStrictEqual(rows([1, 1, ""], [2, 2, ""], [3, 3, ""]));
    expect(emptyRows("ranges", 3)).toStrictEqual(rows([1, 3, ""]));
  });

  it("구간 표를 눈마다 펼치면 구간의 결과가 그 눈에 그대로 남는다", () => {
    expect(rowsByFace(rows([1, 2, "가"], [3, 4, "나"]), 4)).toStrictEqual(
      rows([1, 1, "가"], [2, 2, "가"], [3, 3, "나"], [4, 4, "나"]),
    );
    expect(rowsByFace([], 2)).toStrictEqual(rows([1, 1, ""], [2, 2, ""]));
  });

  it("눈마다 펼친 표를 다시 접으면 이웃한 눈이 같은 결과끼리 한 구간이 된다", () => {
    const faces = rows([1, 1, "가"], [2, 2, "가"], [3, 3, "나"], [4, 4, ""]);

    expect(collapseRanges(faces, 4)).toStrictEqual(rows([1, 2, "가"], [3, 3, "나"], [4, 4, ""]));
  });

  it("한 칸씩 표로 바꿨다가 되돌려도 구간 표가 그대로다", () => {
    const ranges = [row(1, 2, "가", { description: "설명", url: "https://a/1" }), row(3, 4, "나")];

    expect(collapseRanges(rowsByFace(ranges, 4), 4)).toStrictEqual(ranges);
  });

  it("눈마다 펼쳐도 곁들임(설명·링크)이 따라온다", () => {
    const source = [row(1, 2, "가", { description: "설명", url: "https://a/1" }), row(3, 4, "나")];

    expect(rowsByFace(source, 4)).toStrictEqual([
      row(1, 1, "가", { description: "설명", url: "https://a/1" }),
      row(2, 2, "가", { description: "설명", url: "https://a/1" }),
      row(3, 3, "나"),
      row(4, 4, "나"),
    ]);
  });

  it("결과가 같아도 설명이 다르면 다른 구간으로 남는다", () => {
    const faces = [row(1, 1, "가", { description: "앞" }), row(2, 2, "가", { description: "뒤" })];

    expect(collapseRanges(faces, 2)).toStrictEqual(faces);
  });
});

describe("오라클 표 붙여넣기", () => {
  it("한 칸씩 표는 적어 놓은 눈에 넣고, 나머지는 차례대로 채운다", () => {
    const parsed = parseOracleRows("single", 6, "가\n5, 나\n3, 다");

    expect(parsed).toStrictEqual({
      ok: true,
      rows: rows([1, 1, "가"], [2, 2, ""], [3, 3, "다"], [4, 4, ""], [5, 5, "나"], [6, 6, ""]),
    });
  });

  it("한 칸씩 표는 붙여넣지 않은 칸을 빈 줄로 남긴다", () => {
    const parsed = parseOracleRows("single", 4, "가\n나");

    expect(parsed).toStrictEqual({
      ok: true,
      rows: rows([1, 1, "가"], [2, 2, "나"], [3, 3, ""], [4, 4, ""]),
    });
  });

  it("구간 표는 `53-54, 절벽`, `53, 54, 절벽`, `1, 시작`을 모두 읽는다", () => {
    const parsed = parseOracleRows("ranges", 100, "1, 시작\n53-54, 절벽\n99, 100, 끝");

    expect(parsed).toStrictEqual({
      ok: true,
      rows: rows([1, 1, "시작"], [53, 54, "절벽"], [99, 100, "끝"]),
    });
  });

  it("`00`은 d100에서 100을 뜻한다", () => {
    const parsed = parseOracleRows("single", 100, "00, 마지막");

    expect(parsed.ok && parsed.rows.at(-1)).toStrictEqual({ min: 100, max: 100, result: "마지막" });
  });

  it("빈 줄과 `#` 줄, 표 머리글은 건너뛴다", () => {
    const parsed = parseOracleRows("ranges", 6, "# 메모\n\nd6, 결과\n1-3, 가\n4-6, 나");

    expect(parsed).toStrictEqual({ ok: true, rows: rows([1, 3, "가"], [4, 6, "나"]) });
  });

  it.each<[string, OracleKind, number, string, string]>([
    ["눈이 두 번 나옴", "single", 6, "1, 가\n1, 나", "2번째 줄: 1번이 두 번 나옵니다"],
    ["눈이 주사위를 넘음", "single", 6, "7, 가", "1번째 줄: 눈은 1부터 6 사이여야 합니다: 7"],
    [
      "구간 범위가 주사위를 넘음",
      "ranges",
      6,
      "1-7, 가",
      "1번째 줄: 눈은 1부터 6 사이여야 합니다: 7",
    ],
    ["구간이 겹침", "ranges", 6, "1-3, 가\n3-6, 나", "2번째 줄: 3번이 두 번 나옵니다"],
    [
      "구간을 알아볼 수 없음",
      "ranges",
      6,
      "가나다",
      '1번째 줄: 범위를 "53-54, 절벽"처럼 적어주세요: 가나다',
    ],
  ])("%s이면 오류다", (_name, kind, sides, text, message) => {
    expect(parseOracleRows(kind, sides, text)).toStrictEqual({ ok: false, message });
  });

  it('설명과 링크 칸을 함께 읽고, 쉼표가 있으면 `"`로 감싼다', () => {
    const parsed = parseOracleRows(
      "ranges",
      100,
      '1-3, 놀라운 노력, 일에 분발 두 단계를 더합니다., https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/#놀라운-노력\n4, "가, 나", "설명, 그리고 더"',
    );

    expect(parsed).toStrictEqual({
      ok: true,
      rows: [
        row(1, 3, "놀라운 노력", {
          description: "일에 분발 두 단계를 더합니다.",
          url: "https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/#놀라운-노력",
        }),
        row(4, 4, "가, 나", { description: "설명, 그리고 더" }),
      ],
    });
  });

  it("한 칸씩 표도 결과·설명·링크를 차례대로 읽는다", () => {
    const parsed = parseOracleRows("single", 4, "가, 첫째, https://a/1\n나");

    expect(parsed).toStrictEqual({
      ok: true,
      rows: [
        row(1, 1, "가", { description: "첫째", url: "https://a/1" }),
        row(2, 2, "나"),
        row(3, 3, ""),
        row(4, 4, ""),
      ],
    });
  });

  it("시작·끝을 따로 적은 줄도 설명과 링크까지 읽는다", () => {
    expect(parseOracleRows("ranges", 100, "1, 3, 가, 설명, https://a/1")).toStrictEqual({
      ok: true,
      rows: [row(1, 3, "가", { description: "설명", url: "https://a/1" })],
    });
  });

  it("붙여넣은 글을 다시 내보낼 수 있는 모양으로 만든다", () => {
    expect(formatOracleRows(rows([1, 3, "가"], [4, 4, "나"]), "ranges")).toBe("1-3, 가\n4, 나");
    expect(formatOracleRows(rows([1, 1, "가"], [2, 2, "나"]), "single")).toBe("1, 가\n2, 나");
    expect(
      formatOracleRows(
        [row(1, 3, "가, 나", { description: "설명", url: "https://a/1" }), row(4, 4, "다")],
        "ranges",
      ),
    ).toBe('1-3, "가, 나", 설명, https://a/1\n4, 다');
  });

  it("내보낸 글을 다시 붙여넣으면 같은 표가 된다", () => {
    const source = [
      row(1, 3, "놀라운 노력", {
        description: "일에 분발 두 단계를 더합니다.",
        url: "https://a/1",
      }),
      row(4, 4, "가, 나", { url: "https://a/2" }),
      row(5, 100, "다"),
    ];

    expect(parseOracleRows("ranges", 100, formatOracleRows(source, "ranges"))).toStrictEqual({
      ok: true,
      rows: source,
    });
  });
});

describe("오라클 굴림", () => {
  const oracle = input();

  it.each([
    [0, 1, "꾸민다"],
    [0.3, 4, "꾸민다"],
    [0.4, 5, "불러낸다"],
    [0.999, 10, "불러낸다"],
  ])("난수 %s면 %s이 나와 %s가 된다", (random, value, result) => {
    expect(rollOracle(oracle, at(random))).toStrictEqual({ ok: true, value, result });
  });

  it("줄에 설명과 링크가 있으면 굴린 결과가 함께 돌려준다", () => {
    const cypher = input({
      rows: [
        row(1, 4, "최적의 도구", {
          description: "도구를 쓸 때 보탬 두 개를 더 얻습니다.",
          url: "https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/#최적의-도구",
        }),
        row(5, 10, "나"),
      ],
    });

    expect(rollOracle(cypher, at(0.3))).toStrictEqual({
      ok: true,
      value: 4,
      result: "최적의 도구",
      description: "도구를 쓸 때 보탬 두 개를 더 얻습니다.",
      url: "https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/#최적의-도구",
    });
  });

  it("d6 표도 같은 규칙으로 굴린다", () => {
    const weather = input({
      id: "weather",
      name: "날씨",
      category: "집안 규칙",
      group: "기타",
      sides: 6,
      rows: rows([1, 3, "맑음"], [4, 6, "폭풍"]),
    });

    expect(rollOracle(weather, at(0.5))).toStrictEqual({ ok: true, value: 4, result: "폭풍" });
  });

  it("어느 줄에도 들지 않는 눈이면 오류다", () => {
    const broken = input({ rows: rows([1, 4, "꾸민다"]) });

    expect(rollOracle(broken, at(0.5))).toStrictEqual({
      ok: false,
      message: "6에 해당하는 결과가 없습니다: 행동",
    });
  });
});

describe("오라클 시드", () => {
  it("32개의 오라클이 모두 올바른 표다", () => {
    expect(SEED_ORACLES).toHaveLength(32);

    const problems = SEED_ORACLES.map((oracle) => [oracle.id, parseOracle(oracle)] as const).filter(
      ([, parsed]) => !parsed.ok,
    );

    expect(problems).toStrictEqual([]);
  });

  it("철의 맹세 19개가 일반·장소·인물로 나뉜다", () => {
    const ironsworn = SEED_ORACLES.filter(({ category }) => category === "철의 맹세");
    const countOf = (group: string) => ironsworn.filter((oracle) => oracle.group === group).length;

    expect(ironsworn).toHaveLength(19);
    expect({
      일반: countOf("일반"),
      장소: countOf("장소"),
      인물: countOf("인물"),
    }).toStrictEqual({ 일반: 6, 장소: 7, 인물: 6 });
  });

  it("숫자에 하나씩 대응하는 표와 구간 표가 섞여 있다", () => {
    expect(SEED_ORACLES.find(({ id }) => id === "ironsworn-action")).toMatchObject({
      sides: 100,
      kind: "single",
    });
    expect(SEED_ORACLES.find(({ id }) => id === "ironsworn-action")?.rows).toHaveLength(100);
    expect(SEED_ORACLES.find(({ id }) => id === "ironsworn-location")?.rows[0]).toStrictEqual({
      min: 1,
      max: 1,
      result: "은신처",
    });
    expect(SEED_ORACLES.find(({ id }) => id === "ironsworn-challenge-rank")?.rows).toStrictEqual([
      { min: 1, max: 20, result: "성가신" },
      { min: 21, max: 55, result: "위험한" },
      { min: 56, max: 80, result: "막강한" },
      { min: 81, max: 93, result: "극한" },
      { min: 94, max: 100, result: "서사" },
    ]);
  });
});

describe("사이퍼 오라클 시드", () => {
  const cyphers = SEED_ORACLES.filter(({ category }) => category === "사이퍼 시스템");
  const csrd = cyphers.filter(({ id }) => id.startsWith("csrd-"));

  it("CSRD 표 8개가 모두 `사이퍼` 묶음에 들어 있다", () => {
    expect(csrd.map(({ id }) => id)).toStrictEqual([
      "csrd-cypher",
      "csrd-manifest-cypher-power",
      "csrd-manifest-cypher-하급",
      "csrd-manifest-cypher-중급",
      "csrd-manifest-cypher-고급",
      "csrd-manifest-cypher-특급",
      "csrd-manifest-cypher-초월급",
      "csrd-superhero-cypher",
    ]);
    expect(new Set(cyphers.map(({ group }) => group))).toStrictEqual(new Set(["사이퍼"]));
  });

  it("줄마다 설명과 그 사이퍼 설명으로 가는 링크가 있다", () => {
    const missing = csrd.flatMap((oracle) =>
      oracle.rows
        .filter(({ description, url }) => description === undefined || url === undefined)
        .map(({ result }) => `${oracle.name}: ${result}`),
    );
    const wrongLink = csrd.flatMap((oracle) =>
      oracle.rows
        .filter(
          ({ url }) =>
            url !== undefined &&
            !url.startsWith("https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/#"),
        )
        .map(({ result }) => `${oracle.name}: ${result}`),
    );

    // 슈퍼히어로 표의 마지막 줄은 다른 표를 굴리라는 안내라 링크가 없는 것이 맞다
    expect(missing).toStrictEqual(["슈퍼히어로용 사이퍼: 무작위 사이퍼"]);
    expect(wrongLink).toStrictEqual([]);
  });

  it("무작위 사이퍼 표가 1부터 100까지 덮고, `05-06`은 최적의 도구다", () => {
    const cypher = cyphers.find(({ id }) => id === "csrd-cypher");

    expect(cypher).toMatchObject({ sides: 100, kind: "ranges" });
    expect(cypher?.rows.find(({ min }) => min === 5)).toStrictEqual({
      min: 5,
      max: 6,
      result: "최적의 도구",
      description:
        "일에 도구를 쓸 때, 평소 보탬 한도인 두 개를 넘더라도 추가 보탬 두 개를 얻습니다.",
      url: "https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/#최적의-도구",
    });
    expect(cypher?.rows.at(-1)?.max).toBe(100);
  });
});

describe("아서투르 경 사이퍼 목록 시드", () => {
  const lists = SEED_ORACLES.filter(({ id }) => id.startsWith("arthour-cypher-list-"));

  it("A–E 다섯 표가 `사이퍼` 묶음에 100면 주사위로 들어 있다", () => {
    expect(lists.map(({ id }) => id)).toStrictEqual([
      "arthour-cypher-list-a",
      "arthour-cypher-list-b",
      "arthour-cypher-list-c",
      "arthour-cypher-list-d",
      "arthour-cypher-list-e",
    ]);
    expect(lists.map(({ name }) => name)).toStrictEqual([
      "아서투르 경 사이퍼 목록 A",
      "아서투르 경 사이퍼 목록 B",
      "아서투르 경 사이퍼 목록 C",
      "아서투르 경 사이퍼 목록 D",
      "아서투르 경 사이퍼 목록 E",
    ]);
    expect(lists.map(({ sides, kind }) => ({ sides, kind }))).toStrictEqual(
      Array.from({ length: 5 }, () => ({ sides: 100, kind: "single" })),
    );
    expect(new Set(lists.map(({ group }) => group))).toStrictEqual(new Set(["사이퍼"]));
  });

  it("표마다 1부터 100까지 덮고, 줄마다 설명이 있으며 링크는 없다", () => {
    for (const list of lists) {
      expect(list.rows).toHaveLength(100);
      expect(list.rows.at(0)).toMatchObject({ min: 1, max: 1 });
      expect(list.rows.at(-1)).toMatchObject({ min: 100, max: 100 });
      expect(list.rows.filter(({ description }) => description === undefined)).toStrictEqual([]);
      expect(list.rows.filter(({ url }) => url !== undefined)).toStrictEqual([]);
    }
  });

  it("책의 목록 차례대로 옮겼고, 두 칸을 차지하는 사이퍼는 같은 줄이 둘이다", () => {
    expect(lists[0]?.rows.at(0)?.result).toBe("출입 안경");
    expect(lists[0]?.rows.at(99)?.result).toBe("폭발통 (치유)");
    expect(lists[4]?.rows.at(0)?.result).toBe("감각 교란기");
    expect(lists[4]?.rows.at(99)?.result).toBe("투시기");
    const first = lists[3]?.rows.at(75);
    const second = lists[3]?.rows.at(76);
    expect(first).toMatchObject({ min: 76, max: 76 });
    expect(second).toMatchObject({ min: 77, max: 77 });
    expect({ result: second?.result, description: second?.description }).toStrictEqual({
      result: first?.result,
      description: first?.description,
    });
    expect(first?.result).toBe("재생약");
  });
});
