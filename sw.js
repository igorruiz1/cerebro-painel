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
    data: { url: d.url || './presidente.html?abrir=hoje' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || './presidente.html?abrir=hoje', self.registration.scope).href;
  const pagina = u => { try { return new URL(u).pathname; } catch (x) { return ''; } };
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async todas => {
    const janelas = todas.filter(w => w.url.startsWith(self.registration.scope));
    /* p4.51 (s2878, 12/10/2026): com o app aberto em segundo plano, so focar trazia a ultima tela. A janela que ja
       esta na pagina do destino recebe o destino e vai ate ele sem recarregar (presidente.html: aoAvisoTocado). */
    const mesma = janelas.find(w => pagina(w.url) === pagina(alvo) && 'focus' in w);
    if (mesma) { mesma.postMessage({ tipo: 'abrir', url: alvo }); return mesma.focus(); }
    /* p4.52 (s3056, 12/10/2026, p136): o teste do Igor reprovou porque a janela aberta era o bastidor (index.html):
       ela recebia a mensagem, nao a ouvia, e o toque so trazia o bastidor. Janela em outra pagina do app navega ate o
       destino; se o navegador recusar (janela fora do controle deste sw), abre o destino; por ultimo, a mensagem,
       que o index.html tambem ouve. */
    const outra = janelas.find(w => 'focus' in w);
    if (!outra) return self.clients.openWindow(alvo);
    if ('navigate' in outra) {
      try { const n = await outra.navigate(alvo); if (n) return n.focus(); } catch (x) {}
    }
    try { const n = await self.clients.openWindow(alvo); if (n) return n; } catch (x) {}
    outra.postMessage({ tipo: 'abrir', url: alvo });
    return outra.focus();
  }));
});
