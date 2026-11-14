// The Night Shelver — service worker for the web version.
// Lets the site be installed as an app and played with no connection.
// Online: always fetch the newest files (and remember them). Offline: use the remembered copies.
const CACHE = 'night-shelver-v1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'icon.png', 'icon-192.png', 'icon-512.png',
  'css/style.css', 'vendor/three.min.js',
  'js/core.js', 'js/data.js', 'js/stories.js', 'js/audio.js', 'js/progress.js', 'js/game.js', 'js/ui.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((cache) => cache.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
