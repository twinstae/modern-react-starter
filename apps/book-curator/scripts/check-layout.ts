import { chromium } from "playwright";

/**
 * 태블릿 세로·가로에서 키오스크 화면이 겹치거나 넘치지 않는지 본다.
 * Storybook이 6008에서 떠 있어야 한다: `bun run storybook`.
 * 스타일을 단언하는 테스트가 아니라, 텍스트·카드가 서로 겹치는 사고를 잡는 검사다.
 */
const BASE = process.env.STORYBOOK_URL ?? "http://localhost:6008";

const cases = [
  { id: "components-nickname-start--empty", width: 834, height: 1112, viewport: "tabletPortrait" },
  {
    id: "components-nickname-start--empty-landscape",
    width: 1112,
    height: 834,
    viewport: "tabletLandscape",
  },
  { id: "components-question-screen--first", width: 834, height: 1112, viewport: "tabletPortrait" },
  {
    id: "components-question-screen--longest-landscape",
    width: 1112,
    height: 834,
    viewport: "tabletLandscape",
  },
  { id: "components-result-screen--seoyun", width: 834, height: 1112, viewport: "tabletPortrait" },
  {
    id: "components-result-screen--seoyun-landscape",
    width: 1112,
    height: 834,
    viewport: "tabletLandscape",
  },
  { id: "components-result-screen--longest", width: 834, height: 1112, viewport: "tabletPortrait" },
  {
    id: "components-result-screen--longest-landscape",
    width: 1112,
    height: 834,
    viewport: "tabletLandscape",
  },
  {
    id: "components-owner-check-screen--normal",
    width: 834,
    height: 1112,
    viewport: "tabletPortrait",
  },
  {
    id: "components-owner-check-screen--normal-landscape",
    width: 1112,
    height: 834,
    viewport: "tabletLandscape",
  },
  {
    id: "components-drawer-books-screen--three-books",
    width: 834,
    height: 1112,
    viewport: "tabletPortrait",
  },
  {
    id: "components-drawer-books-screen--three-books-landscape",
    width: 1112,
    height: 834,
    viewport: "tabletLandscape",
  },
  { id: "components-admin-login--empty", width: 834, height: 1112, viewport: "tabletPortrait" },
  {
    id: "components-admin-login--empty",
    width: 1112,
    height: 834,
    viewport: "tabletLandscape",
  },
] as const;

type Index = { entries: Record<string, unknown> };

const response = await fetch(`${BASE}/index.json`).catch(() => null);
if (response === null || !response.ok) {
  console.error(`Storybook을 ${BASE}에서 찾지 못했습니다. 먼저 \`bun run storybook\`을 띄우세요.`);
  process.exit(1);
}
const index = (await response.json()) as Index;

const browser = await chromium.launch();
const failures: string[] = [];

for (const testCase of cases) {
  if (!(testCase.id in index.entries)) {
    failures.push(`${testCase.id}: 스토리를 찾지 못했습니다`);
    continue;
  }

  const page = await browser.newPage({
    viewport: { width: testCase.width, height: testCase.height },
  });
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  await page.goto(
    `${BASE}/iframe.html?id=${testCase.id}&viewMode=story&globals=viewport:${testCase.viewport}`,
    { waitUntil: "networkidle" },
  );
  await page.waitForTimeout(250);

  const metrics = await page.evaluate(() => {
    const main = document.querySelector("main");
    if (main === null) return { problem: "main이 없습니다" };

    const rect = main.getBoundingClientRect();
    const children = [...main.children].map((element) => {
      const box = element.getBoundingClientRect();
      return {
        label: element.getAttribute("aria-label") ?? element.tagName,
        top: box.top,
        bottom: box.bottom,
        left: box.left,
        right: box.right,
      };
    });

    const overlaps: string[] = [];
    for (let i = 0; i < children.length; i += 1) {
      for (let j = i + 1; j < children.length; j += 1) {
        const a = children[i];
        const b = children[j];
        if (a === undefined || b === undefined) continue;
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
          overlaps.push(`${a.label} ↔ ${b.label}`);
        }
      }
    }

    return {
      mainWidth: rect.width,
      mainHeight: rect.height,
      scrollWidth: main.scrollWidth,
      clientWidth: main.clientWidth,
      scrollHeight: main.scrollHeight,
      clientHeight: main.clientHeight,
      overlaps,
    };
  });

  await page.close();

  if ("problem" in metrics) {
    failures.push(`${testCase.id}: ${metrics.problem}`);
    continue;
  }

  if (pageErrors.length > 0) failures.push(`${testCase.id}: 페이지 오류 ${pageErrors.join(", ")}`);
  if (metrics.scrollWidth > metrics.clientWidth + 1) {
    failures.push(`${testCase.id}: 가로 스크롤 ${metrics.scrollWidth} > ${metrics.clientWidth}`);
  }
  if (metrics.mainHeight > testCase.height + 2) {
    failures.push(`${testCase.id}: 화면 높이 초과 ${metrics.mainHeight} > ${testCase.height}`);
  }
  if (metrics.scrollHeight > metrics.clientHeight + 1) {
    failures.push(`${testCase.id}: 세로 스크롤 ${metrics.scrollHeight} > ${metrics.clientHeight}`);
  }
  if (metrics.overlaps.length > 0) {
    failures.push(`${testCase.id}: 겹침 ${metrics.overlaps.join(", ")}`);
  }

  console.log(
    `✓ ${testCase.id} ${testCase.width}×${testCase.height} — ${Math.round(metrics.mainHeight)}px`,
  );
}

await browser.close();

if (failures.length > 0) {
  console.error(`\n레이아웃 문제 ${failures.length}건`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`\n레이아웃 ${cases.length}개 통과`);
