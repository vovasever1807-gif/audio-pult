var CACHE = 'pult-v7';
var FILES = ['./', './manifest.json'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Страница всегда свежая из сети, кэш — только запасной, если сети нет.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var isPage = e.request.mode === 'navigate' || /\/$|index\.html$/.test(new URL(e.request.url).pathname);
  if (isPage) {
    e.respondWith(fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put('./', copy); }).catch(function () {});
      return res;
    }).catch(function () { return caches.match('./'); }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
        return res;
      });
    })
  );
});
