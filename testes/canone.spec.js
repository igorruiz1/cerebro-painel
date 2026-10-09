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
  expect(Object.keys(larga.abas).sort(), 'mediu as cinco abas (teste sem alvo passa vazio)').toEqual(['caixa','fila','frentes','hoje','mesa']);
  expect(larga.abas.hoje.telas, 'Hoje a 1280: regua 1 (Few, uma tela para o essencial)').toBeLessThanOrEqual(1.5);
  expect(estreita.abas.hoje.telas, 'Hoje a 390').toBeLessThanOrEqual(3);
  expect(larga.total.palavras, 'palavras nas cinco abas: regua 9 (leitura em 20 min)').toBeLessThanOrEqual(1900);
  expect(larga.total.numeros, 'numeros nas cinco abas: regua 8 (EOS, poucos numeros)').toBeLessThanOrEqual(320);
  for (const [a, x] of Object.entries(larga.abas)) expect(x.telas, `aba ${a} a 1280`).toBeLessThanOrEqual(3.5);
});
