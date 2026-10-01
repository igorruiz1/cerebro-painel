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

/* v62: a aba e um GRUPO e a sub-aba abre o painel. O invariante ficou em dois degraus: toda
   sub-aba abre um painel que existe e pertence a um grupo com aba; todo painel tem sub-aba;
   toda aba tem pelo menos uma sub-aba. */
test('toda aba tem o painel que ela abre, e todo painel tem aba', async ({page})=>{
  await abrir(page);
  const r = await page.evaluate(()=>{
    const grupos=[...document.querySelectorAll('.tab')].map(t=>t.dataset.g);
    const subs=[...document.querySelectorAll('#subnav .sub')].map(s=>({p:s.dataset.p,g:s.dataset.g}));
    const panes=[...document.querySelectorAll('.pane')].map(p=>p.id.replace(/^p-/,''));
    return {semPane:subs.filter(s=>!panes.includes(s.p)).map(s=>s.p),
            semAba:panes.filter(p=>!subs.some(s=>s.p===p)),
            grupoSemAba:subs.filter(s=>!grupos.includes(s.g)).map(s=>s.p),
            abaVazia:grupos.filter(g=>!subs.some(s=>s.g===g)),
            grupoIndefinido:grupos.filter(g=>!g)};
  });
  expect(r.semPane, 'sub-aba sem painel correspondente').toEqual([]);
  expect(r.semAba,  'painel sem aba que o abra').toEqual([]);
  expect(r.grupoSemAba, 'sub-aba de grupo sem aba').toEqual([]);
  expect(r.abaVazia, 'aba sem nenhum painel').toEqual([]);
  expect(r.grupoIndefinido, 'aba sem grupo declarado').toEqual([]);
});

test('o atalho de teclado alcanca TODAS as abas, nao um numero escrito a mao', async ({page})=>{
  await abrir(page);
  const n = await page.evaluate(()=>document.querySelectorAll('.tab').length);
  for(let i=1;i<=n;i++){
    await page.keyboard.press(String(i));
    const ativa = await page.evaluate(()=>document.querySelector('.tab.on')?.dataset.g);
    const esperada = await page.evaluate(i=>document.querySelectorAll('.tab')[i-1].dataset.g, i);
    expect(esperada, 'a aba declara o grupo').toBeTruthy();
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
          ];
    D.wip={ativos_ate_48h:23,teto:14,excedente:9};
    D.garg=[{tipo:"TOTAL",itens:5,teto:5},{tipo:"AGENDADO",itens:6,teto:5}];
    D.rw={dias_sobrevida_pior:11,dias_sobrevida:24,caixa_hoje:17023,queima_dia_base:700};
    let err=null; try{ rAgora(); }catch(e){ err=String(e); }
    const t=[...document.querySelectorAll('#faixa5 .f5')];
    return {err, n:t.length,
      semEstado:t.filter(x=>!/normal|sem banda|sem série|teto|sem dado/.test(x.querySelector('.e').textContent)).length,
      semQuem:t.filter(x=>!x.querySelector('.q').textContent.includes('quem move')).length,
      foraEscrito:t.find(x=>x.dataset.chave==='caixa.decisao_parada_rs').querySelector('.e').textContent,
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

/* CLASSE DE DEFEITO 7 · v59: NORMAL VIRA BOM. A banda p10-p90 aprende o patamar ruim: numero
   fora da meta ha semanas fica "normal" e a tela pintava de verde. Medido em 28/09/2026: os seis
   numeros da faixa fora da meta, os seis verdes. O invariante: fora da meta NUNCA sai verde, nem
   na borda do card nem na sparkline, e a persistencia vai por escrito. */
test('numero fora da meta nunca sai verde, mesmo dentro da banda normal', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    const s=(chave,serie,meta,dir,banda,p10,p90)=>({chave,serie,meta_num:meta,direcao:dir,p10,p90,situacao_banda:banda});
    D.se=[s("caixa.sobrevida_dias",[9,9,9,9,9,9,9,9,9],90,"maior_melhor","normal",9,16),
          s("entrega.output_sem_ack",[40,42,41,40,39,41,40,42,41],50,"menor_melhor","normal",39,42)];
    D.rw={dias_sobrevida_pior:9,dias_sobrevida:9,caixa_hoje:1,queima_dia_base:1};
    let err=null; try{ rAgora(); }catch(e){ err=String(e); }
    const t=k=>document.querySelector(`#faixa5 .f5[data-chave="${k}"]`);
    const cor=k=>(t(k).querySelector('.spk path[stroke]')||{getAttribute:()=>null}).getAttribute('stroke');
    return {err,
      foraClasse:t("caixa.sobrevida_dias").className, foraCor:cor("caixa.sobrevida_dias"),
      foraTexto:t("caixa.sobrevida_dias").querySelector('.e').textContent,
      naMetaClasse:t("entrega.output_sem_ack").className, naMetaCor:cor("entrega.output_sem_ack")};
  });
  expect(r.err, 'rAgora() derrubou o script').toBe(null);
  expect(r.foraClasse, 'fora da meta dentro da banda').not.toContain('bem');
  expect(r.foraClasse).toContain('atn');
  expect(r.foraCor, 'sparkline fora da meta nao pode ser verde').not.toBe('#30a46c');
  expect(r.foraTexto, 'a persistencia vai por escrito').toMatch(/fora da meta há \d+\+? d/);
  expect(r.naMetaClasse, 'na meta continua verde').toContain('bem');
  expect(r.naMetaCor).toBe('#30a46c');
});

test('o selo de saude diz quantas fontes falham, e fica verde quando todas voltam', async ({page})=>{
  await abrir(page);
  const r = await page.evaluate(()=>{
    SAUDE={n:24,e:0}; rSaude([]); const verde=document.getElementById('saude').textContent;
    const cls=document.getElementById('saude').className;
    SAUDE={n:24,e:3}; rSaude(['m9 — x','mo — y','frs — z']); const verm=document.getElementById('saude').textContent;
    return {verde, cls, verm, cls2:document.getElementById('saude').className};
  });
  expect(r.verde).toBe('fontes 24/24');
  expect(r.cls).toContain('bem');
  expect(r.verm).toBe('3 fontes falhando');
  expect(r.cls2).toContain('mal');
  /* o selo mora na barra do topo: no celular ele nao pode empurrar o botao de menu para fora */
  await page.setViewportSize({width:320,height:700});
  await revelarCasca(page);
  const w = await page.evaluate(()=>({W:document.documentElement.clientWidth,SW:document.documentElement.scrollWidth}));
  expect(w.SW, 'rolagem horizontal a 320px com o selo aceso').toBe(w.W);
});

/* CLASSE DE DEFEITO 8 · v60: A MESMA CARGA PEDIDA POR TRES DONOS. getSession e os eventos de
   onAuthStateChange (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED) chamavam carregar() cada um:
   tres downloads de 155 kB no mesmo segundo, medido em 28/09/2026 (tres painel_ping as 21:11:43).
   No EDGE as tres estouram o teto juntas e a tela fica com o dado de horas antes.
   O invariante: a abertura com sessao salva e todos os eventos de auth que o supabase-js
   dispara nela geram UMA chamada a painel_carga, e TOKEN_REFRESHED no meio do uso nenhuma. */
const DUBLE_AUTH = DUBLE_CONTA
  .replace("auth:{getSession:()=>new Promise(()=>{}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},",
    `auth:{getSession:()=>Promise.resolve({data:{session:{user:{id:"u"}}}}),
      onAuthStateChange:(cb)=>{window.__auth=cb; const s={user:{id:"u"}};
        cb("INITIAL_SESSION",s); cb("SIGNED_IN",s);
        return {data:{subscription:{unsubscribe(){}}}};}},`)
  .replace(`if(n==="painel_carga"){`, `if(n==="painel_carga"){ if(window.__segura) return new Promise(()=>{});`);

async function abrirComSessao(page, segura){
  const erros=[];
  page.on("pageerror",e=>erros.push(String(e)));
  await page.addInitScript(s=>{ window.__segura=s; }, !!segura);
  await page.route("**cdn.jsdelivr.net**", r=>r.fulfill({status:200,contentType:"application/javascript",body:DUBLE_AUTH}));
  await page.goto(PAGINA);
  await page.waitForFunction(()=>document.getElementById("selo-ver").textContent.trim()!=="—");
  await page.waitForTimeout(300);
  return erros;
}

test("abertura com sessao salva e eventos de auth geram UMA carga, e token renovado nenhuma", async ({page})=>{
  const erros = await abrirComSessao(page, true);   /* carga pendurada: simula o EDGE */
  const r1 = await page.evaluate(()=>window.__n.rpc.painel_carga||0);
  await page.evaluate(()=>{ carregar(); carregar(); });   /* toque no ↻ com a carga no ar */
  const r2 = await page.evaluate(()=>window.__n.rpc.painel_carga||0);
  await page.evaluate(()=>window.__auth("TOKEN_REFRESHED",{user:{id:"u"}}));
  const r3 = await page.evaluate(()=>window.__n.rpc.painel_carga||0);
  expect(erros, "erro de script").toEqual([]);
  expect(r1, "painel_carga na abertura com INITIAL_SESSION e SIGNED_IN disparados").toBe(1);
  expect(r2, "carregar() com uma carga no ar pega carona, nao abre outra requisicao").toBe(1);
  expect(r3, "TOKEN_REFRESHED no meio do uso nao recarrega a tela").toBe(1);
});

/* CLASSE DE DEFEITO 9 · v60: A TELA CONGELADA QUE PARECE VIVA. Sem gatilho de retorno, o iPhone
   trazia a pagina do segundo plano com a carga de horas antes. Medido em 28/09/2026: sete cards
   decididos as 19:12 seguiram na tela do Igor, cuja pagina era das 18:34.
   O invariante: voltar ao app depois de VOLTA_MS recarrega; voltar logo nao; e voltar com texto
   nao enviado num card NUNCA redesenha por cima dele. */
test("voltar ao app depois de um minuto recarrega, e nunca por cima de texto nao enviado", async ({page})=>{
  const erros = await abrirComSessao(page, false);
  const volta = ()=>page.evaluate(()=>{
    Object.defineProperty(document,"visibilityState",{value:"visible",configurable:true});
    document.dispatchEvent(new Event("visibilitychange"));
    return new Promise(r=>setTimeout(()=>r(window.__n.rpc.painel_carga||0),200));});
  const n0 = await page.evaluate(()=>window.__n.rpc.painel_carga||0);
  const logo = await volta();
  await page.evaluate(()=>{ CARGA=Date.now()-VOLTA_MS-1000; });
  const depois = await volta();
  await page.evaluate(()=>{ CARGA=Date.now()-VOLTA_MS-1000;
    const t=document.createElement("textarea"); t.value="o que fica valendo: pago 27/09";
    document.getElementById("app").appendChild(t); });
  const comRascunho = await volta();
  expect(erros, "erro de script").toEqual([]);
  expect(n0, "abertura").toBe(1);
  expect(logo, "voltar em menos de um minuto nao recarrega").toBe(n0);
  expect(depois, "voltar depois de um minuto recarrega").toBe(n0+1);
  expect(comRascunho, "com texto nao enviado a tela nao e redesenhada").toBe(n0+1);
});

/* CLASSE DE DEFEITO 10 · v61: DECIDIR EXIGIA ESCREVER. Medido em 29/09/2026: a bandeja tinha
   10 itens, 9 PRONTO, e o unico caminho de resposta na fila era digitar "o que fica valendo".
   O invariante: sobre o card focado por J/K, A aceita a recomendacao (DECISAO) ou abre os 4 atos
   do PRONTO, 1 a 4 escolhem o ato, S adia 2 dias, R recusa com motivo OPCIONAL; nada disso digita,
   e cada ato chega ao banco pela porta certa (escolher, agir ou painel_responder). */
const DUBLE_ARGS = DUBLE_CONTA.replace("rpc:(n)=>{window.__n.rpc[n]=(window.__n.rpc[n]||0)+1;",
  "rpc:(n,a)=>{window.__n.rpc[n]=(window.__n.rpc[n]||0)+1;(window.__n.args=window.__n.args||[]).push([n,a]);");

async function abrirComArgs(page){
  const erros=[];
  page.on("pageerror",e=>erros.push(String(e)));
  await page.route("**cdn.jsdelivr.net**", r=>r.fulfill({status:200,contentType:"application/javascript",body:DUBLE_ARGS}));
  await page.goto(PAGINA);
  await page.waitForFunction(()=>document.getElementById("selo-ver").textContent.trim()!=="—");
  await revelarCasca(page);
  return erros;
}
/* desenha a fila com um PRONTO, uma DECISAO com opcao recomendada e um card fora da bandeja */
const MONTA_FILA = ()=>{
  D.fila=[
    {origem:"tarefa",ref:"1405",titulo:"Revisar e enviar o RS-2026-002",nivel:1,acoes:[{verbo:"repactuar",campo:"date",label:"nova data"}]},
    {origem:"tarefa",ref:"999",titulo:"Achou o material no galpao?",nivel:1,acoes:[]},
    {origem:"fluxo",ref:"32",titulo:"PRONAMPE sem baixa",nivel:2,acoes:[{verbo:"pago",label:"paguei"}]}];
  D.band=[{tipo:"PRONTO",item_id:1405},{tipo:"DECISAO",item_id:999}];
  D.op=[{origem:"tarefa",ref:"999",opcoes:[{label:"Achou o material",recomendada:true},{label:"Nao achou"}]}];
  D.cor=[]; D.depois=[]; D.cont={}; foco=-1; window.__n.args=[];
  rAgora();
  return [...document.querySelectorAll("#fila1 .card")].map(c=>c.dataset.r);
};
const FOCA = (page,ref)=>page.evaluate(r=>focar(cards().findIndex(c=>c.dataset.r===r)), ref);
const ENVIA = page=>page.evaluate(async()=>{ await enviarPendente(); return window.__n.args; });

test("A, S e R decidem o card focado sem digitar, cada um pela porta certa", async ({page})=>{
  const erros = await abrirComArgs(page);
  const refs = await page.evaluate(MONTA_FILA);
  expect(refs, "os tres cards desenhados").toEqual(expect.arrayContaining(["1405","999","32"]));

  /* PRONTO: A abre os 4 atos, 2 escolhe "enviado" */
  await FOCA(page,"1405");
  await page.keyboard.press("a");
  expect(await page.evaluate(()=>!!document.querySelector('#fila1 .card[data-r="1405"] .qpr.on')), "A abre os atos do PRONTO").toBe(true);
  await page.keyboard.press("2");
  let args = await ENVIA(page);
  expect(args.find(x=>x[0]==="painel_responder"), "o ato 2 e enviado, pela porta definer")
    .toEqual(["painel_responder",{p_tipo:"PRONTO",p_id:1405,p_ato:"enviado",p_nota:null}]);

  /* DECISAO com opcao recomendada: A escolhe a recomendada */
  await page.evaluate(MONTA_FILA);
  await FOCA(page,"999");
  await page.keyboard.press("a");
  args = await ENVIA(page);
  expect(args.find(x=>x[0]==="escolher"), "A escolhe a opcao marcada recomendada")
    .toEqual(["escolher",{p_ref:"999",p_opcao:"Achou o material"}]);

  /* S: adia 2 dias pelo agir, com a data calculada na tela */
  await page.evaluate(MONTA_FILA);
  await FOCA(page,"1405");
  await page.keyboard.press("s");
  args = await ENVIA(page);
  const esperado = await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()+2);return ivData(d);});
  expect(args.find(x=>x[0]==="agir"), "S repactua para daqui a 2 dias")
    .toEqual(["agir",{p_origem:"tarefa",p_ref:"1405",p_verbo:"repactuar",p_valor:esperado}]);

  /* R: recusa com motivo vazio, sem recarregar a pagina */
  await page.evaluate(MONTA_FILA);
  await FOCA(page,"1405");
  await page.keyboard.press("r");
  expect(await page.evaluate(()=>document.getElementById("modal").classList.contains("on")), "R abre a recusa").toBe(true);
  await page.evaluate(()=>confirmarModal());
  args = await ENVIA(page);
  expect(args.find(x=>x[0]==="painel_responder"), "recusar PRONTO devolve a peca, motivo opcional")
    .toEqual(["painel_responder",{p_tipo:"PRONTO",p_id:1405,p_ato:"refazer",p_nota:null}]);
  const cargasR = await page.evaluate(()=>window.__n.args.filter(x=>x[0]==="painel_carga"&&!x[1]).length);
  expect(cargasR, "R com card focado nao recarrega a pagina inteira").toBe(0);

  /* card fora da bandeja: A nao grava nada; sem foco, R volta a ser recarregar */
  await page.evaluate(MONTA_FILA);
  await FOCA(page,"32");
  await page.keyboard.press("a");
  expect(await page.evaluate(()=>PEND), "A sem recomendacao nao agenda gravacao").toBe(null);
  await page.keyboard.press("Escape");
  const antes = await page.evaluate(()=>window.__n.rpc.painel_carga||0);
  await page.keyboard.press("r");
  const depois = await page.evaluate(()=>window.__n.rpc.painel_carga||0);
  expect(depois, "sem card focado, R recarrega como antes").toBe(antes+1);
  expect(erros, "erro de script").toEqual([]);
});

/* CLASSE DE DEFEITO 11 · v61: O TOPO FIXO COMIA A TELA. Medido em 29/09/2026: 161 px no computador
   (identidade 46, abas 47, filtros 67). O invariante: com a gaveta fechada o topo cabe em 64 px no
   celular e no computador largo; filtro ativo com a gaveta fechada aparece como contador no botao,
   porque lista filtrada sem aviso e dado escondido. */
for (const largura of [320, 390, 700, 1024, 1100, 1280]) {
  test(`o topo cabe em 64 px a ${largura}px com a gaveta fechada, e filtro ativo se declara`, async ({page})=>{
    await page.setViewportSize({width:largura, height:880});
    const erros = await abrirComArgs(page);
    const r = await page.evaluate(()=>{
      /* o pior caso do topo: selo de saude aceso com o texto mais longo */
      SAUDE={n:25,e:3}; rSaude(["m9 — x","mo — y","frs — z"]);
      /* fonte 1,5 px mais larga por letra: a CI (Linux) desenha mais largo que o Windows, e um topo
         que so cabe com a fonte certa quebra na maquina de outro. Mede-se o pior caso. */
      document.body.style.letterSpacing="1.5px";
      const h=()=>Math.round(document.querySelector(".top").getBoundingClientRect().height);
      const fechado=h(); gavetaFiltros(true); const aberto=h();
      const visivel=getComputedStyle(document.getElementById("filtros")).display!=="none";
      gavetaFiltros(false); F.frente="11-renda-alt"; montaFiltros();
      const n=document.getElementById("gavN");
      return {fechado,aberto,visivel,cont:n.textContent,mostra:getComputedStyle(n).display!=="none",
              W:document.documentElement.clientWidth,SW:document.documentElement.scrollWidth};
    });
    expect(erros, "erro de script").toEqual([]);
    expect(r.fechado, "altura do topo com a gaveta fechada").toBeLessThanOrEqual(64);
    expect(r.visivel, "a gaveta aberta mostra busca e filtros").toBe(true);
    expect(r.aberto, "abrir a gaveta aumenta o topo").toBeGreaterThan(r.fechado);
    expect(r.mostra, "filtro ativo com a gaveta fechada aparece no botao").toBe(true);
    expect(r.cont).toBe("1");
    expect(r.SW, "rolagem horizontal").toBe(r.W);
  });
}

/* CLASSE DE DEFEITO 12 · v62: SEIS DESTINOS DISPUTANDO O OLHO, E O TETO QUE A TELA NAO MOSTRAVA.
   Plano de 29/09 (doc 1201, secao 3.2): tres abas, e o teto de WIP desenhado na faixa. Medido em
   30/09/2026: a bandeja estava 5 de 5 (o gate ja bloqueava peca pronta nova) e a tela nao dizia.
   O invariante: cada aba leva aos seus paineis em no maximo dois toques, a sub-aba mostra so o
   grupo da aba, a aba repete o contador do painel dono, e o teto da bandeja na faixa e o MESMO
   recorte que o banco usa para bloquear (TOTAL do gargalo, agendado a parte). */
test('tres abas levam aos seis paineis, e o teto da faixa e o numero que bloqueia', async ({page})=>{
  const erros=[]; page.on('pageerror',e=>erros.push(String(e)));
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(async()=>{
    const out={};
    for(const tab of document.querySelectorAll('.tab')){
      tab.click(); await new Promise(r=>setTimeout(r,20));
      const vis=[...document.querySelectorAll('#subnav .sub')].filter(s=>!s.hidden);
      out[tab.dataset.g]={visiveis:vis.map(s=>s.dataset.p), todasDoGrupo:vis.every(s=>s.dataset.g===tab.dataset.g), paineis:[]};
      for(const s of vis){ s.click(); await new Promise(r=>setTimeout(r,20));
        out[tab.dataset.g].paineis.push(document.querySelector('.pane.on')?.id);}
    }
    document.getElementById('n-sent').textContent='3';
    await new Promise(r=>setTimeout(r,20));
    const espelho=document.getElementById('n-g-maquina').textContent;
    D.wip={ativos_ate_48h:23,teto:14,excedente:9};
    D.garg=[{tipo:'DECISAO',itens:2,teto:5},{tipo:'PRONTO',itens:3,teto:5},{tipo:'TOTAL',itens:5,teto:5},{tipo:'AGENDADO',itens:6,teto:5}];
    D.cor=[]; D.fila=[]; D.depois=[]; D.cont={}; rAgora();
    const tile=k=>document.querySelector(`#faixa5 .f5[data-chave="${k}"]`);
    return {out, espelho,
      band:{v:tile('bandeja.teto').querySelector('.v').textContent, e:tile('bandeja.teto').querySelector('.e').textContent, c:tile('bandeja.teto').className,
            barraVerde:!!tile('bandeja.teto').querySelector('.blt i.ok')},
      wip:{v:tile('fila.wip_ativo_48h').querySelector('.v').textContent, e:tile('fila.wip_ativo_48h').querySelector('.e').textContent, c:tile('fila.wip_ativo_48h').className},
      janelaNoHeroi:document.getElementById('hero').textContent.includes('janela'),
      pilula:(()=>{const n=document.getElementById('n-g-acompanhar'); n.textContent=''; n.className='n';
        return getComputedStyle(n).backgroundColor;})()};
  });
  expect(erros, 'erro de script').toEqual([]);
  expect(Object.keys(r.out).length, 'tres abas').toBe(3);
  for(const [g,x] of Object.entries(r.out)){
    expect(x.todasDoGrupo, `a aba ${g} mostra so as sub-abas dela`).toBe(true);
    expect(x.paineis, `cada sub-aba de ${g} abre o proprio painel`).toEqual(x.visiveis.map(p=>'p-'+p));
  }
  expect(r.out.maquina.visiveis, 'sentinela mora em maquina').toContain('sentinela');
  expect(r.out.acompanhar.visiveis, 'tudo mora em acompanhar').toContain('tudo');
  expect(r.espelho, 'a aba repete o contador do painel dono').toBe('3');
  expect(r.band.v, 'bandeja usa o TOTAL do gargalo, nao a bandeja inteira').toMatch(/^5\/5/);
  expect(r.band.e, 'no teto o bloqueio vai por escrito').toContain('bloqueada');
  expect(r.band.e, 'o agendado aparece a parte').toContain('6 agendados');
  expect(r.wip.v).toMatch(/^23\/14/);
  expect(r.wip.c, 'acima do teto sai vermelho').toContain('mal');
  expect(r.band.barraVerde, 'no teto a barra nao sai verde: o gate ja bloqueia').toBe(false);
  expect(r.pilula, 'aba sem contador nao desenha pilula vazia').toBe('rgba(0, 0, 0, 0)');
  expect(r.janelaNoHeroi, 'o mesmo numero nao se repete no heroi').toBe(false);
});

/* CLASSE DE DEFEITO 4 · v63: numero que parece completo e nao e. A sobrevida so soma recebivel
   com valor E data; em 30/09/2026 tres entradas ficavam fora (Conenge sem valor, R$ 37 mil sem
   data) e a tela nao dizia. Pior: o unico aviso que existia (fontes_de_caixa_sem_valor) contava
   uma linha CANCELADA. O teste afirma os dois lados: com entrada fora, a faixa diz quantas e por
   que; sem entrada fora, nenhuma faixa. */
test('a sobrevida avisa quantas entradas ficaram fora da conta, e cala quando nao ha', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    const base={dias_sobrevida:14,dias_sobrevida_pior:8,caixa_hoje:14813.27,queima_dia_base:1038.32,
      saida_firme_30d:25725.49,saida_incerta_30d:14628.36,entrada_provavel_30d:7500,lacuna:"completo"};
    const el=document.getElementById('runway');
    D.rw={...base,entradas_fora_n:3,entradas_sem_valor_n:1,entradas_sem_data_rs:"37000.000"};
    let err=null; try{ rRunway(); }catch(e){ err=String(e); }
    const com=el?el.textContent:null;
    D.rw={...base,entradas_fora_n:0,entradas_sem_valor_n:0,entradas_sem_data_rs:"0"};
    try{ rRunway(); }catch(e){ err=err||String(e); }
    return {err, existe:!!el, com, sem:el?el.textContent:null};
  });
  expect(r.err,  'rRunway() derrubou o script').toBe(null);
  expect(r.existe, 'o cartao #runway existe na pagina').toBe(true);
  expect(r.com).toContain('3 entradas a receber fora desta conta');
  expect(r.com).toContain('1 sem valor');
  expect(r.com).toContain('2 sem data');
  expect(r.sem).not.toContain('fora desta conta');
});

/* v64 · t618: com histerese, o card vermelho cujo dia de hoje ja voltou para a meta esta em
   RECUPERACAO. Ele nao pode dizer "vigiar" como se fosse aviso novo, e o card dentro da meta
   com so a janela longa fora continua dizendo "vigiar". Mata a classe: rotulo que contradiz a cor. */
test('card vermelho com hoje dentro diz que esta em recuperacao, e nao "vigiar"', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    const k=(chave,situacao,hoje,longa)=>({chave,dimensao:"motor",rotulo:chave,unidade:"num",direcao:"menor_melhor",
      meta_num:0,valor:0,serie:[1,1,0],situacao,tendencia:"melhorou",fora_da_meta:hoje,janela_longa_fora:longa,p10:0,p90:1});
    D.ev=[k("a.recuperando","fora",false,true),k("b.vigiar","dentro",false,true),k("c.fora","fora",true,true)];
    D.mat=[];D.loop=[];
    let err=null; try{ rEvolucao(); }catch(e){ err=String(e); }
    const card=c=>[...document.querySelectorAll('#kpis .kpi')].find(e=>e.querySelector('.k').textContent===c);
    return {err, rec:card("a.recuperando").textContent, recCls:card("a.recuperando").className,
      vig:card("b.vigiar").textContent, fora:card("c.fora").textContent,
      legenda:document.querySelector('#kpis p.s').textContent};
  });
  expect(r.err, 'rEvolucao() derrubou o script').toBe(null);
  expect(r.recCls, 'recuperacao continua vermelha').toContain('fora');
  expect(r.rec).toContain('segue vermelho até a média de 7 dias voltar');
  expect(r.rec).not.toContain('vigiar');
  expect(r.vig).toContain('janela longa fora: vigiar');
  expect(r.fora).not.toContain('segue vermelho');
  expect(r.legenda).toContain('um dia bom sozinho não apaga');
});

/* v65 · onda 1 do plano de 01/10/2026: CAIXA DAS 13 SEMANAS. A classe que mata: previsao de caixa
   que so enxerga uma janela de 30 dias e esconde o buraco das semanas seguintes. O invariante:
   13 colunas, a semana mais apertada marcada e igual ao menor saldo do banco, a primeira semana
   negativa dita por escrito, as entradas incertas listadas da maior para a menor, e falta de
   dado declarada em vez de secao vazia. */
test('o caixa das 13 semanas desenha 13 colunas e diz por escrito quando fica negativo', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    const ini=i=>{const d=new Date(Date.UTC(2026,8,28+7*(i-1)));return d.toISOString().slice(0,10);};
    const base=[15301,13276,5104,-2674,9455,-3277,-4253,-7548,-3867,-15005,-17504,-20575,-1000];
    D.c13=base.map((v,i)=>({semana:i+1,inicio:ini(i+1),saldo_base:v,saldo_pior:v-20000}));
    D.c13i=[{natureza:"receber",status:"incerto",valor_igor:7500,data_venc:"2026-10-02",descricao:"CPA2 parcela 3"},
            {natureza:"receber",status:"incerto",valor_igor:25000,data_venc:"2026-10-20",descricao:"Missao habite-se"},
            {natureza:"pagar",status:"incerto",valor_igor:9999,data_venc:"2026-10-02",descricao:"saida nao entra na lista"}];
    let err=null; try{ rCaixa13(); }catch(e){ err=String(e); }
    const el=document.getElementById('caixa13');
    const cols=[...el.querySelectorAll('.c13c')];
    const min=el.querySelector('.c13c.min');
    const itens=[...el.querySelectorAll('.c13i')].map(x=>x.textContent);
    D.c13=[]; let vazio=null; try{ rCaixa13(); vazio=el.textContent; }catch(e){ err=err||String(e); }
    return {err, n:cols.length, minSemana:min&&min.dataset.semana, negs:el.querySelectorAll('.c13c.neg').length,
      titulo:cols.length?null:null, itens, vazio, texto:null};
  });
  expect(r.err, 'rCaixa13() derrubou o script').toBe(null);
  expect(r.n, 'uma coluna por semana').toBe(13);
  expect(r.minSemana, 'a semana mais apertada e a do menor saldo').toBe('12');
  expect(r.itens.length, 'so entradas incertas na lista').toBe(2);
  expect(r.itens[0], 'a maior entrada incerta vem primeiro').toContain('Missao habite-se');
  expect(r.vazio, 'sem dado se declara').toContain('sem dado no snapshot');
});

test('o caixa das 13 semanas escreve a primeira semana negativa no titulo', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const t = await page.evaluate(()=>{
    D.c13=[{semana:1,inicio:"2026-09-28",saldo_base:100,saldo_pior:50},{semana:2,inicio:"2026-10-05",saldo_base:-10,saldo_pior:-60}];
    D.c13i=[]; rCaixa13(); return document.querySelector('#caixa13 .c13t').textContent;
  });
  expect(t).toContain('negativo na semana de 05/10');
});

/* v65 · no celular a decisao sobe: a faixa mostra 3 numeros e um botao abre os outros; no
   computador os 7 aparecem e o botao some. A classe que mata: numero de topo empurrando a
   primeira decisao para baixo da dobra. */
for (const [largura, visiveis, botao] of [[390,3,true],[1280,7,false]]) {
  test(`a faixa mostra ${visiveis} numeros a ${largura}px e o botao abre o resto`, async ({page})=>{
    await page.setViewportSize({width:largura, height:844});
    await abrir(page);
    await revelarCasca(page);
    const r = await page.evaluate(()=>{
      D.se=[]; D.wip={ativos_ate_48h:21,teto:18,excedente:3}; D.garg=[{tipo:"TOTAL",itens:5,teto:5}];
      D.rw={dias_sobrevida_pior:8,dias_sobrevida:32,caixa_hoje:14813,queima_dia_base:461};
      rAgora();
      const vis=()=>[...document.querySelectorAll('#faixa5 .f5')].filter(e=>getComputedStyle(e).display!=='none').length;
      const b=document.querySelector('#faixa5 .f5mais');
      const antes=vis(), mostraBotao=!!b&&getComputedStyle(b).display!=='none';
      if(mostraBotao) b.click();
      return {total:document.querySelectorAll('#faixa5 .f5').length, antes, mostraBotao, depois:vis(),
        W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};
    });
    expect(r.total, 'a faixa tem 7 numeros').toBe(7);
    expect(r.antes, 'numeros visiveis antes do toque').toBe(visiveis);
    expect(r.mostraBotao, 'botao de abrir o resto').toBe(botao);
    if (botao) expect(r.depois, 'o botao abre os 7').toBe(7);
    expect(r.SW, 'rolagem horizontal').toBe(r.W);
  });
}

/* v66 · onda 2 do plano de 01/10/2026 (doc 1507). Tres classes de defeito:
   (a) dono escrito a mao em todo numero ("quem move: voce" em tudo nao diz nada);
   (b) fila do dia maior que o tempo do dia sem aviso;
   (c) triagem que exige rolar a lista: o modo foco mostra UM card e age pelo mesmo caminho de A e S. */
const fsV66 = require('fs');
const pathV66 = require('path');
const CARD = (ref, ttl) => ({origem:'tarefa', ref:String(ref), nivel:1, acoes:[], titulo:ttl, titulo_completo:ttl, recomendacao:'Faça.'});

test('o dono de cada numero vem do banco, e nenhum "quem move" esta escrito a mao', async ({page})=>{
  const fonte = fsV66.readFileSync(pathV66.resolve(__dirname,'..','index.html'),'utf8');
  expect((fonte.match(/quem:"você"/g)||[]).length, 'dono escrito a mao no codigo').toBe(0);
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    D.kdono=[{chave:'caixa.sobrevida_dias',dono:'igor'},{chave:'motor.slo_rotina_pct',dono:'claude'}];
    const k=(chave)=>({chave,dimensao:"caixa",rotulo:chave,unidade:"num",direcao:"maior_melhor",meta_num:1,valor:1,serie:[1],situacao:"dentro",tendencia:"estavel",p10:0,p90:1});
    D.ev=[k('caixa.sobrevida_dias'),k('motor.slo_rotina_pct'),k('sem.dono')]; D.mat=[]; D.loop=[];
    let err=null; try{ rEvolucao(); }catch(e){ err=String(e); }
    const t=c=>[...document.querySelectorAll('#kpis .kpi')].find(e=>e.querySelector('.k').textContent===c).textContent;
    return {err, igor:t('caixa.sobrevida_dias'), maq:t('motor.slo_rotina_pct'), sem:t('sem.dono')};
  });
  expect(r.err).toBe(null);
  expect(r.igor).toContain('quem move: você');
  expect(r.maq).toContain('quem move: a máquina');
  expect(r.sem, 'sem dono se declara').toContain('sem dono no banco');
});

test('o dia avisa quando a fila de hoje passa do tempo declarado', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(([c1,c2,c3])=>{
    D.fila=[c1,c2,c3]; D.min=[{id:1,minutos_estimados:90},{id:2,minutos_estimados:60}];
    D.cap={minutos_dia:120};
    let err=null; try{ rAgora(); }catch(e){ err=String(e); }
    const passa=document.getElementById('h-fila1').textContent;
    const tag=document.querySelector('#fila1 .tag.min')?document.querySelector('#fila1 .tag.min').textContent:null;
    D.cap={minutos_dia:300}; rAgora(); const cabe=document.getElementById('h-fila1').textContent;
    return {err, passa, tag, cabe};
  }, [CARD(1,'um'),CARD(2,'dois'),CARD(3,'tres sem estimativa')]);
  expect(r.err, 'rAgora() derrubou o script').toBe(null);
  expect(r.tag, 'o card mostra os minutos').toContain('~90 min');
  expect(r.passa, 'passou do tempo: avisa por escrito').toContain('passa 60 min');
  expect(r.passa, 'card sem estimativa se declara').toContain('1 sem estimativa');
  expect(r.cabe).toContain('180 de 300 min');
  expect(r.cabe).not.toContain('passa');
});

test('modo foco mostra um card por vez, anda com os botoes e sai com Esc', async ({page})=>{
  await page.setViewportSize({width:390, height:844});
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(([c1,c2,c3])=>{
    D.fila=[c1,c2,c3]; D.min=[]; D.cap={minutos_dia:120};
    rAgora();
    const vis=()=>[...document.querySelectorAll('#fila1 .card')].filter(e=>getComputedStyle(e).display!=='none').length;
    const antes=vis();
    modoFoco(true);
    const um=vis(), cont=document.querySelector('#fbar .fc').textContent;
    const topo=Math.round(document.querySelector('#fila1 .card.atual').getBoundingClientRect().top);
    document.querySelectorAll('#fbar button')[1].click();
    const cont2=document.querySelector('#fbar .fc').textContent;
    const faixaVisivel=getComputedStyle(document.getElementById('faixa5')).display!=='none';
    /* o gesto usa o MESMO caminho da tecla: troca qAceitar/qAdiar por espias */
    const chamadas=[]; const oA=qAceitar, oS=qAdiar;
    qAceitar=(o,r)=>chamadas.push('a:'+r); qAdiar=(o,r)=>chamadas.push('s:'+r);
    gestoFoco(120); gestoFoco(-120); gestoFoco(30);
    qAceitar=oA; qAdiar=oS;
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
    return {antes, um, cont, cont2, topo, faixaVisivel, chamadas, depois:vis(), foco:document.body.classList.contains('foco')};
  }, [CARD(1,'um'),CARD(2,'dois'),CARD(3,'tres')]);
  expect(r.antes).toBe(3);
  expect(r.um, 'modo foco: um card na tela').toBe(1);
  expect(r.cont).toBe('1 de 3');
  expect(r.cont2, 'o botao proximo anda').toBe('2 de 3');
  expect(r.faixaVisivel, 'a faixa sai da frente no foco').toBe(false);
  expect(r.topo, 'no celular o card do foco fica no alto da tela').toBeLessThanOrEqual(260);
  expect(r.chamadas, 'direita aceita, esquerda adia, toque curto nao faz nada').toEqual(['a:2','s:2']);
  expect(r.foco, 'Esc sai do foco').toBe(false);
  expect(r.depois).toBe(3);
});

/* v67 · onda 3 do plano de 01/10/2026 (doc 1507). Classes de defeito:
   (a) proposta enviada tratada como receita, ou proposta vencida que ninguem ve;
   (b) previsao de caixa que nunca e conferida contra o realizado;
   (c) rotina gastando o orcamento de falha em silencio;
   (d) criterio de tempo por decisao sem sensor. */
test('o funil separa aberto de aceito, calcula conversao e acusa validade vencida', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    D.fun=[
      {codigo:'PC-1',cliente:'A',valor:45000,estado:'aceita',dias_desde_envio:30,validade_vencida:false,dias_aceite_ate_receber:0},
      {codigo:'PC-2',cliente:'B',valor:19452,estado:'aceita',dias_desde_envio:30,validade_vencida:false,dias_aceite_ate_receber:4},
      {codigo:'PC-3',cliente:'C',valor:15000,estado:'perdida',dias_desde_envio:30,validade_vencida:false,dias_aceite_ate_receber:null},
      {codigo:'PC-4',cliente:'Verde',valor:910000,estado:'aberta',dias_desde_envio:23,validade_vencida:true,dias_aceite_ate_receber:null}];
    let err=null; try{ rFunil(); }catch(e){ err=String(e); }
    const t=document.getElementById('funil').textContent;
    const venc=!!document.querySelector('#funil .funi.venc');
    D.fun=[]; rFunil(); const vazio=document.getElementById('funil').textContent;
    return {err,t,venc,vazio};
  });
  expect(r.err, 'rFunil() derrubou o script').toBe(null);
  expect(r.t).toContain('1 em aberto');
  expect(r.t, 'conversao = aceitas / decididas').toContain('conversão 67%');
  expect(r.t, 'mediana do aceite ao recebimento').toContain('2 dias');
  expect(r.t, 'proposta nao e contrato, por escrito').toContain('não entra no caixa');
  expect(r.venc, 'validade vencida marcada').toBe(true);
  expect(r.vazio).toContain('sem proposta registrada');
});

test('o caixa das 13 semanas diz o erro da previsao, ou quando comeca a medir', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    D.c13=[{semana:1,inicio:"2026-09-28",saldo_base:100,saldo_pior:50}]; D.c13i=[];
    D.c13e=[]; rCaixa13(); const antes=document.getElementById('caixa13').textContent;
    D.c13e=[{erro_pct:12.5},{erro_pct:7.5}]; rCaixa13(); const depois=document.getElementById('caixa13').textContent;
    return {antes,depois};
  });
  expect(r.antes).toContain('começa a medir');
  expect(r.depois).toContain('Erro da previsão da semana: 10%');
});

test('o orcamento de falha lista toda rotina e acende quem estourou', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    D.eb=[{nome:'r1',slo_pct:95,cumprimento_pct:80,falhas_7d:3,orcamento_falhas_7d:1,consumo_pct:300,veredito_budget:'ESTOUROU'},
          {nome:'r2',slo_pct:95,cumprimento_pct:100,falhas_7d:0,orcamento_falhas_7d:1,consumo_pct:0,veredito_budget:'DENTRO DO ORCAMENTO'}];
    let err=null; try{ rOrcamento(); }catch(e){ err=String(e); }
    const rows=[...document.querySelectorAll('#orcamento tr')];
    return {err, n:rows.length, estourou:document.querySelectorAll('#orcamento tr.estourou').length,
      aviso:document.getElementById('s-rotinas').textContent.includes('só avisa')};
  });
  expect(r.err).toBe(null);
  expect(r.n, 'cabecalho + uma linha por rotina').toBe(3);
  expect(r.estourou).toBe(1);
  expect(r.aviso, 'a decisao de so avisar esta escrita na tela').toBe(true);
});

test('o tempo por decisao sai do foco ate o ato, so quando o ato e possivel, e diz o modo', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    const it={origem:'tarefa',ref:'7',nivel:1,titulo:'x',titulo_completo:'x',recomendacao:'y',
      acoes:[{verbo:'repactuar',label:'nova data'}]};
    D.fila=[it]; D.min=[]; D.cap={minutos_dia:120}; rAgora();
    const chamadas=[]; const rpcOrig=sb.rpc;
    sb.rpc=(nome,args)=>{ if(nome==='painel_medir_decisao') chamadas.push(args); return new Promise(()=>{}); };
    focar(0);
    const s=medirDecisao('tarefa','7','s');
    const semRec=medirDecisao('tarefa','7','a');
    modoFoco(true); focar(0);
    const s2=medirDecisao('tarefa','7','s');
    modoFoco(false); sb.rpc=rpcOrig;
    let viaTecla=null; const fo=fAto; fAto=k=>{viaTecla=k;}; focar(0);
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'s'})); fAto=fo;
    return {chamadas, s, semRec, s2, viaTecla};
  });
  expect(r.chamadas.length, 'adiar possivel mede; aceitar sem recomendacao nao mede').toBe(2);
  expect(r.semRec).toBe(null);
  expect(r.s.p_modo).toBe('lista');
  expect(r.s2.p_modo).toBe('foco');
  expect(r.s.p_ms).toBeGreaterThanOrEqual(0);
  expect(r.viaTecla, 'a tecla passa pelo mesmo caminho do botao').toBe('s');
});
