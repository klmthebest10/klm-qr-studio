const CACHE = 'klm-qr-studio-v4';
const ASSETS = ['./', './index.html', './style.css', './app.js', './qrcodegen.js', './manifest.webmanifest', './lihat.html',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-180.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).pathname.startsWith('/__')) return;
  // jaringan dulu (agar update cepat), cache bila offline
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && new URL(req.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
