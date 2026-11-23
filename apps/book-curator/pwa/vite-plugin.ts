import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

import type { Plugin, ResolvedConfig } from "vite";

const PLACEHOLDER = "__PWA__";

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join("/"));
}

/**
 * 빌드가 끝나면 dist/의 모든 파일을 미리 받아 두는 서비스 워커(dist/sw.js)를 낸다.
 * 버전은 파일 이름과 index.html 내용의 해시라, 무엇이든 바뀌면 새 캐시를 만든다.
 * `fonts`는 설치할 때 함께 받아 둘 다른 출처의 글꼴 주소다.
 */
export function serviceWorker({ fonts }: { fonts: readonly string[] }): Plugin {
  let config: ResolvedConfig;
  return {
    name: "book-curator:service-worker",
    apply: "build",
    configResolved(resolved) {
      config = resolved;
    },
    async closeBundle() {
      const outDir = config.build.outDir;
      const files = (await listFiles(outDir))
        .filter((file) => file !== "sw.js" && !file.endsWith(".map"))
        .sort();
      const hash = createHash("sha256").update(files.join("\n"));
      hash.update(await readFile(join(outDir, "index.html")));
      const pwa = {
        version: hash.digest("hex").slice(0, 12),
        files: files.map((file) => `/${file}`),
        fonts,
      };
      const template = await readFile(new URL("./service-worker.js", import.meta.url), "utf8");
      if (template.split(PLACEHOLDER).length !== 2) {
        throw new Error(`service-worker.js에 ${PLACEHOLDER} 자리가 정확히 하나 있어야 합니다`);
      }
      await writeFile(join(outDir, "sw.js"), template.replace(PLACEHOLDER, JSON.stringify(pwa)));
    },
  };
}
