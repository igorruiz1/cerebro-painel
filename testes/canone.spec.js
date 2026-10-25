/* PISO DO CÂNONE · plano 106 (s1274, 08/10/2026)
   O docs/canone.md mediu o presidente p4.30 contra o cânone de mercado e achou o ponto mais forte dele na edição:
   6 vezes menos palavras e 5 vezes menos números que o index de agosto, que tinha 47 telas de rolagem e 81% de
   vermelho. A classe de defeito que se persegue aqui é a tela que incha aos poucos, um bloco por versão, sem
   ninguém decidir. O piso tem folga de ~30% sobre o medido; passar dele exige decisão escrita, não deriva.
   Medido na p4.30 (modo demonstração): Hoje 1,4 tela a 1280; 1.442 palavras e 242 números nas cinco abas. */
const {test, expect} = require('@playwright/test');
const {medirCanone} = require('./_canone');

test('106: Hoje cabe em 1,5 tela a 1280 e as cinco abas nao incham alem do piso do canone', async ({browser})=>{
  const m = await medirCanone(browser);
  expect(m.erros, 'a demonstracao abriu sem erro').toEqual([]);
  const larga = m.larguras[1280], estreita = m.larguras[390];
  expect(Object.keys(larga.abas).sort(), 'mediu as seis abas (p4.58: a Semana entrou; teste sem alvo passa vazio)').toEqual(['caixa','fila','frentes','hoje','mesa','semana']);
  expect(larga.abas.hoje.telas, 'Hoje a 1280: regua 1 (Few, uma tela para o essencial)').toBeLessThanOrEqual(1.5);
  expect(estreita.abas.hoje.telas, 'Hoje a 390: p4.84 (t3636) baixou de 3,0 para 1,5').toBeLessThanOrEqual(1.5);
  /* p4.69 (onda 4, pi 184-187, s6948): a Semana ganhou os 7 segmentos do L10, as prioridades e a vida, e a Caixa a Folha Mes.
  Medido na demonstracao: 1900 palavras e 309 numeros antes (no piso), 2120 e 341 depois. O piso sobe por decisao escrita
  (palavras 1900 para 2150, numeros 320 para 350) e fica sujeito ao gate do Igor; nao e deriva. */
  expect(larga.total.palavras, 'palavras nas cinco abas: regua 9 (leitura em 20 min)').toBeLessThanOrEqual(2150);
  /* p4.58 (p144, s3409, 12/10/2026): a Semana entrou e o piso subiu de 320 para 340 por decisao escrita.
     p4.60 (s3768): volta a 320. O trilho a 1280 repetia o carimbo do topo (dados de HH:MM · N fechados em 7 d (+M)),
     5 numeros em cada uma das seis abas; o carimbo fica so no topo. Medido: 326 antes, 296 depois. */
  expect(larga.total.numeros, 'numeros nas seis abas: regua 8 (EOS, poucos numeros)').toBeLessThanOrEqual(350);
  for (const [a, x] of Object.entries(larga.abas)) expect(x.telas, `aba ${a} a 1280`).toBeLessThanOrEqual(3.5);
});

/* t3636 (onda E, regua 34 do canone): axe-core sem violacao seria ou critica nas seis abas, a 390 e a 1280 (WCAG 2.2 AA). */
const AxeBuilder = require('@axe-core/playwright').default;
const {abrirDemo, LARGURAS} = require('./_canone');
test('34: axe-core, zero violacao seria ou critica nas seis abas a 390 e a 1280', async ({browser})=>{
  const achados = []; let abasVistas = 0;
  for (const {w, h} of LARGURAS) {
    const ctx = await browser.newContext({viewport: {width: w, height: h}}), page = await ctx.newPage();
    await abrirDemo(page);
    const abas = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-aba]')].map(b => b.dataset.aba))]);
    for (const a of abas) {
      await page.evaluate(x => { ir(x); scrollTo(0, 0); }, a);
      if (a === 'mesa') await page.waitForSelector('#ms-raiz .ms-item');
      const r = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      abasVistas++;
      for (const v of r.violations) if (v.impact === 'serious' || v.impact === 'critical') achados.push(`${w} ${a} ${v.impact} ${v.id} ${v.nodes.map(n => n.target.join(' ')).slice(0, 2)}`);
    }
    await ctx.close();
  }
  expect(abasVistas, 'mediu as seis abas nas duas larguras (teste sem alvo passa vazio)').toBe(12);
  expect(achados).toEqual([]);
});

/* t3636 (regua 18 do canone, "sobrevive sem cor"): no grafico das 13 semanas, o saldo negativo e a pior semana
   se distinguem sem cor: negativo com listras (pattern), pior semana com contorno e o rotulo "pior". */
test('18: grafico do caixa distingue negativo e pior semana sem depender de cor', async ({browser})=>{
  const page = await browser.newPage(); await abrirDemo(page);
  const r = await page.evaluate(() => {
    const s = [1,2,3,4].map(i => ({inicio: '2026-11-0' + i})), base = [5000, -2000, 3000, -6000];
    const d = document.createElement('div'); d.innerHTML = grafico13(s, base, 3);
    const rects = [...d.querySelectorAll('rect.sem')];
    return {neg: rects.filter((x, i) => base[i] < 0).map(x => x.getAttribute('style')),
            pos: rects.filter((x, i) => base[i] >= 0).map(x => x.getAttribute('style')),
            pior: d.querySelectorAll('rect[data-pior]').length, rotulo: d.querySelector('text.pior13')?.textContent,
            padrao: !!d.querySelector('pattern#neg13'), leg: d.querySelector('#legenda13').textContent};
  });
  expect(r.padrao, 'o padrao listrado existe').toBe(true);
  for (const st of r.neg) expect(st, 'negativo usa o listrado, nao so a cor').toContain('url(#neg13)');
  for (const st of r.pos) expect(st, 'positivo nao usa o listrado').not.toContain('url(#neg13)');
  expect(r.pior, 'uma barra marcada como pior').toBe(1);
  expect(r.rotulo, 'a pior semana tem rotulo em texto').toBe('pior');
  expect(r.leg, 'a legenda descreve o listrado').toContain('Listrado');
  await page.close();
});
