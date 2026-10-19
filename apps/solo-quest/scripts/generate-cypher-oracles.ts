/**
 * CSRD 사이퍼 표를 오라클 시드로 옮긴다.
 *
 * 원본: trpg-stelo의 `src/data/cypher-srd/ko/cyphers.md` (기본 경로는 저장소 옆 디렉터리).
 * 결과: `apps/solo-quest/src/data/oracle-cypher-seed.ts`
 *
 * 실행: `bun run data:cyphers` (다른 경로면 `bun scripts/generate-cypher-oracles.ts <경로>`)
 *
 * 각 줄은 이름(결과), 효과 첫 문장(설명), 그리고 그 사이퍼 설명으로 가는 사이트 링크를 가진다.
 * 링크의 anchor는 md 제목을 github-slugger 규칙으로 바꾼 것이고, 빌드된 사이트 HTML에 그 id가
 * 있는지 확인한 뒤에만 쓴다(없으면 생성이 실패한다).
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// 스크립트는 `apps/solo-quest/scripts`에 있고, 원본 저장소는 이 저장소 옆에 있다.
const REPOSITORY = new URL("../../../../trpg-stelo/", import.meta.url);

const source =
  process.argv[2] ?? fileURLToPath(new URL("src/data/cypher-srd/ko/cyphers.md", REPOSITORY));
const builtPage = fileURLToPath(new URL("dist/ko/cypher-srd/cyphers/index.html", REPOSITORY));
const target = new URL("../src/data/oracle-cypher-seed.ts", import.meta.url);

/** 사이트 주소. 표마다 같은 페이지에 있고, 줄마다 뒤에 제목 anchor가 붙는다. */
const SITE = "https://trpg-stelo.netlify.app/ko/cypher-srd/cyphers/";

const DESCRIPTION_MAX = 160;

/** github-slugger와 같은 규칙으로 제목을 anchor로 바꾼다. 같은 제목이 두 번 나오면 뒤에 -1을 붙인다. */
function slugger() {
  const seen = new Map<string, number>();
  return (heading: string) => {
    const base = heading
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s+/g, "-");
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

const text = await readFile(source, "utf8");
const lines = text.split("\n");

/** `### 제목`부터 다음 `### ` 전까지의 줄들. 굵게 쓴 제목(`### **제목**`)도 같은 절이다. */
function section(title: string): string[] {
  const wanted = new RegExp(
    `^###\\s+\\**\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\**\\s*$`,
  );
  const start = lines.findIndex((line) => wanted.test(line));
  if (start === -1) throw new Error(`절을 찾지 못했습니다: ${title}`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("### ") || line.startsWith("## "));
  return end === -1 ? rest : rest.slice(0, end);
}

/** 표에서 `| 01-03 | 이름 |` 줄을 읽는다. `00`은 100이다. */
function table(title: string, columns = 2) {
  const rows: { min: number; max: number; name: string }[] = [];
  for (const line of section(title)) {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < columns) continue;
    const range = /^(\d{2})(?:-(\d{2}))?$/.exec(cells[0]);
    if (!range) continue;
    const min = Number(range[1]) || 100;
    const max = Number(range[2] ?? range[1]) || 100;
    rows.push({ min, max, name: cells[1] });
  }
  return rows;
}

/** `#### 이름` 절마다 효과 첫 문장을 모은다. 제목 차례는 문서 차례 그대로다. */
function effects() {
  const found: { heading: string; effect: string }[] = [];
  for (const [index, line] of lines.entries()) {
    const heading = /^####\s+(.+?)\s*$/.exec(line);
    if (!heading) continue;
    let effect = "";
    for (const next of lines.slice(index + 1)) {
      if (/^####\s/.test(next) || /^###\s/.test(next) || /^##\s/.test(next)) break;
      const bullet = /^\*\*효과:\*\*\s*(.+)$/.exec(next);
      if (bullet) {
        effect = bullet[1].trim();
        break;
      }
    }
    found.push({ heading: heading[1].trim(), effect });
  }
  return found;
}

/** 첫 문장만 남긴다. 길면 자르고 말줄임표를 붙인다. */
function firstSentence(value: string) {
  const sentence = /^(.+?[.!?])(?:\s|$)/.exec(value)?.[1] ?? value;
  return sentence.length > DESCRIPTION_MAX
    ? `${sentence.slice(0, DESCRIPTION_MAX - 1)}…`
    : sentence;
}

const details = effects();

/**
 * 이름에 맞는 상세 설명 절을 찾는다. `순간이동기 (단거리형)`처럼 종류가 뒤에 붙은 표는
 * 종류를 떼고(`순간이동기`) 그 절을 쓴다. 그 절의 표가 종류를 가르기 때문이다.
 */
function detailOf(name: string) {
  const exact = details.find((each) => each.heading === name);
  if (exact) return exact;
  const base = name.replace(/\s*\(.+\)\s*$/, "").trim();
  return details.find((each) => each.heading === base);
}

const slug = slugger();
const links = new Map<string, string>();
for (const { heading } of details) links.set(heading, slug(heading) || "");

// 빌드된 사이트에 실제로 있는 id만 쓴다. 없으면 실패해서 잘못된 링크가 시드에 들어가지 않게 한다.
const built = await readFile(builtPage, "utf8").catch(() => undefined);
// 사이트는 제목을 `<div id="...">`로 감싸므로 id 속성을 모두 모은다.
const ids = new Set(built ? [...built.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]) : []);
const urlOf = (name: string) => {
  const heading = detailOf(name)?.heading;
  const anchor = heading ? links.get(heading) : undefined;
  if (!anchor) throw new Error(`상세 설명 절이 없습니다: ${name}`);
  if (built && !ids.has(anchor)) throw new Error(`사이트에 없는 anchor입니다: ${anchor}`);
  return `${SITE}#${anchor}`;
};

/** 표의 이름마다 결과·설명·링크를 채운다. */
const rowsOf = (title: string, columns = 2) =>
  table(title, columns).map(({ min, max, name }) => {
    const effect = detailOf(name)?.effect ?? "";
    if (effect === "") throw new Error(`효과가 없습니다: ${name}`);
    return {
      min,
      max,
      result: name,
      description: firstSentence(effect),
      url: urlOf(name),
    };
  });

const oracles = [
  {
    id: "csrd-cypher",
    name: "사이퍼",
    group: "사이퍼",
    sides: 100,
    kind: "ranges" as const,
    description: "CSRD 무작위 사이퍼 표. 은근한 사이퍼(비물리적) 여든여섯 가지를 굴린다.",
    rows: rowsOf("무작위 사이퍼"),
  },
  {
    id: "csrd-manifest-cypher-power",
    name: "명백한 사이퍼 위력",
    group: "사이퍼",
    sides: 100,
    kind: "ranges" as const,
    description: "명백한 사이퍼를 무작위로 고를 때 먼저 굴려 위력 등급을 정한다.",
    rows: table("무작위 명백한 사이퍼", 3).map(({ min, max, name }) => ({
      min,
      max,
      result: name,
      description: `다음에는 ${name} 명백한 사이퍼 표를 굴린다.`,
      url: `${SITE}#${name}-명백한-사이퍼`,
    })),
  },
  ...["하급", "중급", "고급", "특급", "초월급"].map((grade) => ({
    id: `csrd-manifest-cypher-${grade}`,
    name: `${grade} 명백한 사이퍼`,
    group: "사이퍼",
    sides: 100,
    kind: "ranges" as const,
    description: `${grade} 명백한 사이퍼 표. 물리적 물체인 사이퍼를 굴린다.`,
    rows: rowsOf(`${grade} 명백한 사이퍼`),
  })),
  {
    id: "csrd-superhero-cypher",
    name: "슈퍼히어로용 사이퍼",
    group: "사이퍼",
    sides: 100,
    kind: "ranges" as const,
    description: "슈퍼히어로 장르에서 쓰는 표. 파워 부스트 사이퍼까지 섞여 있다.",
    rows: table("슈퍼히어로용 무작위 사이퍼").map(({ min, max, name }) => {
      const boost = detailOf(name);
      if (!boost) {
        // 마지막 줄은 다른 표를 굴리라는 안내라 설명도 링크도 없다
        return { min, max, result: "무작위 사이퍼", description: "사이퍼 표를 한 번 더 굴린다" };
      }
      return {
        min,
        max,
        result: name,
        description: firstSentence(boost.effect),
        url: urlOf(name),
      };
    }),
  },
];

const problems = oracles
  .map((oracle) => {
    const covered = oracle.rows.flatMap(({ min, max }) =>
      Array.from({ length: max - min + 1 }, (_, i) => min + i),
    );
    const holes = Array.from({ length: oracle.sides }, (_, i) => i + 1).filter(
      (face) => !covered.includes(face),
    );
    const overlap = covered.length - new Set(covered).size;
    return holes.length + overlap === 0
      ? undefined
      : `${oracle.name}: 빈틈 ${holes.length}, 겹침 ${overlap}`;
  })
  .filter(Boolean);
if (problems.length > 0) throw new Error(problems.join(" / "));

const body = oracles
  .map(
    (oracle) => `  {
    id: ${JSON.stringify(oracle.id)},
    name: ${JSON.stringify(oracle.name)},
    category: "사이퍼 시스템",
    group: ${JSON.stringify(oracle.group)},
    sides: ${oracle.sides},
    kind: ${JSON.stringify(oracle.kind)},
    description: ${JSON.stringify(oracle.description)},
    rows: [
${oracle.rows
  .map(
    (row) =>
      `      { min: ${row.min}, max: ${row.max}, result: ${JSON.stringify(row.result)}, description: ${JSON.stringify(row.description)}${"url" in row && row.url ? `, url: ${JSON.stringify(row.url)}` : ""} },`,
  )
  .join("\n")}
    ],
  },`,
  )
  .join("\n");

await writeFile(
  target,
  `import type { Oracle } from "../domain/oracle.ts";

/**
 * CSRD 사이퍼 표를 \`scripts/generate-cypher-oracles.ts\`로 옮긴 것. 손으로 고치지 않는다.
 * 출처: trpg-stelo \`src/data/cypher-srd/ko/cyphers.md\`
 * 줄마다 설명과, 그 사이퍼 설명으로 가는 사이트 링크를 가진다.
 */
export const CYPHER_ORACLES: Oracle[] = [
${body}
];
`,
);

console.log(
  `사이퍼 오라클 ${oracles.length}개, 줄 ${oracles.reduce((sum, oracle) => sum + oracle.rows.length, 0)}개를 썼습니다.`,
);
