/* SMOKE TEST DO PAINEL · v46
   Nao testa regra de negocio, testa a CLASSE DE DEFEITO que ja nos custou quatro versoes:
   um numero escrito a mao que deixou de valer enquanto o outro dono do mesmo numero mudou.

     v22  o selo do cabecalho dizia v21 porque VER vivia no JS e o selo no HTML
     v26  a barra do celular tinha 5 colunas cravadas
     v43  a barra ganhou a SEXTA aba e a grade nao acompanhou
     v45  o atalho de teclado seguia preso em 1..4 com seis abas no ar

   Consertamos a instancia tres vezes e a classe nenhuma. Isto aqui mata a classe.
   Nada aqui fala com o Supabase: o cliente e dublado, porque o defeito que perseguimos
   vive na TELA e tem de ser pego sem credencial nenhuma. */
const {test, expect} = require('@playwright/test');
const path = require('path');
const PAGINA = 'file://' + path.resolve(__dirname, '..', 'index.html');

/* Duble do cliente: o painel constroi sb no topo do script. Sem isto a pagina morre antes
   de definir as funcoes, e o teste passaria a medir o duble em vez do painel. */
const DUBLE = `window.supabase={createClient:()=>({
  from:()=>({select:()=>({eq:()=>Promise.resolve({data:[],error:null})})}),
  auth:{getSession:()=>new Promise(()=>{}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
  rpc:()=>new Promise(()=>{})})};`;

async function abrir(page){
  const erros=[];
  page.on('pageerror',e=>erros.push(String(e)));
  await page.route('**cdn.jsdelivr.net**', r=>r.fulfill({status:200,contentType:'application/javascript',body:DUBLE}));
  await page.goto(PAGINA);
  /* VER e const de topo de script: vive no escopo global mas NAO em window. Esperar por
     window.VER esperaria para sempre. O sinal de que o script rodou e o selo deixar o traco. */
  await page.waitForFunction(()=>document.getElementById('selo-ver').textContent.trim()!=='\u2014');
  return erros;
}

/* O painel nasce atras do portao de senha e #app fica display:none, onde todo retangulo
   mede zero. Para medir LAYOUT o teste tem de revelar a casca — e so a casca: nenhuma
   consulta e feita, nenhum dado e forjado, o que se mede continua sendo o CSS de producao. */
async function revelarCasca(page){
  await page.evaluate(()=>{
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('login').classList.add('hidden');
  });
}

test('o selo do cabecalho e o VER do script sao o mesmo numero', async ({page})=>{
  await abrir(page);
  const {selo, ver} = await page.evaluate(()=>({
    selo:document.getElementById('selo-ver').textContent.trim(), ver:VER}));
  expect(selo, 'selo do cabecalho').toBe(ver);
});

test('toda aba tem o painel que ela abre, e todo painel tem aba', async ({page})=>{
  await abrir(page);
  const r = await page.evaluate(()=>{
    const abas=[...document.querySelectorAll('.tab')].map(t=>t.dataset.p);
    const panes=[...document.querySelectorAll('.pane')].map(p=>p.id.replace(/^p-/,''));
    return {semPane:abas.filter(a=>!panes.includes(a)), semAba:panes.filter(p=>!abas.includes(p))};
  });
  expect(r.semPane, 'aba sem painel correspondente').toEqual([]);
  expect(r.semAba,  'painel sem aba que o abra').toEqual([]);
});

test('o atalho de teclado alcanca TODAS as abas, nao um numero escrito a mao', async ({page})=>{
  await abrir(page);
  const n = await page.evaluate(()=>document.querySelectorAll('.tab').length);
  for(let i=1;i<=n;i++){
    await page.keyboard.press(String(i));
    const ativa = await page.evaluate(()=>document.querySelector('.tab.on')?.dataset.p);
    const esperada = await page.evaluate(i=>document.querySelectorAll('.tab')[i-1].dataset.p, i);
    expect(ativa, `tecla ${i} de ${n}`).toBe(esperada);
  }
});

for (const largura of [320, 390, 430]) {
  test(`a barra do celular cabe em UMA linha a ${largura}px, sem rotulo cortado`, async ({page})=>{
    await page.setViewportSize({width:largura, height:760});
    await abrir(page);
    await revelarCasca(page);
    const m = await page.evaluate(()=>{
      const barra=document.getElementById('tabs');
      const abas=[...barra.querySelectorAll('.tab')];
      return {
        abas:abas.length,
        /* a coluna se conta pelo que o olho ve — posicao horizontal distinta — e nao por
           gridTemplateColumns, que em grade IMPLICITA (grid-auto-flow:column) devolve "none". */
        colunas:new Set(abas.map(t=>Math.round(t.getBoundingClientRect().left))).size,
        linhas:new Set(abas.map(t=>Math.round(t.getBoundingClientRect().top))).size,
        cortados:[...barra.querySelectorAll('.tl')].filter(t=>t.scrollWidth>t.clientWidth+1).map(t=>t.textContent),
        fonte:parseFloat(getComputedStyle(abas[0]).fontSize)};
    });
    expect(m.colunas, 'cada aba na sua coluna').toBe(m.abas);
    expect(m.linhas,  'a barra inferior e UMA linha').toBe(1);
    /* Piso inegociavel: abaixo de 9px nem a Apple (HIG) nem a Material chamam aquilo de
       rotulo. Vale em TODA largura — encolher texto ate caber e o defeito que se quer evitar. */
    expect(m.fonte, 'tamanho do rotulo').toBeGreaterThanOrEqual(9);
    /* Truncar e o preco assumido de manter o piso, e so onde ninguem opera: a 390 e 430px,
       que sao os aparelhos reais, o rotulo tem de caber INTEIRO. */
    if(largura>=390) expect(m.cortados,'rotulos truncados').toEqual([]);
  });
}

test('a abertura nao derruba o script', async ({page})=>{
  const erros = await abrir(page);
  await page.waitForTimeout(400);
  expect(erros, 'erros de script na abertura').toEqual([]);
});
