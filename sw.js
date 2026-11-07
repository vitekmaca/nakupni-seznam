// Service worker: aplikace musí jít otevřít i bez signálu v obchodě.
// Vlastní soubory: síť má přednost, cache je záloha. Firebase: pevná verze, stačí cache.
const CACHE = "nakupni-seznam-v2";
const FIREBASE = "https://www.gstatic.com/firebasejs/10.14.1/"; // stejná verze jako v store.js
const PRECACHE = [
  "./", "index.html", "style.css", "app.js", "parse.js", "store.js", "categories.js",
  "staples.js", "firebase-config.js", "manifest.json", "icon.svg", "icon-192.png",
  FIREBASE + "firebase-app.js", FIREBASE + "firebase-firestore.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.startsWith(FIREBASE)) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
    return;
  }
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
