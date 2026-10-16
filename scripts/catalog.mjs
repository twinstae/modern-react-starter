// Bun 카탈로그로 공통 의존성 버전을 한 곳에서 관리하도록 강제한다.
//
//   bun scripts/catalog.mjs check   어긋난 곳이 있으면 실패한다 (CI에서 쓴다)
//   bun scripts/catalog.mjs fix     카탈로그를 만들거나 고치고, 각 패키지를 "catalog:"로 바꾼다
//
// 규칙
//   1. 카탈로그에 있는 의존성은 모든 패키지가 "catalog:"로 참조해야 한다.
//   2. 둘 이상의 패키지가 쓰는 의존성은 카탈로그에 있어야 한다.
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEPENDENCY_TYPES = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const rel = (path) => relative(root, path);

function workspaceFiles() {
  const rootPkg = readJson(join(root, "package.json"));
  const patterns = Array.isArray(rootPkg.workspaces)
    ? rootPkg.workspaces
    : (rootPkg.workspaces?.packages ?? []);

  const files = [];
  for (const pattern of patterns) {
    const [group, wildcard] = pattern.split("/");
    if (wildcard !== "*") throw new Error(`지원하지 않는 워크스페이스 패턴: ${pattern}`);
    const base = join(root, group);
    if (!statSync(base, { throwIfNoEntry: false })?.isDirectory()) continue;
    for (const name of readdirSync(base)) {
      const file = join(base, name, "package.json");
      if (statSync(file, { throwIfNoEntry: false })) files.push(file);
    }
  }
  return [join(root, "package.json"), ...files];
}

const isLocal = (dep) => dep.startsWith("@repo/");
const isWorkspaceSpec = (spec) => typeof spec === "string" && spec.startsWith("workspace:");
const isCatalogRef = (spec) => typeof spec === "string" && spec.startsWith("catalog:");

function readCatalog(rootPkg) {
  const nested = Array.isArray(rootPkg.workspaces) ? undefined : rootPkg.workspaces?.catalog;
  return { ...rootPkg.catalog, ...nested };
}

function sortKeys(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
}

function writeCatalog(rootPkg, catalog) {
  const sorted = sortKeys(catalog);
  if (!Array.isArray(rootPkg.workspaces) && rootPkg.workspaces?.catalog) {
    rootPkg.workspaces.catalog = sorted;
    return;
  }
  // "workspaces" 바로 뒤에 두어 읽기 좋게 한다.
  const next = {};
  for (const [key, value] of Object.entries(rootPkg)) {
    if (key === "catalog") continue;
    next[key] = value;
    if (key === "workspaces") next.catalog = sorted;
  }
  if (!("catalog" in next)) next.catalog = sorted;
  for (const key of Object.keys(rootPkg)) delete rootPkg[key];
  Object.assign(rootPkg, next);
}

const parseVersion = (spec) => {
  const match = String(spec).match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
};

function highestSpec(specs) {
  const concrete = specs.filter((spec) => spec !== "latest");
  const pool = concrete.length > 0 ? concrete : specs;
  return pool.slice().sort((a, b) => {
    const va = parseVersion(a);
    const vb = parseVersion(b);
    if (!va) return vb ? 1 : 0;
    if (!vb) return -1;
    for (let i = 0; i < 3; i += 1) {
      if (va[i] !== vb[i]) return vb[i] - va[i];
    }
    return 0;
  })[0];
}

function collectUsage(packages) {
  const usage = new Map();
  for (const { pkg } of packages) {
    for (const type of DEPENDENCY_TYPES) {
      for (const [dep, spec] of Object.entries(pkg[type] ?? {})) {
        if (isLocal(dep) || isWorkspaceSpec(spec)) continue;
        if (!usage.has(dep)) usage.set(dep, { packages: new Set(), specs: new Set() });
        const entry = usage.get(dep);
        entry.packages.add(pkg.name);
        entry.specs.add(spec);
      }
    }
  }
  return usage;
}

const mode = process.argv[2];
if (mode !== "check" && mode !== "fix") {
  console.error("사용법: bun scripts/catalog.mjs <check|fix>");
  process.exit(2);
}

const files = workspaceFiles();
const packages = files.map((file) => ({ file, pkg: readJson(file) }));
const rootPkg = packages[0].pkg;
const catalog = readCatalog(rootPkg);
const usage = collectUsage(packages);

const problems = [];
const fixes = [];

// 규칙 1: 카탈로그에 있는 의존성은 "catalog:"로 참조한다.
for (const dep of Object.keys(catalog)) {
  for (const { file, pkg } of packages) {
    for (const type of DEPENDENCY_TYPES) {
      const spec = pkg[type]?.[dep];
      if (spec === undefined || isCatalogRef(spec)) continue;
      problems.push(`${rel(file)}: "${dep}": "${spec}" — 카탈로그에 있으니 "catalog:"를 쓰세요`);
      fixes.push(() => {
        pkg[type][dep] = "catalog:";
      });
    }
  }
}

// 규칙 2: 둘 이상의 패키지가 쓰는 의존성은 카탈로그에 둔다.
for (const [dep, entry] of usage) {
  if (catalog[dep] !== undefined) continue;
  if (entry.packages.size < 2) continue;
  const version = highestSpec([...entry.specs]);
  problems.push(
    `${dep}: ${entry.packages.size}개 패키지가 쓰므로 카탈로그에 두세요 (제안 "${version}")`,
  );
  fixes.push(() => {
    catalog[dep] = version;
    for (const { pkg } of packages) {
      for (const type of DEPENDENCY_TYPES) {
        if (pkg[type]?.[dep] !== undefined) pkg[type][dep] = "catalog:";
      }
    }
  });
}

if (mode === "check") {
  if (problems.length === 0) {
    console.log(
      `카탈로그 확인 통과: 공통 의존성 ${Object.keys(catalog).length}개가 통일되어 있습니다`,
    );
    process.exit(0);
  }
  console.error(`카탈로그가 어긋난 곳 ${problems.length}곳:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("\n`bun run deps:fix` 로 고칠 수 있습니다.");
  process.exit(1);
}

for (const fix of fixes) fix();
writeCatalog(rootPkg, catalog);
for (const { file, pkg } of packages) writeJson(file, pkg);
console.log(
  `카탈로그 ${Object.keys(catalog).length}개 항목으로 정리하고, 패키지를 "catalog:"로 바꿨습니다`,
);
