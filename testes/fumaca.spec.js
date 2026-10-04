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

/* v71 · R7: a tag do supabase-js tem integrity (SRI). Corpo dublado servido no lugar do arquivo
   falha o hash e o navegador RECUSA rodar: o duble nunca chegaria a pagina. Entao o duble entra
   antes de qualquer script da pagina (addInitScript) e a CDN e abortada: nenhum byte de rede, e o
   integrity de producao fica intocado. O teste "a CDN dublada no lugar do arquivo e recusada"
   prova que o navegador de fato confere o hash. */
async function dublar(page, corpo){
  await page.addInitScript(corpo);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
}

async function abrir(page){
  const erros=[];
  page.on('pageerror',e=>erros.push(String(e)));
  await dublar(page, DUBLE);
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
  await dublar(page, DUBLE_CONTA);
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
  await dublar(page, DUBLE_CONTA.replace("ks.forEach(k=>{d[k]=[];});","ks.filter(k=>k!==\"fila\").forEach(k=>{d[k]=[];});"));
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
  await dublar(page, DUBLE_AUTH);
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
  await dublar(page, DUBLE_ARGS);
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
            {natureza:"receber",status:"incerto",valor_igor:25000,data_venc:"2026-10-20",descricao:"Missao habite-se",peso:0.5},
            {natureza:"pagar",status:"incerto",valor_igor:9999,data_venc:"2026-10-02",descricao:"saida nao entra na lista"}];
    let err=null; try{ rCaixa13(); }catch(e){ err=String(e); }
    const el=document.getElementById('caixa13');
    const cols=[...el.querySelectorAll('.c13c')];
    const min=el.querySelector('.c13c.min');
    const itens=[...el.querySelectorAll('.c13i')].map(x=>x.textContent);
    const negs=el.querySelectorAll('.c13c.neg').length, titulo=el.querySelector('.c13t').textContent,
          texto=el.querySelector('.c13s').textContent, crit=!!el.querySelector('.c13.crit');
    D.c13=[]; let vazio=null; try{ rCaixa13(); vazio=el.textContent; }catch(e){ err=err||String(e); }
    return {err, n:cols.length, minSemana:min&&min.dataset.semana, negs, titulo, texto, crit, itens, vazio};
  });
  expect(r.err, 'rCaixa13() derrubou o script').toBe(null);
  expect(r.n, 'uma coluna por semana').toBe(13);
  /* Este e o caso realista: a primeira semana negativa (4a) nao e a primeira nem a do menor saldo (12a), e o
     saldo volta a positivo na 5a. O teste seguinte cobre so o caso minimo de duas semanas. */
  expect(r.negs, 'toda semana com saldo negativo e marcada, e so elas').toBe(9);
  expect(r.titulo, 'o titulo diz a PRIMEIRA semana negativa, nao a pior').toContain('negativo na semana de 19/10');
  expect(r.texto, 'sem as incertas, o negativo chega ja na 1a semana').toContain('Sem as entradas incertas, o saldo fica negativo na semana de 28/09');
  expect(r.crit, 'o cartao se marca critico').toBe(true);
  expect(r.minSemana, 'a semana mais apertada e a do menor saldo').toBe('12');
  expect(r.itens.length, 'so entradas incertas na lista').toBe(2);
  expect(r.itens[0], 'a maior entrada incerta vem primeiro').toContain('Missao habite-se');
  /* s764 (02/10/2026): o caso base pondera cada entrada incerta pela chance; a lista diz o peso */
  expect(r.itens[0], 'o peso da entrada incerta aparece').toContain('conta 50%');
  expect(r.itens[1], 'sem peso no dado, nada inventado').not.toContain('conta');
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

/* v68 · f5, auditoria de 02/10/2026. Quatro classes de defeito:
   (a) ordem so por peso: tarefa vencida ficava abaixo do corte atras de item que vence depois;
   (b) o banco entrega a peca pronta e o card nao abre;
   (c) a escada diz o degrau e cala o que trava;
   (d) "ver depois" sem teto, com falha virando lista vazia. */
test('tarefa vencida ou de hoje sobe acima do corte, com a classe de servico escrita no card', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    const dia=n=>{const d=new Date(); d.setDate(d.getDate()+n); return ivData(d);};
    const it=(origem,ref,pos,peso,dr,camada)=>({origem,ref:String(ref),posicao:pos,peso,data_ref:dr,camada_tela:camada||'hoje',
      nivel:3,acoes:[{verbo:'repactuar',campo:'date',label:'nova data'}],titulo:'item '+ref,titulo_completo:'item '+ref});
    /* a camada hoje do banco, na ordem do peso: a demanda que vence em 3 dias vem primeiro */
    D.fila=[it('demanda','Cliente-audios',1,75,dia(3)),it('fluxo','32',2,72,null),it('tarefa','1545',3,70,dia(0)),
            it('tarefa','1517',4,70,dia(0)),it('tarefa','1424',5,70,dia(0))];
    D.exp=[it('tarefa','1334',9,70,dia(-7),'depois')];   /* a EKOS que o peso deixou no segundo plano */
    D.depois=[it('tarefa','1334',9,70,dia(-7),'depois'),it('tarefa','1600',12,60,dia(2),'depois')];
    D.cont={depois:2}; D.cor=[]; D.min=[]; D.cap=null; semTeto=false;
    let err=null; try{ rAgora(); marcaAbas(); }catch(e){ err=String(e); }
    const cards=[...document.querySelectorAll('#fila1 .card')];
    const tag=r=>{const c=document.querySelector(`#fila1 .card[data-r="${r}"] .tag.cs`); return c?c.textContent:null;};
    const achou=!!achaIt('tarefa','1334');
    const out={err, ordem:cards.map(c=>c.dataset.r), ekos:tag('1334'), hoje:tag('1545'),
      cab:document.getElementById('h-fila1').textContent, estouro:document.getElementById('estouro').textContent,
      fila2:[...document.querySelectorAll('#fila2 .card')].map(c=>c.dataset.r), aba:document.getElementById('n-agora').textContent,
      achou};
    D.exp=undefined; D.depois=[];
    try{ rAgora(); out.semExp=[...document.querySelectorAll('#fila1 .card')].map(c=>c.dataset.r); }catch(e){ out.semExp=String(e); }
    return out;
  });
  expect(r.err, 'rAgora() derrubou o script').toBe(null);
  expect(r.ordem[0], 'a vencida ha 7 dias abre a fila').toBe('1334');
  expect(r.ordem.slice(1,4), 'as que vencem hoje vem antes da demanda de daqui a 3 dias').toEqual(['1545','1517','1424']);
  expect(r.ordem.length, 'o teto de 5 continua valendo').toBe(5);
  expect(r.ordem.indexOf('Cliente-audios'), 'a demanda de peso maior que vence em 3 dias fica atras das que vencem').toBe(4);
  expect(r.ordem, 'o item sem prazo cai abaixo do corte').not.toContain('32');
  expect(r.ekos, 'a classe vai escrita no card').toBe('urgente · vencida há 7d');
  expect(r.hoje).toBe('data fixa · vence hoje');
  expect(r.cab, 'o cabecalho conta as classes').toContain('1 vencida · 3 vencem hoje');
  expect(r.estouro, 'o corte se anuncia').toContain('5 de 6');
  expect(r.fila2, 'a promovida sai do segundo plano, a futura fica').toEqual(['1600']);
  expect(r.aba, 'o contador da aba conta a tarefa promovida').toBe('6');
  expect(r.achou, 'A, S e R acham o card promovido').toBe(true);
  expect(r.semExp, 'sem a chave exp a tela ordena o que tem, sem derrubar').toEqual(['1545','1517','1424','Cliente-audios','32']);
});

test('o card abre a peca pronta: Drive pelo id, caminho copiavel, e id forjado nao vira link', async ({page})=>{
  await abrir(page);
  const r = await page.evaluate(()=>{
    const base={origem:'tarefa',nivel:1,acoes:[],titulo:'Revisar peca',titulo_completo:'Revisar peca'};
    const box=document.createElement('div'); document.body.appendChild(box);
    const html=it=>{box.innerHTML=cardFila(it); return box;};
    let err=null, a={}, b={}, c={}, d={};
    try{
      let x=html({...base,ref:'1',artefato_drive_id:'1AbC-dEf_ghIJkl23',artefato_path:'08-dabli/peca.pdf'});
      const l=x.querySelector('.peca a');
      a={href:l&&l.getAttribute('href'),alvo:l&&l.target,rel:l&&l.rel,txt:l&&l.textContent,
         cam:x.querySelector('.pecap')&&x.querySelector('.pecap').textContent};
      x=html({...base,ref:'2',artefato_path:'G:/Meu Drive/CEREBRO IGOR/08/peca v03.docx'});
      b={link:!!x.querySelector('.peca a'),cam:x.querySelector('.pecap').textContent,copia:!!x.querySelector('.peca button')};
      x=html({...base,ref:'3'}); c={peca:!!x.querySelector('.peca')};
      x=html({...base,ref:'4',artefato_drive_id:'x" onmouseover="alert(1)'});
      d={peca:!!x.querySelector('.peca'),onmouse:x.innerHTML.includes('onmouseover=')};
    }catch(e){ err=String(e); }
    return {err,a,b,c,d};
  });
  expect(r.err, 'cardFila derrubou').toBe(null);
  expect(r.a.href, 'drive_id abre no Drive').toBe('https://drive.google.com/open?id=1AbC-dEf_ghIJkl23');
  expect(r.a.alvo).toBe('_blank');
  expect(r.a.rel).toContain('noopener');
  expect(r.a.txt).toBe('abrir peça');
  expect(r.a.cam, 'o caminho aparece junto').toBe('08-dabli/peca.pdf');
  expect(r.b.link, 'so com caminho nao inventa link').toBe(false);
  expect(r.b.cam).toBe('G:/Meu Drive/CEREBRO IGOR/08/peca v03.docx');
  expect(r.b.copia, 'botao de copiar o caminho').toBe(true);
  expect(r.c.peca, 'card sem peca nao desenha a linha').toBe(false);
  expect(r.d.peca, 'id com forma errada e sem caminho: nada').toBe(false);
  expect(r.d.onmouse, 'id forjado nao entra no HTML').toBe(false);
});

test('a escada diz o que trava o proximo degrau, com valor e quem move cada KPI', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(()=>{
    D.kdono=[{chave:'decisao.ratificacao_pct',dono:'igor'},{chave:'motor.slo_rotina_pct',dono:'claude'}];
    const m=(dimensao,ordem,nivel,quais,falta)=>({dimensao,ordem,nivel,rotulo:dimensao,maior_serie:7,kpis_ativos:3,
      kpis_com_alarme:1,quais_travam:quais,falta_para_o_proximo:falta});
    D.mat=[m('contrato',1,3,'executor.aberturas_duplicadas_7d=10','TETO 3 POR RESULTADO'),
           m('motor',4,3,'motor.slo_rotina_pct=92.3, motor.achados_alto=1','TETO 3 POR RESULTADO'),
           m('fila_decisao',5,3,'decisao.ratificacao_pct=66.7','TETO 3 POR RESULTADO'),
           m('memoria',2,5,null,'degrau 5')];
    D.ev=[]; D.loop=[];
    let err=null; try{ rEvolucao(); rHero(); }catch(e){ err=String(e); }
    const t=document.getElementById('travas');
    const k=c=>{const e=t.querySelector(`.travk[data-chave="${c}"]`); return e?e.textContent:null;};
    const out={err, txt:t.textContent, n:t.querySelectorAll('.travk').length, dims:t.querySelectorAll('.travd').length,
      rat:k('decisao.ratificacao_pct'), slo:k('motor.slo_rotina_pct'), dup:k('executor.aberturas_duplicadas_7d'),
      linhaDim:document.getElementById('dims').textContent, heroi:document.getElementById('hero-dash').textContent};
    D.mat=D.mat.map(x=>({...x,nivel:5,quais_travam:null})); rEvolucao(); out.cinco=t.textContent;
    D.mat=[]; try{ rEvolucao(); }catch(e){ out.err=out.err||String(e); } out.vazio=t.innerHTML;
    return out;
  });
  expect(r.err, 'rEvolucao() derrubou o script').toBe(null);
  expect(r.txt).toContain('O que segura o degrau 4');
  expect(r.txt).toContain('4 números fora da meta em 3 dimensões');
  expect(r.n, 'um chip por KPI que trava').toBe(4);
  expect(r.dims, 'so as dimensoes presas no menor degrau').toBe(3);
  expect(r.rat).toContain('= 66.7');
  expect(r.rat).toContain('quem move: você');
  expect(r.slo).toContain('quem move: a máquina');
  expect(r.dup, 'KPI sem dono se declara').toContain('sem dono no banco');
  expect(r.linhaDim, 'a linha da dimensao diz a trava').toContain('trava: motor.slo_rotina_pct=92.3');
  expect(r.heroi, 'o resumo diz quantos KPIs travam').toContain('4 KPIs travam o 4');
  expect(r.cinco).toContain('nada trava');
  expect(r.vazio, 'sem dado de maturidade nao inventa trava').toBe('');
});

test('ver depois tem teto, e falha nao vira "nada em segundo plano"', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(async()=>{
    const orig=sb.from;
    const it=ref=>({origem:'tarefa',ref,nivel:3,acoes:[],titulo:'d'+ref,titulo_completo:'d'+ref,camada_tela:'depois'});
    D.fila=[]; D.exp=[]; D.cor=[]; D.min=[]; D.cap=null; D.cont={depois:2}; D.depois=[it('900')];
    const fake=res=>()=>({select:()=>({eq:()=>res()})});
    /* 1. erro do banco: mantem o anterior e declara */
    sb.from=fake(()=>Promise.resolve({data:null,error:{message:'canceling statement due to statement timeout'}}));
    const ok1=await verDepois();
    const f1={ok:ok1, mantem:D.depois.map(x=>x.ref), txt:document.getElementById('fila2').textContent,
      cards:document.querySelectorAll('#fila2 .card').length};
    /* 2. teto estourado (a mesma rejeicao que comTeto produz) */
    D.depois=[];
    sb.from=fake(()=>Promise.reject(new Error('__TETO__v_painel_fila depois')));
    const ok2=await verDepois();
    const f2={ok:ok2, txt:document.getElementById('fila2').textContent};
    /* 3. vazio de verdade: e resposta, nao falha */
    D.cont={depois:0};
    sb.from=fake(()=>Promise.resolve({data:[],error:null}));
    const ok3=await verDepois();
    const f3={ok:ok3, txt:document.getElementById('fila2').textContent};
    /* 4. dois cliques seguidos: uma requisicao so */
    let n=0; sb.from=fake(()=>{n++; return Promise.resolve({data:[it('901')],error:null});});
    await Promise.all([verDepois(),verDepois()]);
    const f4={n, refs:D.depois.map(x=>x.ref)};
    sb.from=orig;
    return {f1,f2,f3,f4};
  });
  expect(r.f1.ok).toBe(false);
  expect(r.f1.mantem, 'a falha nao apaga o que ja estava na tela').toEqual(['900']);
  expect(r.f1.cards).toBe(1);
  expect(r.f1.txt).toContain('não carregou');
  expect(r.f1.txt).toContain('tentar de novo');
  expect(r.f2.ok).toBe(false);
  expect(r.f2.txt, 'o teto se declara em segundos').toContain('sem resposta em 15s');
  expect(r.f2.txt, 'falha nao vira vazio').not.toContain('nada em segundo plano');
  expect(r.f3.ok).toBe(true);
  expect(r.f3.txt, 'vazio de verdade continua sendo dito').toContain('nada em segundo plano');
  expect(r.f3.txt).not.toContain('não carregou');
  expect(r.f4.n, 'clique repetido pega carona').toBe(1);
  expect(r.f4.refs).toEqual(['901']);
});

/* v69 · t1561 · RESULTADO PF. Tres classes de defeito que a tela nova nao pode ter:
   (a) mes sem extrato lancado lido como "resultado zero" (a pior frase de uma tela financeira);
   (b) a fonte opcional acendendo "carga incompleta" antes de a linha existir no banco, ou o
       contrario, a tela calando quando a chave nao veio;
   (c) a tela nova empurrando o celular para a rolagem horizontal.
   Os numeros abaixo sao FICTICIOS: o repo e publico e o dado PF do Igor nao entra em arquivo
   versionado. A forma e a do snapshot "pf" (uma linha com meses, classes, pj e renda). */
const PF_FIX = {mes_corrente:'2031-03',
  meses:[
    {mes:'2031-03',receita:null,despesa:null,resultado:null,saque_no_resultado:null,n_lanc:1},
    {mes:'2031-02',receita:12345.67,despesa:-23456.78,resultado:-11111.11,saque_no_resultado:-1000,n_lanc:40,
     financiamento:4200,fin_recebido:5000,fin_pago:-800,caixa_mes:-6911.11},
    {mes:'2031-01',receita:30000,despesa:-20000.4,resultado:9999.6,saque_no_resultado:null,n_lanc:30,
     financiamento:null,fin_recebido:null,fin_pago:null,caixa_mes:9999.6}],
  classes:[
    {mes:'2031-02',classe:'Classe A',gasto:9000,media3:6000,ord:1},
    {mes:'2031-02',classe:'Classe B',gasto:5000,media3:0,ord:2},
    {mes:'2031-02',classe:'Classe C',gasto:4000,media3:4100,ord:3},
    {mes:'2031-02',classe:'Classe D',gasto:2500,media3:5000,ord:4},
    {mes:'2031-02',classe:'Classe E',gasto:1200.5,media3:1000,ord:5},
    {mes:'2031-01',classe:'Classe A',gasto:7000,media3:6500,ord:1},
    {mes:'2031-01',classe:'Classe F com um nome comprido de proposito para testar a quebra de linha no celular',gasto:3000,media3:2000,ord:2}],
  pj:[{frente:'01-frente-teste',classe:'Aquisicao de ativo',contraparte:'Fornecedor X',valor:-50000,n:1,de:'2030-05-01',ate:'2030-05-01'},
      {frente:'02-frente-teste',classe:'Invest.',contraparte:'Fundo Y',valor:-1234.5,n:4,de:'2030-01-10',ate:'2030-12-20'}],
  renda:[{id:1,tema:'Oportunidade de teste',esforco:'baixo',resultado:'alto',prioridade:'P1 · faz já',frente:'11-x',status:'validado'},
         {id:2,tema:'Outra oportunidade',esforco:null,resultado:null,prioridade:'P4 · dormente',frente:null,status:'validado'}]};

test('Resultado PF: tres meses, mes sem extrato nao vira zero, top 5 contra a media e rodape recolhido', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const r = await page.evaluate(fix=>{
    const out={};
    const sub=document.querySelector('#subnav .sub[data-p="pf"]');
    out.sub={existe:!!sub, grupo:sub&&sub.dataset.g, painel:!!document.getElementById('p-pf')};
    out.opc={obrigatoria:CHAVES_PAINEL.includes('pf')};
    /* sem a chave: a tela DIZ que a fonte nao chegou */
    D.pf=null; let err=null;
    try{ render(); }catch(e){ err=String(e); }
    out.semFonte=document.getElementById('pf-meses').textContent;
    out.semFonteRod=document.getElementById('pf-rodape').innerHTML;
    /* com a chave, desenhado so por render(), sem clique */
    D.pf=JSON.parse(JSON.stringify(fix));
    try{ render(); }catch(e){ err=err||String(e); }
    out.err=err;
    const c=[...document.querySelectorAll('#pf-meses .pfc')];
    out.meses=c.map(x=>x.dataset.mes);
    out.c0=c[0].textContent; out.c1=c[1].textContent; out.c2=c[2].textContent;
    out.c1neg=c[1].classList.contains('neg'); out.c2neg=c[2].classList.contains('neg');
    out.c0vazio=c[0].classList.contains('vazio');
    out.sel=c.filter(x=>x.classList.contains('on')).map(x=>x.dataset.mes);
    out.cab=document.getElementById('pf-h-classes').textContent;
    out.nota=(document.querySelector('#pf-classes .pfnota')||{}).textContent||'';
    const g=[...document.querySelectorAll('#pf-classes .pfg')];
    out.classes=g.map(x=>x.dataset.classe);
    out.var=g.map(x=>x.querySelector('.pfgv').textContent);
    out.alta=g.map(x=>x.classList.contains('alta'));
    out.larg=g.map(x=>parseFloat(x.querySelector('.pfbar i').style.width));
    out.media=g.map(x=>{const m=x.querySelector('.pfbar .md'); return m?parseFloat(m.style.left):null;});
    const det=document.querySelector('#pf-rodape details');
    out.rod={existe:!!det, aberto:det&&det.open, txt:det&&det.textContent,
             pj:document.querySelectorAll('#pf-rodape .pfpj').length, mr:document.querySelectorAll('#pf-rodape .pfmr').length};
    /* tocar noutro mes troca o top 5; o rodape aberto continua aberto */
    det.open=true;
    document.querySelector('#pf-meses .pfc[data-mes="2031-01"]').click();
    out.troca={cab:document.getElementById('pf-h-classes').textContent,
      n:document.querySelectorAll('#pf-classes .pfg').length,
      nota:!!document.querySelector('#pf-classes .pfnota'),
      rodAberto:document.querySelector('#pf-rodape details').open};
    PFMES=null;
    /* v69b: payload antigo, sem os campos de financiamento, nao inventa linha */
    D.pf=JSON.parse(JSON.stringify(fix));
    D.pf.meses.forEach(m=>{delete m.financiamento; delete m.fin_recebido; delete m.fin_pago; delete m.caixa_mes;});
    rPF(); out.antigo=document.querySelector('#pf-meses .pfc[data-mes="2031-02"]').textContent;
    D.pf=JSON.parse(JSON.stringify(fix));
    return out;
  }, PF_FIX);
  expect(r.err, 'render() derrubou o script').toBe(null);
  expect(r.sub, 'Resultado PF e sub-aba de ACOMPANHAR com painel proprio').toEqual({existe:true, grupo:'acompanhar', painel:true});
  expect(r.opc, 'pf e chave obrigatoria desde que a fonte entrou no banco (02/10)').toEqual({obrigatoria:true});
  expect(r.semFonte, 'sem a chave a tela diz que a fonte nao chegou').toContain('Sem dado de PF nesta carga');
  expect(r.semFonteRod, 'sem a chave nao desenha rodape vazio').toBe('');
  expect(r.meses, 'o mes corrente e os dois anteriores, nesta ordem').toEqual(['2031-03','2031-02','2031-01']);
  expect(r.c0).toContain('em curso');
  expect(r.c0, 'mes sem extrato se declara').toContain('extrato ainda não lançado');
  expect(r.c0, 'mes sem extrato nao vira resultado zero').not.toContain('R$ 0');
  expect(r.c0vazio).toBe(true);
  expect(r.c1, 'entradas em R$ com separador brasileiro').toContain('R$ 12.346');
  expect(r.c1, 'saidas em valor positivo').toContain('R$ 23.457');
  expect(r.c1, 'resultado negativo com sinal').toContain('-R$ 11.111');
  expect(r.c1, 'o estado vai por escrito, nao so na cor').toContain('negativo');
  expect(r.c1, 'o saque sem destino aparece').toContain('R$ 1.000 de saque sem destino');
  expect(r.c1neg).toBe(true);
  expect(r.c2).toContain('+R$ 10.000');
  expect(r.c2).toContain('positivo');
  expect(r.c2neg).toBe(false);
  /* v69b · padrao DFC: o emprestimo nao e renda, tem linha propria, e o caixa soma as duas */
  expect(r.c1, 'resultado operacional nomeado').toContain('resultado operacional');
  expect(r.c1, 'financiamento em linha separada, com sinal').toMatch(/financiamento\s*\+R\$ 4\.200/);
  expect(r.c1, 'o que entrou e o que saiu de financiamento').toContain('empréstimo recebido +R$ 5.000');
  expect(r.c1).toContain('parcelas pagas -R$ 800');
  expect(r.c1, 'caixa do mes = operacional + financiamento').toMatch(/caixa do mês\s*-R\$ 6\.911/);
  expect(r.c2, 'mes sem emprestimo diz nenhum').toMatch(/financiamento\s*nenhum/);
  expect(r.c2).toMatch(/caixa do mês\s*\+R\$ 10\.000/);
  expect(r.antigo, 'payload sem os campos nao inventa a linha').not.toContain('financiamento');
  expect(r.antigo).toContain('-R$ 11.111');
  expect(r.sel, 'sem gasto no mes corrente o top 5 abre no mais recente que tem').toEqual(['2031-02']);
  expect(r.nota, 'e diz por escrito que pulou o mes corrente').toContain('ainda sem gasto lançado');
  expect(r.cab).toContain('FEVEREIRO');
  expect(r.classes, 'top 5 na ordem do banco').toEqual(['Classe A','Classe B','Classe C','Classe D','Classe E']);
  expect(r.var[0]).toBe('+50% acima da média de R$ 6.000');
  expect(r.var[1], 'classe sem historico e nova, nao +infinito').toContain('novo');
  expect(r.var[2]).toContain('na média');
  expect(r.var[3]).toBe('-50% abaixo da média de R$ 5.000');
  expect(r.alta, 'acima da media ou nova acende; na media e abaixo nao').toEqual([true,true,false,false,true]);
  expect(r.larg[0], 'escala unica: a maior barra ocupa a trilha').toBeCloseTo(100,0);
  expect(r.larg[3], 'e as outras seguem a razao dos valores').toBeCloseTo(27.8,0);
  expect(r.media[0], 'o traco da media na mesma escala').toBeCloseTo(66.7,0);
  expect(r.media[1], 'classe nova nao desenha traco de media').toBe(null);
  expect(r.rod.existe).toBe(true);
  expect(r.rod.aberto, 'o rodape nasce recolhido').toBe(false);
  expect(r.rod.txt).toContain('Patrimônio nas PJs (2) e matriz de renda (2)');
  expect(r.rod.txt, 'patrimonial nao e resultado, por escrito').toContain('não entra no resultado');
  expect(r.rod.txt).toContain('Fornecedor X');
  expect(r.rod.txt).toContain('-R$ 50.000');
  expect(r.rod.txt).toContain('10/01/2030 a 20/12/2030');
  expect(r.rod.txt).toContain('Oportunidade de teste');
  expect(r.rod.txt, 'campo vazio da matriz se declara').toContain('esforço não medido');
  expect(r.rod.pj).toBe(2);
  expect(r.rod.mr).toBe(2);
  expect(r.troca.cab, 'tocar no mes troca o top 5').toContain('JANEIRO');
  expect(r.troca.n).toBe(2);
  expect(r.troca.nota, 'escolha do Igor nao repete o aviso de mes pulado').toBe(false);
  expect(r.troca.rodAberto, 'redesenhar nao fecha o rodape que ele abriu').toBe(true);
});

for (const largura of [390, 1280]) {
  test(`Resultado PF cabe em ${largura}px sem rolagem horizontal, com fonte larga e rodape aberto`, async ({page})=>{
    await page.setViewportSize({width:largura, height:900});
    const erros = await abrir(page);
    await revelarCasca(page);
    await page.locator('.tab[data-g="acompanhar"]').click();
    await page.locator('#subnav .sub[data-p="pf"]').click();
    const r = await page.evaluate(fix=>{
      D.pf=JSON.parse(JSON.stringify(fix)); render();
      document.body.style.letterSpacing="1.5px";
      document.querySelector('#pf-rodape details').open=true;
      const W=document.documentElement.clientWidth;
      const pane=document.getElementById('p-pf');
      const fora=[...pane.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>W+1)
        .map(e=>e.tagName+'.'+e.className);
      const cols=new Set([...document.querySelectorAll('#pf-meses .pfc')].map(e=>Math.round(e.getBoundingClientRect().left))).size;
      return {W, SW:document.documentElement.scrollWidth, fora, visivel:pane.classList.contains('on'), cols};
    }, PF_FIX);
    expect(erros, 'erro de script').toEqual([]);
    expect(r.visivel, 'a sub-aba abre o painel').toBe(true);
    expect(r.SW, 'rolagem horizontal').toBe(r.W);
    expect(r.fora, 'elemento passando da borda').toEqual([]);
    expect(r.cols, largura<640?'no celular os meses empilham':'no computador os tres meses lado a lado').toBe(largura<640?1:3);
  });
}

/* LC-14 no bastidor (02/10/2026): o agir_nucleo passa a recusar feita de tarefa sem prova de
   8 caracteres. Sem este teste, o botao "feita" do inventario e da fila mandava valor nulo e
   o Igor so descobria a regra pela recusa do banco. */
test('feita no bastidor abre o campo da prova e prova curta nao vai ao banco', async ({page})=>{
  const erros = await abrirComArgs(page);
  const r = await page.evaluate(async()=>{
    window.__n.args=[];
    ivAgir(77,'feita','texto','feita','iv-');
    const ph=document.getElementById('mval').getAttribute('placeholder');
    document.getElementById('mval').value='ok';
    await confirmarModal();
    const curta=window.__n.args.filter(a=>a[0]==='agir').length;
    fecharModal();
    agir('tarefa','78','feita','','feita');
    const abriu=!!document.getElementById('mval');
    document.getElementById('mval').value='e-mail do fiscal 02/10';
    await confirmarModal();
    if(typeof enviarPendente==='function') await enviarPendente();
    return {ph, curta, abriu, args:window.__n.args.filter(a=>a[0]==='agir').map(a=>a[1])};
  });
  expect(r.ph).toContain('prova');
  expect(r.curta, 'prova curta nao chama agir').toBe(0);
  expect(r.abriu, 'feita da fila tambem pede prova').toBe(true);
  expect(r.args).toEqual([{p_origem:'tarefa',p_ref:'78',p_verbo:'feita',p_valor:'e-mail do fiscal 02/10'}]);
  expect(erros).toEqual([]);
});

/* s764 (02/10/2026): a secao ROTINAS le o dead-man pela porta do dono (rpc painel_cron_deadman), nao
   pela view definer; a view so e lida se a porta falhar. */
test('o dead-man das rotinas chega pela porta do dono, com a view so de reserva', async ({page})=>{
  const erros = await abrirComArgs(page);
  const r = await page.evaluate(async()=>{
    window.__n.args=[]; window.__n.from=[];
    const dm = await qDeadman();
    return {rpc:window.__n.args.filter(a=>a[0]==='painel_cron_deadman').length,
            view:window.__n.from.filter(v=>v==='v_cron_deadman').length, arr:Array.isArray(dm)};
  });
  expect(r.rpc, 'chama a porta do dono').toBe(1);
  expect(r.arr, 'devolve lista').toBe(true);
  expect(r.view, 'a view definer nao e lida quando a porta responde').toBe(0);
  expect(erros).toEqual([]);
});

/* s764 (02/10/2026): o presidente.html nunca pingou o banco porque nada no bastidor levava a ele.
   O topo do bastidor tem a porta, e o atalho instalado (manifest) abre o presidente. */
test('o bastidor leva ao presidente e o atalho instalado abre o presidente', async ({page})=>{
  await abrir(page);
  await revelarCasca(page);
  const href = await page.evaluate(()=>{const a=document.querySelector('.topin a[href="presidente.html"]');return a?a.getAttribute('href'):null;});
  expect(href).toBe('presidente.html');
  const man = JSON.parse(require('fs').readFileSync(require('path').resolve(__dirname,'..','manifest.json'),'utf8'));
  expect(man.start_url).toBe('./presidente.html');
});

/* v71 · R7 (03/10/2026): SEGURANCA DA PAGINA. Tres classes de defeito:
   (a) texto do banco virando MARCACAO: o painel monta HTML por template e insere com innerHTML, e um
       campo do snapshot entrando cru executaria script na sessao do dono, que guarda o token do
       Supabase. Pior que innerHTML cru e o escape ERRADO: esc() dentro de onclick="f('...')" devolve
       a aspa como &#39;, que o navegador decodifica antes de rodar o JS. O teste cobra os dois
       contextos: texto no HTML e texto dentro de argumento JS, com o clique devolvendo o literal;
   (b) supabase-js flutuante (@2) sem integrity: qualquer publicacao nova ou CDN comprometida rodaria
       com o token do dono. Versao fixa, sha384 e a mesma tag nas duas paginas;
   (c) CSP declarada e a pagina inteira funcionando debaixo dela, sem violacao. */
const XSS_TAG = '<img src=x onerror="window.__xss=1">';
const XSS_ASPA = "x');window.__xss=2;//";
const XSS_ENT = "y&#39;);window.__xss=3;//";
const DUBLE_XSS = DUBLE_ARGS.replace("ks.forEach(k=>{d[k]=[];});", `ks.forEach(k=>{d[k]=[];});
  d.fila=[{origem:"tarefa",ref:"77",nivel:1,titulo:${JSON.stringify(XSS_TAG)},titulo_completo:${JSON.stringify(XSS_TAG)},
    frente:${JSON.stringify(XSS_ASPA)},valor_txt:${JSON.stringify(XSS_TAG)},recomendacao:${JSON.stringify(XSS_TAG)},
    dias_parado:${JSON.stringify(XSS_TAG)},acoes:[{verbo:"arquivar",campo:"texto",label:${JSON.stringify(XSS_ASPA)}}]}];
  d.op=[{origem:"tarefa",ref:"77",opcoes:[{label:${JSON.stringify(XSS_ENT)},recomendada:true,consequencia:${JSON.stringify(XSS_TAG)}}]}];
  d.cont=[{depois:${JSON.stringify(XSS_TAG)},leituras:0}];`);
const VIGIA_CSP = ()=>{ window.__csp=[]; document.addEventListener('securitypolicyviolation',
  e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI)); };

test('texto hostil do banco aparece como texto e nao executa, nem dentro de onclick', async ({page})=>{
  const erros=[]; page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(VIGIA_CSP);
  await dublar(page, DUBLE_XSS);
  await page.goto(PAGINA);
  await page.waitForFunction(()=>document.getElementById('selo-ver').textContent.trim()!=='—');
  await revelarCasca(page);
  await page.evaluate(()=>carregar());
  await page.waitForTimeout(300);
  const r = await page.evaluate(async()=>{
    const out={};
    const card=document.querySelector('#fila1 .card');
    out.titulo=card&&card.querySelector('.ttl').textContent;
    out.heroi=document.getElementById('hero').textContent;
    out.imgs=document.querySelectorAll('img[onerror]').length;
    /* argumento JS dentro de atributo: o menu de acao, o chip de frente e o botao de opcao */
    card.querySelector('.menu button').click();
    out.modal=document.getElementById('mtit').textContent; fecharModal();
    gavetaFiltros(true);
    const chip=[...document.querySelectorAll('#chipsFrente .chip')].find(c=>c.textContent.includes('window.__xss'));
    chip.click(); out.frente=F.frente; limparFiltros();
    window.__n.args=[];
    document.querySelector('#fila1 .card .opb').click();
    await enviarPendente();
    out.escolha=(window.__n.args.find(a=>a[0]==='escolher')||[])[1];
    await new Promise(r=>setTimeout(r,200));
    out.xss=window.__xss; out.csp=window.__csp;
    return out;
  });
  expect(erros, 'erro de script (onclick quebrado tambem conta)').toEqual([]);
  expect(r.titulo, 'o titulo hostil aparece como texto').toBe(XSS_TAG);
  expect(r.heroi, 'contador do snapshot tambem e texto').toContain(XSS_TAG);
  expect(r.imgs, 'nenhum elemento nasceu do texto do banco').toBe(0);
  expect(r.modal, 'o rotulo chega literal ao modal').toBe(XSS_ASPA);
  expect(r.frente, 'a frente chega literal ao filtro').toBe(XSS_ASPA);
  expect(r.escolha, 'a opcao chega literal ao banco').toEqual({p_ref:'77',p_opcao:XSS_ENT});
  expect(r.xss, 'nenhum handler injetado rodou').toBeUndefined();
  expect(r.csp, 'nenhuma violacao de CSP desenhando a fila').toEqual([]);
});

test('o supabase-js vem de versao fixa, com integrity, e a mesma tag nas duas paginas', async ({page})=>{
  const fs=require('fs');
  const ler=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
  const externos=s=>s.match(/<script[^>]*\bsrc="https?:[^"]*"[^>]*>/g)||[];
  const [idx,pres]=[ler('index.html'),ler('presidente.html')];
  const a=externos(idx), b=externos(pres);
  expect(a.length, 'um script externo no painel').toBe(1);
  expect(b, 'o presidente carrega exatamente a mesma tag').toEqual(a);
  expect(a[0], 'versao exata, nunca @2 flutuante').toMatch(/@supabase\/supabase-js@\d+\.\d+\.\d+\/dist\/umd\/supabase\.js"/);
  expect(a[0]).toMatch(/integrity="sha384-[A-Za-z0-9+/]{64}"/);
  expect(a[0]).toContain('crossorigin="anonymous"');
  for(const s of [idx,pres]) expect(s, 'CSP declarada').toMatch(/<meta http-equiv="Content-Security-Policy"/);
  await abrir(page);
  const dom = await page.evaluate(()=>{const s=document.querySelector('script[src*="cdn.jsdelivr.net"]');
    return {integ:s&&s.integrity, co:s&&s.crossOrigin};});
  expect(dom.integ, 'o atributo chega ao DOM').toMatch(/^sha384-/);
  expect(dom.co).toBe('anonymous');
});

test('a CDN que devolve outro arquivo no lugar do supabase-js e recusada pelo navegador', async ({page})=>{
  const avisos=[]; page.on('console',m=>avisos.push(m.text()));
  /* com CORS liberado, o UNICO motivo para recusar e o hash */
  await page.route('**cdn.jsdelivr.net**', r=>r.fulfill({status:200,contentType:'application/javascript',
    headers:{'access-control-allow-origin':'*'}, body:'window.__trocado=1;'+DUBLE}));
  await page.goto(PAGINA);
  await page.waitForFunction(()=>document.getElementById('selo-ver').textContent.trim()!=='—');
  await page.waitForTimeout(200);
  const r = await page.evaluate(()=>({trocado:window.__trocado, sb:typeof window.supabase}));
  expect(r.trocado, 'o arquivo trocado nao rodou').toBeUndefined();
  expect(r.sb).toBe('undefined');
  expect(avisos.join('\n'), 'o navegador diz que foi o integrity').toMatch(/integrity/i);
});

test('debaixo da CSP a tela de login abre sem nenhuma violacao', async ({page})=>{
  const erros=[]; page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(VIGIA_CSP);
  await dublar(page, DUBLE.replace('getSession:()=>new Promise(()=>{})','getSession:()=>Promise.resolve({data:{session:null}})'));
  await page.goto(PAGINA);
  await page.waitForFunction(()=>!document.getElementById('login').classList.contains('hidden'));
  await page.waitForTimeout(300);
  const r = await page.evaluate(()=>({csp:window.__csp, vis:getComputedStyle(document.getElementById('login')).display!=='none'}));
  expect(erros).toEqual([]);
  expect(r.vis, 'login visivel').toBe(true);
  expect(r.csp, 'violacao de CSP na abertura').toEqual([]);
});
