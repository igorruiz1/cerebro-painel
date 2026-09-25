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

/* CLASSE DE DEFEITO 2 · v47: secao cujo TITULO existe e cujo CORPO so e desenhado por uma
   funcao que mora no ramo de OUTRA secao. A ESCADA, o PLACAR DA SIMBIOSE e a grade de KPI
   viviam em rEvolucao(), chamada so ao abrir o ESPELHO: quem clicava direto em "Pares e
   escada" via tres caixas vazias — sem erro no console, sem aviso de carga incompleta, sem
   nada para reclamar. Ausencia silenciosa e pior que falha barulhenta.
   A escada e o caso testavel da classe: os 5 degraus do CMMI sao fixos, nao dependem de
   dado nenhum. Se render() nao os desenha, o corpo esta pendurado em outro ramo de novo. */
test('A ESCADA desenha os 5 degraus so com render(), sem abrir outra secao antes', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    let err=null; try{ render(); }catch(e){ err=String(e); }
    return {err,
      degraus:document.querySelectorAll('#escada .dim').length,
      /* vazio DECLARADO conta como desenhado; o que nao pode e o div nunca ser tocado */
      placar:document.getElementById('placarsim').innerHTML.trim().length};
  });
  expect(r.err,     'render() derrubou o script').toBe(null);
  expect(r.degraus, 'degraus desenhados pela escada').toBe(5);
  expect(r.placar,  'placar da simbiose nem vazio declarou').toBeGreaterThan(0);
});

/* CLASSE DE DEFEITO 3 · v48: o BANCO tem o dado e a TELA nao mostra. tarefa.opcoes existia
   desde a v39 e a rpc escolher() tambem, mas v_painel_fila nunca expos a coluna: na fila de
   HOJE o card so oferecia "feita". 3 escolhas registradas contra 134 cards abertos. Nao da
   para deliberar o que nao esta desenhado. O teste afirma o caminho inteiro do desenho:
   dado em D.op -> botao de opcao, marca de recomendada e o verbo que chama a rpc. */
test('o card da fila de HOJE desenha a escolha quando o banco oferece opcao', async ({page})=>{
  await abrir(page);
  const r = await page.evaluate(()=>{
    let err=null, html='';
    try{
      D.op=[{origem:'tarefa', ref:'731', escolha:null, opcoes:[
        {label:'Ajustar a meta', consequencia:'numero menor mas cumprido', recomendada:true},
        {label:'Manter os tetos', consequencia:'terceiro mes de estouro'}]}];
      html = cardFila({origem:'tarefa', ref:'731', nivel:1, acoes:[],
        titulo:'Decidir o corte dos tetos', titulo_completo:'Decidir o corte dos tetos',
        recomendacao:'Ajustar a meta.'});
    }catch(e){ err=String(e); }
    return {err, botao:html.includes('faEscolher'), marca:html.includes('recmk'),
            rotulo:html.includes('Ajustar a meta'), consequencia:html.includes('terceiro mes de estouro')};
  });
  expect(r.err,          'cardFila derrubou').toBe(null);
  expect(r.botao,        'botao de escolha no card da fila').toBe(true);
  expect(r.marca,        'marca de opcao recomendada').toBe(true);
  expect(r.rotulo,       'rotulo da opcao').toBe(true);
  expect(r.consequencia, 'consequencia de cada opcao').toBe(true);
});

/* CLASSE DE DEFEITO 4 · v50: mapa FECHADO na tela contra fonte ABERTA no banco. A SENTINELA
   listava so as chaves de SIN; sinal novo em v_sentinela sumia da lista em silencio, ainda
   somado nos quatro contadores do topo — a tela diria "26 sinais" e desenharia 20.
   O invariante que mata a classe nao e "conhece a chave nova": e o CONTADOR BATER COM A LISTA. */
test('sinal que o mapa nao conhece aparece mesmo assim, e o contador bate com a lista', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    let err=null;
    try{
      D.sent=[
        {sinal:'reincidencia', severidade:1, ref:null, frente:null,
         titulo:'padrao conhecido', detalhe:'voltou 2x', valor:2, data_ref:'2026-09-01'},
        {sinal:'sinal_que_ainda_nao_existe', severidade:2, ref:'42', frente:'00-memoria',
         titulo:'alarme recem-nascido no banco', detalhe:'ninguem ensinou a tela', valor:null, data_ref:'2026-09-02'}
      ];
      rSentinela();
    }catch(e){ err=String(e); }
    const box  = document.getElementById('sent-lista');
    const topo = document.getElementById('sent-topo');
    return {err,
      linhas: box.querySelectorAll('.ivrow').length,
      secoes: box.querySelectorAll('h2').length,
      mostraNovo: box.innerHTML.includes('alarme recem-nascido no banco'),
      totalNoTopo: Number(topo.querySelectorAll('.kpi .n')[3].textContent)};
  });
  expect(r.err,         'rSentinela derrubou').toBe(null);
  expect(r.linhas,      'toda linha que o banco mandou foi desenhada').toBe(r.totalNoTopo);
  expect(r.secoes,      'uma secao por sinal, inclusive o desconhecido').toBe(2);
  expect(r.mostraNovo,  'o sinal que o mapa nao conhece aparece').toBe(true);
});

test('a abertura nao derruba o script', async ({page})=>{
  const erros = await abrir(page);
  await page.waitForTimeout(400);
  expect(erros, 'erros de script na abertura').toEqual([]);
});

/* ---------- v49: A CARGA DA ABERTURA ----------
   A classe de defeito: a abertura disparava 21 consultas de view ao mesmo tempo, cada uma
   planejando uma arvore de view aninhada, sob statement_timeout=8s do papel authenticated.
   Medido em 18/09/2026 no pg_stat_statements: media de 30 a 750ms por view e MAXIMO de 5 a
   7,7s em TODAS, inclusive nas baratas — assinatura de contencao, nao de consulta cara.
   Consertamos a INSTANCIA duas vezes (v45 escalonou em 4 por vez, v48 tirou v_fila_opcoes da
   view cara) e a CLASSE nenhuma. Isto aqui mata a classe: a abertura le o snapshot por UMA
   chamada de painel_carga e NAO pode voltar a consultar view direto.
   Se alguem acrescentar uma view na abertura, este teste fica vermelho antes de o Igor ver
   "carga incompleta" no celular. */
const DUBLE_CONTA = `window.__n={from:[],rpc:{}};
window.supabase={createClient:()=>({
  from:(v)=>{window.__n.from.push(v);
    const t={select:()=>t,eq:()=>t,neq:()=>t,lte:()=>t,order:()=>t,
      then:(f,g)=>Promise.resolve({data:[],error:null,count:0}).then(f,g)};
    return t;},
  auth:{getSession:()=>new Promise(()=>{}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
  rpc:(n)=>{window.__n.rpc[n]=(window.__n.rpc[n]||0)+1;
    if(n==="painel_carga"){
      const ks=(typeof CHAVES_PAINEL!=="undefined")?CHAVES_PAINEL:[];
      const d={}; ks.forEach(k=>{d[k]=[];});
      return Promise.resolve({data:{dados:d,gerado_em:new Date().toISOString(),
                                    idade_s:42,erros:{},chaves:ks.length},error:null});}
    return Promise.resolve({data:null,error:null});}})};`;

async function abrirContando(page){
  const erros=[];
  page.on("pageerror",e=>erros.push(String(e)));
  await page.route("**cdn.jsdelivr.net**", r=>r.fulfill({status:200,contentType:"application/javascript",body:DUBLE_CONTA}));
  await page.goto(PAGINA);
  await page.waitForFunction(()=>document.getElementById("selo-ver").textContent.trim()!=="\u2014");
  await revelarCasca(page);
  await page.evaluate(()=>carregar());
  return erros;
}

test("a abertura le o snapshot em UMA chamada e nao consulta view direto", async ({page})=>{
  const erros = await abrirContando(page);
  const r = await page.evaluate(()=>({n:window.__n, chaves:CHAVES_PAINEL.length}));
  expect(erros, "erro de script durante a carga").toEqual([]);
  expect(r.n.rpc.painel_carga, "chamadas a painel_carga na abertura").toBe(1);
  expect(r.n.from, "view consultada direto na abertura — a carga voltou a ser N requisicoes").toEqual([]);
  expect(r.chaves, "o painel tem de declarar as chaves que espera do snapshot").toBeGreaterThan(20);
});

test("chave que o painel espera e o snapshot nao entrega vira aviso, nunca tela muda", async ({page})=>{
  const erros=[];
  page.on("pageerror",e=>erros.push(String(e)));
  /* o snapshot devolve TUDO menos a fila: a tela tem de gritar, nao inventar */
  await page.route("**cdn.jsdelivr.net**", r=>r.fulfill({status:200,contentType:"application/javascript",
    body:DUBLE_CONTA.replace("ks.forEach(k=>{d[k]=[];});","ks.filter(k=>k!==\"fila\").forEach(k=>{d[k]=[];});")}));
  await page.goto(PAGINA);
  await page.waitForFunction(()=>document.getElementById("selo-ver").textContent.trim()!=="\u2014");
  await revelarCasca(page);
  await page.evaluate(()=>carregar());
  const r = await page.evaluate(()=>({
    aceso: document.getElementById("falhou").classList.contains("on"),
    det:   document.getElementById("falhoudet").textContent}));
  expect(erros, "erro de script").toEqual([]);
  expect(r.aceso, "o aviso de carga incompleta tem de acender").toBe(true);
  expect(r.det, "o aviso tem de dizer QUAL chave faltou").toContain("fila");
});

/* CLASSE DE DEFEITO 5 · v54 (t621): SMALL MULTIPLES SO COMPARAM SE A ESCALA FOR UMA SO.
   Grade com escala por celula e pior que nao ter grade: toda frente parece igualmente
   movimentada, que e exatamente o erro que o Tufte nomeia. E precisa desenhar com render()
   sozinho, sem ninguem clicar em aba nenhuma, senao a comparacao so existe para quem procura.
   O teste afirma as duas coisas: desenhou sem clique, e o teto do eixo e o mesmo em todas. */
test('os small multiples desenham so com render() e todos no mesmo teto de eixo', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    D.frs=[{slug:"01-alfa",status:"verde",serie:[0,4,2],fechadas_periodo:6,pico:4,desde:"2026-09-16"},
           {slug:"02-beta",status:"vermelho",serie:[1,1,0],fechadas_periodo:2,pico:1,desde:"2026-09-16"}];
    let err=null; try{ rSmallMult(); }catch(e){ err=String(e); }
    const cel=[...document.querySelectorAll('#smallmult .fcard')];
    /* a barra mais alta de cada celula, em unidade do viewBox: com escala unica a de valor 4
       ocupa a altura toda e a de valor 1 ocupa um quarto. Com escala por celula as duas
       ocupariam a altura toda, e e esse o defeito que este teste recusa. */
    const alturas=cel.map(c=>Math.max(...[...c.querySelectorAll('rect')].map(x=>+x.getAttribute('height'))));
    return {err, celulas:cel.length, alturas};
  });
  expect(r.err,      'rSmallMult() derrubou o script').toBe(null);
  expect(r.celulas,  'uma celula por frente, desenhada sem clique').toBe(2);
  expect(r.alturas[0]>r.alturas[1], 'pico 4 tem de desenhar mais alto que pico 1: escala unica').toBe(true);
  expect(Math.abs(r.alturas[0]/r.alturas[1]-4)<0.35, 'a razao das alturas segue a razao dos valores').toBe(true);
});

/* CLASSE DE DEFEITO 6 · v58 (t623): A PRIMEIRA DOBRA VIRA PAREDE DE NUMERO.
   Antes da faixa o heroi punha cerca de 12 numeros acima da dobra, e o teste dos 5 segundos
   (Few) falha com mais de 7. O invariante: a faixa desenha entre 5 e 7 numeros, cada um diz
   o estado POR ESCRITO (a leitura sobrevive sem cor, regua 18) e diz quem move (regua 7);
   o resto do heroi continua existindo, um nivel abaixo, dentro de "mais numeros". */
test('a faixa dos 5 segundos: 5 a 7 numeros, estado escrito, quem move, resto um nivel abaixo', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    const s=(chave,serie,meta,dir,banda)=>({chave,serie,meta_num:meta,direcao:dir,p10:1,p90:2,situacao_banda:banda});
    D.se=[s("caixa.sobrevida_dias",[20,15,11],90,"maior_melhor","normal"),
          s("caixa.entrada_realizada_30d",[500,0],19700,"maior_melhor","normal"),
          s("caixa.decisao_parada_rs",[1,2],0,"menor_melhor","fora_banda"),
          s("fila.wip_sobrecarga_x",[3.6],1,"menor_melhor","sem_banda"),
          s("carga.igor_pct",[76.6,76.6],50,"menor_melhor","fora_banda")];
    D.rw={dias_sobrevida_pior:11,dias_sobrevida:24,caixa_hoje:17023,queima_dia_base:700};
    let err=null; try{ rAgora(); }catch(e){ err=String(e); }
    const t=[...document.querySelectorAll('#faixa5 .f5')];
    return {err, n:t.length,
      semEstado:t.filter(x=>!/normal|sem banda|sem série/.test(x.querySelector('.e').textContent)).length,
      semQuem:t.filter(x=>!x.querySelector('.q').textContent.includes('quem move')).length,
      foraEscrito:t.find(x=>x.dataset.chave==='carga.igor_pct').querySelector('.e').textContent,
      faltando:t.find(x=>x.dataset.chave==='entrega.output_sem_ack').querySelector('.e').textContent,
      folegoAbaixo:!!document.querySelector('#hero details.abaixo') &&
        document.querySelector('#hero details.abaixo').textContent.includes('folego de caixa')};
  });
  expect(r.err, 'rAgora() derrubou o script').toBe(null);
  expect(r.n>=5 && r.n<=7, `numeros na faixa: ${r.n}`).toBe(true);
  expect(r.semEstado, 'numero sem estado escrito').toBe(0);
  expect(r.semQuem, 'numero sem quem move').toBe(0);
  expect(r.foraEscrito, 'fora do normal e fora da meta vao por escrito').toContain('fora do normal');
  expect(r.foraEscrito).toContain('fora da meta');
  expect(r.faltando, 'serie ausente se declara, nao some').toContain('sem série');
  expect(r.folegoAbaixo, 'o folego de caixa continua existindo um nivel abaixo').toBe(true);
});
