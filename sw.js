/* Zwischenspeicher für den Betrieb ohne Netz. Netz zuerst, damit Updates sofort ankommen. */
const V = 'sco-2026-11-23-2';
const CORE = ['index.html', 'stundenzettel.html', 'rechnung.html', 'rechnungen.html', 'adressbuch.html', 'meine-daten.html', 'sicherung.html',
  'style.css', 'nav.js', 'boot.js', 'pdf-lib.min.js', 'rechnung-pdf.js', 'logo-mark.png', 'icon.png', 'manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r.mode === 'navigate' ? r.url : r, { cache: 'no-cache' }).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: true })));
});
