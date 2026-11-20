// 数学ビジュアルラボ service worker
// ページはネットワーク優先（更新がすぐ届くように）、静的アセットはキャッシュ優先。
const CACHE = "sugakulab-v1";
const ASSETS = ["/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/favicon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (e.request.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith(".html")) {
    // ページ本体：ネットワーク優先、失敗したらキャッシュ
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }
  // それ以外（アイコン等）：キャッシュ優先
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
