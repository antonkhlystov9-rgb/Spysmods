// The Night Shelver — service worker for the web version.
// Lets the site be installed as an app and played with no connection.
// Online: always fetch the newest files (and remember them). Offline, or on a connection that
// is there but dead, use the remembered copies.
const CACHE = 'night-shelver-v1';
const PATIENCE = 4000;      // ms to wait for the network before falling back to the remembered copy
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
  const remembered = () => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
  event.respondWith(new Promise((resolve) => {
    let done = false;
    const finish = (res) => { if (!done) { done = true; resolve(res); } };
    const timer = setTimeout(() => remembered().then((hit) => { if (hit) finish(hit); }), PATIENCE);
    fetch(req)
      .then((res) => {
        clearTimeout(timer);
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((cache) => cache.put(req, copy)); }
        finish(res);
      })
      .catch(() => { clearTimeout(timer); remembered().then((hit) => finish(hit || Response.error())); });
  }));
});
