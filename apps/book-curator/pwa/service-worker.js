// 이 파일은 빌드 때 `pwa/vite-plugin.ts`가 아래 자리표시에 버전과 파일 목록을 넣어 dist/sw.js로 낸다.
// 설치할 때 앱의 모든 파일을 받아 두고, 그 뒤로는 캐시에서 먼저 꺼내 인터넷 없이 돈다.
const { version, files, fonts } = __PWA__;
const PREFIX = "book-curator-";
const CACHE = `${PREFIX}${version}`;
const META = `${PREFIX}meta`;
/** 새 버전이 켜져도 바로 앞 버전 캐시는 남긴다. 열려 있던 화면이 옛 파일을 마저 읽을 수 있다. */
const KEEP = 2;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(files);
      // 손글씨 글꼴은 CDN에 있다. 받지 못해도 설치는 이어 가고, 그때는 Noto로 그린다.
      await Promise.all(
        fonts.map(async (url) => {
          try {
            const response = await fetch(url, { mode: "cors" });
            if (response.ok) await cache.put(url, response);
          } catch {
            // 다음에 온라인으로 열 때 fetch가 다시 담는다.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const meta = await caches.open(META);
      const stored = await meta.match("history");
      const history = stored ? await stored.json() : [];
      const next = [...history.filter((name) => name !== CACHE), CACHE].slice(-KEEP);
      await meta.put("history", new Response(JSON.stringify(next)));
      for (const name of await caches.keys()) {
        if (name.startsWith(PREFIX) && name !== META && !next.includes(name)) {
          await caches.delete(name);
        }
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const cacheable = url.origin === self.location.origin || fonts.includes(request.url);
  if (!cacheable) return;

  event.respondWith(
    (async () => {
      // 화면 이동은 모두 같은 index.html이다(SPA). 주소가 무엇이든 캐시의 것을 먼저 쓴다.
      const key = request.mode === "navigate" ? "/index.html" : request;
      const cached = await caches.match(key, {
        ignoreVary: true,
        ignoreSearch: request.mode === "navigate",
      });
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});
