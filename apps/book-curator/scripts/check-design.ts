import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * 화면 코드가 디자인 시스템을 우회하지 않는지 본다.
 * - 버튼은 src/ui/button.tsx를 거친다.
 * - 입력의 레이블·오류·설명 연결은 src/ui의 폼 필드가 소유한다.
 * - 화면 코드에 hex 색을 직접 쓰지 않는다.
 * - 카드 그림자는 src/ui/card.tsx가 소유한다.
 * - 컴포넌트 테스트는 body text를 긁지 않고 접근성 스냅샷을 쓴다.
 *
 * 폰트·여백·레이아웃은 화면별로 달라질 수 있으므로 여기서 막지 않는다.
 */
const roots = ["src/components", "src/routes"];
const problems: string[] = [];

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });

const report = (file: string, line: number, message: string) =>
  problems.push(`${relative(process.cwd(), file)}:${line + 1} ${message}`);

for (const file of roots.flatMap(walk)) {
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");
  const isTest = file.includes(".test.");

  lines.forEach((text, index) => {
    if (isTest) {
      if (/document\.body\.textContent|\bbodyText\b/.test(text)) {
        report(file, index, "화면 텍스트 전체를 긁지 말고 a11ySnapshot을 쓰세요.");
      }
      return;
    }

    if (/styled\("button"/.test(text)) {
      report(file, index, "버튼은 src/ui의 Button을 쓰세요.");
    }
    if (/aria-(?:errormessage|invalid|describedby)/.test(text)) {
      report(file, index, "입력의 오류·설명 연결은 src/ui의 폼 필드가 소유합니다.");
    }
    if (/styled\("(?:select|textarea)"/.test(text)) {
      report(file, index, "입력 컨트롤은 src/ui의 Select·Textarea를 쓰세요.");
    }
    if (/#[0-9a-fA-F]{3,8}\b/.test(text)) {
      report(file, index, "색은 theme 토큰을 쓰세요.");
    }
    if (/boxShadow:\s*"zine/.test(text)) {
      report(file, index, "카드 그림자는 src/ui의 Card가 소유합니다.");
    }
  });
}

if (problems.length > 0) {
  console.error("디자인 시스템 경계를 벗어난 코드가 있습니다.\n");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log("디자인 시스템 경계 검사 통과");
