/* Medidor do cânone (plano 106, s1274 · 08/10/2026). Fonte única das medidas de tela do docs/canone.md:
   o script scripts/canone.mjs imprime o JSON que a sessão grava na evolucao, e testes/canone.spec.js cobra
   o piso em toda CI. Abre o presidente.html no modo demonstração (dado fictício, nenhum cliente do banco
   nasce) e mede cada aba: telas de rolagem, palavras, números e números na primeira dobra. */
const path = require('path');
const PAGINA = 'file://' + path.resolve(__dirname, '..', 'presidente.html');
const LARGURAS = [{w: 390, h: 760}, {w: 1280, h: 800}];

async function abrirDemo(page){
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  await page.addInitScript(() => {
    try { sessionStorage.setItem('cerebro.demo', '1'); } catch (e) {}
    window.supabase = {createClient: () => { throw new Error('a demonstracao nao cria cliente'); }};
  });
  await page.route('**cdn.jsdelivr.net**', r => r.abort());
  await page.goto(PAGINA);
  await page.waitForFunction(() => !!document.querySelector('#foco .tit') && !!document.querySelector('#kanban .item'));
  return erros;
}

/* mede a aba visível; a dobra é a altura da janela */
const medirAba = page => page.evaluate(() => {
  const vh = innerHeight, txt = document.body.innerText;
  const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  let dobra = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const el = w.currentNode.parentElement; if (!el || !vis(el)) continue;
    const r = el.getBoundingClientRect(); if (r.top < vh && r.bottom > 0) dobra += (w.currentNode.textContent.match(/\d[\d.,]*/g) || []).length; }
  return {
    telas: Math.round(document.documentElement.scrollHeight / vh * 10) / 10,
    palavras: txt.split(/\s+/).filter(Boolean).length,
    numeros: (txt.match(/\d[\d.,]*/g) || []).length,
    numeros_dobra: dobra,
  };
});

/* as cinco abas nas duas larguras; devolve {versao, larguras:{390:{abas, total}, 1280:{...}}, erros} */
async function medirCanone(browser){
  const out = {versao: null, larguras: {}, erros: []};
  for (const {w, h} of LARGURAS) {
    const page = await browser.newPage({viewport: {width: w, height: h}});
    out.erros.push(...await abrirDemo(page));
    out.versao = await page.evaluate(() => typeof VERP === 'string' ? VERP : null);
    const abas = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-aba]')].map(b => b.dataset.aba))]);
    const r = {abas: {}, total: {telas: 0, palavras: 0, numeros: 0}};
    for (const a of abas) {
      await page.evaluate(x => { ir(x); scrollTo(0, 0); }, a);
      if (a === 'mesa') await page.waitForSelector('#ms-raiz .ms-item');
      const m = await medirAba(page);
      r.abas[a] = m;
      r.total.telas = Math.round((r.total.telas + m.telas) * 10) / 10;
      r.total.palavras += m.palavras; r.total.numeros += m.numeros;
    }
    out.larguras[w] = r;
    await page.close();
  }
  return out;
}

module.exports = {abrirDemo, medirAba, medirCanone, LARGURAS};
