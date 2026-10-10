/* Service worker do painel (p4.40, t2044, 10/10/2026): so recebe o aviso por Web Push e o mostra com o app
   fechado; o toque abre o painel. Nao guarda cache nem intercepta rede: o painel continua lendo o banco ao vivo. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { corpo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Cérebro', {
    body: d.corpo || '',
    tag: d.tag || 'aviso',
    data: { url: d.url || './presidente.html' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || './presidente.html', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(janelas => {
    for (const j of janelas) if (j.url.startsWith(self.registration.scope) && 'focus' in j) return j.focus();
    return self.clients.openWindow(alvo);
  }));
});
