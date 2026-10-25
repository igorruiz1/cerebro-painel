/* SMOKE TEST DO FRONT STAGE DO PRESIDENTE · p2 (02/10/2026)
   O teste de uso do v69 no celular mediu 39 de 42 controles abaixo de 44 px e 5 de 7 abas
   escondidas atras de um grupo. O p1 corrigiu isso e mesmo assim o Igor marcou quatro dores
   (nao sei o que fazer, agir custa toque, linguagem de maquina, Frentes e Caixa sao becos).
   A suite cobra as medidas do p1 e o que o p2 promete, sem credencial e sem Supabase:
     1. todo destino da barra abre um painel que existe, e todo painel tem destino;
     2. nenhum controle tocavel abaixo de 44 px e nenhuma rolagem horizontal a 360, 390 e 1280 px,
        com o detalhe do card aberto tambem;
     3. verbo do banco nunca aparece cru na tela;
     4. concluir sem prova escrita nao chama o banco (LC-14);
     5. frente e linha do caixa abrem algo, nunca sao beco;
     6. instrucao por voz (p3) so chega a inbox() depois de revisada e enviada, e a API do aparelho
        recebe o audio e devolve texto para revisar, sem nada dela no fonte;
     7. resposta por evento (p4): o recibo diz o que o banco mediu do despertador, a resposta chega pelo
        Realtime sem recarregar, e o fio do card para em 3 trocas em 7 dias;
     8. aba Mesa (p4.4): estoque, relatorios por link assinado e baixa de envio que sem canal nao grava;
        p4.5: a folha abre a copia da peca e delibera (aprovar, pedir ajuste, largar), nota vazia nao grava.
   O cliente e dublado como no fumaca.spec.js: o defeito que se persegue vive na TELA. */
const {test, expect} = require('@playwright/test');
const path = require('path');
const PAGINA = 'file://' + path.resolve(__dirname, '..', 'presidente.html');

/* Duble com sessao valida e dado minimo: dois cards na fila de hoje, quatro no inventario
   (um por coluna), duas frentes na arvore, 13 semanas e um recebivel vencido. Nada aqui e real.
   window.__rpc guarda toda chamada ao banco para o teste conferir o que foi (ou nao) gravado. */
/* t1745: segundo fator dublado, usado aqui e no index (porta comum:fator) */
const MFA_DUBLE = `mfa:{getAuthenticatorAssuranceLevel:()=>{(window.__mfa=window.__mfa||[]).push({op:'aal'});if(window.__mfaErro==='aal')return Promise.resolve({data:null,error:{message:'falha de teste'}});const v=(window.__fatores||[]).some(f=>f.status==='verified');return Promise.resolve({data:{currentLevel:window.__aal||'aal1',nextLevel:v?'aal2':(window.__aal||'aal1')},error:null});},listFactors:()=>{(window.__mfa=window.__mfa||[]).push({op:'listFactors'});const all=window.__fatores||[];return Promise.resolve({data:{all,totp:all.filter(f=>f.status==='verified'),phone:[]},error:null});},challenge:a=>{(window.__mfa=window.__mfa||[]).push({op:'challenge',a});return Promise.resolve({data:{id:'desafio-1'},error:null});},verify:a=>{(window.__mfa=window.__mfa||[]).push({op:'verify',a});if(a.code!==(window.__codigoBom||'123456'))return Promise.resolve({data:null,error:{message:'Invalid TOTP code entered',code:'mfa_verification_failed'}});window.__aal='aal2';return Promise.resolve({data:{access_token:'x'},error:null});}}`;
const DUBLE = `(()=>{
  const hoje=new Date().toISOString().slice(0,10);
  const ac=[{label:'feita',verbo:'feita'},{label:'nova data',verbo:'repactuar',campo:'date'},{label:'deliberar',verbo:'deliberar',campo:'text'}];
  const fila=[{origem:'tarefa',ref:'2',camada_tela:'hoje',posicao:1,teto_tela:5,frente:'11-renda-alt',
    titulo:'Card de exemplo',titulo_completo:'Card de exemplo',porque_agora:'vence em 1d',verbo_sugerido:'feita',
    recomendacao:'Recomendacao de exemplo, longa o bastante para ser cortada no foco e inteira no detalhe do card, com texto suficiente para passar de cento e oitenta caracteres sem esforco algum, so repetindo.',
    artefato_path:'/pasta/peca_v01.pdf',acoes:ac},
    {origem:'tarefa',ref:'5',camada_tela:'hoje',posicao:2,teto_tela:5,frente:'20-contrato-pj',titulo:'Segundo card',porque_agora:'vence em 2d',valor_txt:'R$ 3 mil',acoes:ac}];
  const sem=Array.from({length:13},(_,i)=>({semana:i+1,inicio:hoje,saldo_base:(i-4)*1000,saldo_pior:(i-6)*1000,sai_firme:500}));
  const dados={fila,exp:[],cont:[{depois:2}],rw:[{dias_sobrevida_pior:16,entrada_provavel_30d:1000,saida_firme_30d:500}],
    se:[{chave:'fila.aging_p95_dias',serie:[30]}],cap:[{minutos_dia:120}],min:[{id:2,minutos_estimados:25}],
    c13:sem,c13i:[{id:31,natureza:'receber',vencido:true,valor_igor:1400,descricao:'Laudo L1',data_venc:hoje,frente_slug:'11-renda-alt'}],
    /* p4.27: sem leitura de 7 dias atras por padrao; o teste do plano 89 troca por window.__dados */
    var7:[],
    /* p4.31: grupo Cobrar vazio por padrao; o teste do grupo troca por window.__dados */
    cob3:[],
    /* p4.32: fatia de sessoes da frente do sistema; vazia por padrao, o teste do plano 113 troca */
    est:[],
    /* p4.33: ritmo de 7 dias; vazio por padrao, o teste do plano 114 troca */
    rit:[],
    /* p4.35: sem pergunta da vespera aberta por padrao; o teste do plano 68 troca */
    vesp:[],
    /* p126: fila unica do banco presente e sem resumo por padrao (montagem antiga); o teste do p126 troca */
    hoje:[], hoje_resumo:[],
    /* p4.42 (p127): bandeja vazia por padrao; os testes do p127 trocam D.band */
    band:[],
    /* p4.47 (p158): sem sugestao esperando aceite por padrao; o teste do p158 troca por window.__dados */
    sug:[],
    /* p4.48 (p167 e5): plano mestre vazio por padrao; o teste do plano troca por window.__dados */
    plm:[],
    /* p4.55 (p109): funil vazio por padrao; o teste do p109 troca por window.__dados */
    funil:[],
    /* p4.58 (p144): semana vazia por padrao; o teste do p144 troca por window.__dados */
    semana:[],
    /* p4.76 (P4, s8322): saude do sistema vazia por padrao; o teste p4.76 troca por window.__dados (amostra real da v_saude_painel) */
    saude:[],
    /* p4.81 (t5105): orcamento das rotinas e pecas x teto vazios por padrao; o teste p4.81 troca por window.__dados */
    orc:[], gov:[],
    /* p4.61 (p155): sem aviso da rotina por padrao; o teste do p155 troca por window.__dados */
    aviso:[],
    /* p4.66 (onda 2): chaves novas vazias por padrao (pg vazio = vale o numero do codigo); os testes da onda 2 trocam por window.__dados */
    pg:[], cxe:[], rwe:[], uni:[], ficha:[], quest:[], bloq:[], trava:[],
    /* p4.69 (onda 4): chaves vazias por padrao; os testes dos pi 184 a 187 trocam por window.__dados */
    l10:[], prio:[], dre:[], vida:[],
    /* p4.68 (pi 183): prestacao do executor, valores ficticios; o teste do 183 troca por window.__dados ou window.__sem */
    exec:[{abertos:12,vencidos:1,esperando:2,feitos_7d:34,rotinas:20,rotinas_no_slo:18,estouradas:['rotina-exemplo'],ultimos:[{id:9001,frente:'11-renda-alt',titulo:'Conferir extrato do mês',em:'2026-10-16T21:17:56-04:00'},{id:9002,frente:'20-contrato-pj',titulo:'Revisar a lista de pendências',em:'2026-10-15T10:00:00-04:00'}]}],
    /* p4.3: saude em dia por padrao; cada teste de saude troca o que precisa por window.__dados */
    fresc:[{estado:'FRESCO',no_ponto:2,rotinas_total:2}],
    mo:[{nome:'backup-cerebro',estado:'no ponto',janela_horas:26,ultimo_ponto:new Date(Date.now()-3*36e5).toISOString()},{nome:'painel-snapshot',estado:'no ponto'}],
    eb:[{nome:'backup-cerebro',falhas_7d:0,orcamento_falhas_7d:1,veredito_budget:'DENTRO DO ORCAMENTO'}]};
  const inv=[{id:2,frente:'11-renda-alt',dono:'igor',status:'pendente',prazo:hoje,parado_dias:1,titulo:'Card de exemplo',criterio_pronto:'Fiscal confirma por e-mail',acoes:[{verbo:'feita',rotulo:'feita',arg:null}]},
    {id:3,frente:'20-contrato-pj',dono:'igor',status:'aguardando_terceiro',prazo:hoje,parado_dias:0,titulo:'Item esperando',acoes:[{verbo:'repactuar',rotulo:'repactuar',arg:'data'}]},
    {id:4,frente:'04-obra-residencial',dono:'igor',status:'pendente',prazo:null,parado_dias:40,titulo:'Item para decidir',acoes:[{verbo:'repactuar',rotulo:'repactuar',arg:'data'},{verbo:'arquivar',rotulo:'arquivar',arg:'texto'}]},
    {id:6,frente:'20-contrato-pj',dono:'igor',status:'pendente',prazo:'2999-01-01',parado_dias:0,titulo:'Item depois',acoes:[]},
    {id:7,frente:'20-contrato-pj',dono:'claude',status:'pendente',prazo:hoje,parado_dias:0,titulo:'Item do executor',acoes:[]}];
  const arv=[{nivel:0,no:'CAIXA'},{nivel:1,no:'11-renda-alt',rotulo:'Renda Alternativa',margem_30d:2000,margem_total:2000},
    {nivel:1,no:'20-contrato-pj',rotulo:'Contrato PJ',margem_30d:1000,margem_total:3000}];
  /* p4.4: retorno de mesa_painel com tres pecas (uma nova), uma saida, dois relatorios e a regua da hora.
     window.__mesa troca o retorno inteiro; window.__baixa troca a resposta de mesa_baixa_painel.
     p4.5: duas pecas com copia no bucket (peca), a terceira sem; window.__deliberar troca a resposta de mesa_deliberar. */
  const mesa={hoje,em_jogo:15400,horas_mes:42.5,
    estoque:[{id:101,frente:'20-contrato-pj',titulo:'Medicao 7 de exemplo',ato:'aprovar',dest:'Fiscal de exemplo',canal:'whatsapp',rs:12000,dias:9,motivo:'Falta a sua aprovacao para protocolar.',copia:null,novo:false,peca:'pecas/101/medicao-7_exemplo_v01.pdf'},
      {id:102,frente:'11-renda-alt',titulo:'Laudo de exemplo',ato:'enviar',dest:'Cliente de exemplo',canal:'gmail',rs:3400,dias:2,motivo:'Pronto, falta sair.',copia:null,novo:true,peca:'pecas/102/laudo_exemplo_v02.pdf'},
      {id:103,frente:null,titulo:'Contrato de exemplo',ato:'assinar',dest:null,canal:null,rs:null,dias:0,motivo:null,copia:null,novo:false,peca:null}],
    producao_hoje:{A_AGIR:3,B_FEITO:1,C_SISTEMA:2,D_DEMAIS:0,FORA:0},
    saiu_hoje:[{id:90,titulo:'Oficio de exemplo',dest:'Fiscal de exemplo',prova:'documental'}],
    valor_hora:{recebido:5000,horas:42.5,por_hora:117.65,piso:63.03,teto:480},
    relatorios:[{tipo:'dia',alvo:hoje,versao:'02',titulo:'Fechamento do dia de exemplo v02',path:'dia/fechamento_v02.pdf'},
      {tipo:'estoque',alvo:hoje,versao:'01',titulo:'Estoque parado de exemplo v01',path:'estoque/estoque_v01.pdf'}]};
  window.__rpc=[]; window.__storage=[];
  /* window.__pendura: nomes de RPC ou view que nunca respondem. window.__dados: chaves que trocam as do duble.
     window.__sem: chaves que a carga omite, como um snapshot antigo (p4.31). */
  const pendura=n=>(window.__pendura||[]).includes(n);
  const q=(r,v)=>{const p=pendura(v)?new Promise(()=>{}):Promise.resolve({data:r,error:null});p.lte=()=>p;p.eq=()=>p;p.order=()=>p;p.limit=()=>p;return p;};
  window.supabase={createClient:()=>({
    from:v=>({select:()=>q(v==='v_inventario_frente'?inv:v==='v_arvore_caixa'?arv:(window.__tab&&window.__tab[v])||[],v)}),
    rpc:(n,a)=>{window.__rpc.push({n,a});if(pendura(n))return new Promise(()=>{});
      return Promise.resolve({data:n==='painel_carga'?{dados:(()=>{const d={...dados,...(window.__dados||{})};(window.__sem||[]).forEach(k=>delete d[k]);return d;})(),idade_s:10,gerado_em:new Date().toISOString()}:n==='agir'?'OK: feito':n==='inbox'?'ANOTADO. Entra na proxima rodada.':n==='atendente_estado'?(window.__atd||null):n==='mesa_painel'?(window.__mesa||mesa):n==='mesa_baixa_painel'?(window.__baixa||'OK: baixa gravada (envio 7)'):n==='mesa_deliberar'?(window.__deliberar||'OK: aprovado'):n==='mesa_ciencia'?(window.__ciencia||'OK: ciencia do dia gravada'):n==='painel_nova_tarefa'?(window.__nova||'CRIADO: t99 em 11-renda-alt, prazo 10/10'):n==='painel_esconder'?(window.__esconder||'OK: escondido ate 15/10; o prazo 14/10 segue valendo'):n==='painel_desfazer'?(window.__desfazerR||'OK: desfeito feita em tarefa#2 (status)'):n==='painel_atos_recentes'?(window.__atos||[]):n==='painel_card_historico'?(window.__chist||[]):n==='agir_pendencia'?(window.__pendR||'OK: gravado'):n==='envio_anexar_prova'?(window.__anexarR||'OK envio '+(a&&a.p_envio)+': prova anexada'):n==='painel_checkin'?(window.__checkin!==undefined?window.__checkin:'Check-in Exemplo · seg 13/10\\n1. Fiz: Enviar a ata de exemplo\\n2. Vou fazer: Revisar a proposta de exemplo (14/10)\\n3. Travado / preciso de você: —'):null,error:null});},
    channel:()=>{const ch={on:(t,f,cb)=>{(window.__rt=window.__rt||[]).push({f,cb});return ch;},subscribe:cb=>{cb&&cb('SUBSCRIBED');return ch;}};return ch;},
    /* p4.4: storage dublado; window.__storage guarda cada chamada, window.__storageErro faz o link falhar */
    storage:{from:b=>({
      createSignedUrl:(p,s)=>{window.__storage.push({b,op:'createSignedUrl',p,s});
        return Promise.resolve(window.__storageErro?{data:null,error:{message:'objeto nao encontrado'}}:{data:{signedUrl:typeof window.__storageUrl==='function'?window.__storageUrl(p):(window.__storageUrl||'about:blank')},error:null});},
      upload:(p,f)=>{window.__storage.push({b,op:'upload',p,tipo:f&&f.type});return Promise.resolve({data:{path:p},error:null});}})},
    auth:{getSession:()=>Promise.resolve({data:{session:{user:{id:'x'}}}}),
          onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
          signInWithOtp:()=>Promise.resolve({error:null}),
          /* t1745: segundo fator dublado; padrao sem fator (a porta abre direto). window.__fatores, __aal,
             __codigoBom e __mfaErro trocam o cenario; window.__mfa guarda cada chamada */
          ${MFA_DUBLE}}})};
})();`;

/* v71 · R7: o supabase-js tem integrity (SRI); corpo dublado no lugar do arquivo seria recusado pelo
   navegador. O duble entra antes da pagina (addInitScript) e a CDN e abortada, como no fumaca.spec.js. */
const {contrasteDos} = require('./_contraste');
async function abrir(page){
  const erros=[];
  page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(DUBLE);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA);
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit') && !!document.querySelector('#kanban .item'));
  return erros;
}

test('todo destino abre um painel que existe, e todo painel tem destino', async ({page})=>{
  await abrir(page);
  const r = await page.evaluate(()=>{
    const destinos=[...new Set([...document.querySelectorAll('[data-aba]')].map(b=>b.dataset.aba))];
    const paineis=[...document.querySelectorAll('.pane')].map(p=>p.id.replace(/^p-/,''));
    return {semPainel:destinos.filter(d=>!paineis.includes(d)), semDestino:paineis.filter(p=>!destinos.includes(p)), n:destinos.length};
  });
  expect(r.semPainel,'destino sem painel').toEqual([]);
  expect(r.semDestino,'painel sem destino').toEqual([]);
  expect(r.n,'seis destinos planos (p4.58: a Semana entrou)').toBe(6);
});

for (const largura of [360, 390, 1280]) {
  test(`a ${largura}px: nenhum controle abaixo de 44 px e nenhuma rolagem horizontal`, async ({page})=>{
    await page.setViewportSize({width:largura, height:820});
    const erros = await abrir(page);
    for (const aba of ['hoje','fila','caixa','frentes','mesa','semana']) {
      await page.evaluate(a=>ir(a), aba);
      const m = await page.evaluate(()=>{
        const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';};
        const pequenos=[...document.querySelectorAll('button,input,textarea,summary,a[href]:not(.rodape a)')].filter(vis)
          .filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44;})
          .map(e=>(e.getAttribute('aria-label')||e.textContent||e.id).trim().slice(0,30));
        return {pequenos, W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};
      });
      expect(m.pequenos, `controles pequenos em ${aba}`).toEqual([]);
      expect(m.SW, `rolagem horizontal em ${aba}`).toBe(m.W);
    }
    await page.evaluate(()=>abrirFila(0));
    const f = await page.evaluate(()=>{
      const r=[...document.querySelectorAll('#folha button')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.height<44||b.width<44);}).map(e=>e.textContent.trim());
      return {r, W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};
    });
    expect(f.r, 'controles pequenos no detalhe do card').toEqual([]);
    expect(f.SW, 'rolagem horizontal com o detalhe aberto').toBe(f.W);
    await page.evaluate(()=>{fecharFolha();abrirVoz();document.querySelector('#folha details').open=true;});
    const v = await page.evaluate(()=>{
      const r=[...document.querySelectorAll('#folha button,#folha input,#folha textarea,#folha summary')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.height<44||b.width<44);}).map(e=>(e.getAttribute('aria-label')||e.textContent||e.id).trim());
      return {r, W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};
    });
    expect(v.r, 'controles pequenos na tela de voz').toEqual([]);
    expect(v.SW, 'rolagem horizontal com a tela de voz aberta').toBe(v.W);
    /* p4.4: folha da peca da Mesa aberta, com canal escolhido */
    await page.evaluate(()=>{fecharFolha();ir('mesa');});
    await page.waitForSelector('#ms-raiz .ms-item');
    await page.evaluate(()=>{msAbrirId(102);msEscolherCanal('email_corporativo');});
    const ms = await page.evaluate(()=>{
      const r=[...document.querySelectorAll('#folha button,#folha input,#folha textarea')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.height<44||b.width<44);}).map(e=>(e.getAttribute('aria-label')||e.textContent||e.id).trim());
      return {r, n:document.querySelectorAll('#folha .ms-canal').length, W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};
    });
    expect(ms.n, 'a folha da peca tem os seis canais').toBe(6);
    expect(ms.r, 'controles pequenos na folha da peca').toEqual([]);
    expect(ms.SW, 'rolagem horizontal com a folha da peca aberta').toBe(ms.W);
    /* p4.5: o bloco "Sua decisao" com cada campo de nota aberto */
    for (const dec of ['ajustar','adiar','largar']) {
      await page.evaluate(d=>msMotivo(d), dec);
      const dc = await page.evaluate(()=>{
        const vis=e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0;};
        const r=[...document.querySelectorAll('#folha button,#folha input,#folha textarea')].filter(vis).filter(e=>{const b=e.getBoundingClientRect();return b.height<44||b.width<44;}).map(e=>(e.getAttribute('aria-label')||e.textContent||e.id).trim());
        return {r, peca:vis(document.getElementById('msPeca')), dec:[...document.querySelectorAll('#folha .ms-decide button')].filter(vis).length,
          nota:[...document.querySelectorAll('#folha .ms-decide textarea, #folha .ms-decide input[type=date]')].filter(vis).length, W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};
      });
      expect(dc.peca, 'botao da peca na folha').toBe(true);
      expect(dc.dec, `p4.53: envio tem tres decisoes ao lado do Enviei por, mais o botao do campo (${dec})`).toBe(4);
      expect(dc.nota, `um campo de nota aberto (${dec})`).toBe(1);
      expect(dc.r, `controles pequenos com o campo de ${dec} aberto`).toEqual([]);
      expect(dc.SW, `rolagem horizontal com o campo de ${dec} aberto`).toBe(dc.W);
    }
    expect(erros,'erros de script').toEqual([]);
  });
}

test('login por codigo nunca cria usuario novo', async ({page})=>{
  const fonte = require('fs').readFileSync(path.resolve(__dirname,'..','presidente.html'),'utf8');
  const chamadas = fonte.match(/signInWithOtp\([^)]*\)/g) || [];
  expect(chamadas.length,'ha login por codigo').toBeGreaterThan(0);
  for (const c of chamadas) expect(c,'shouldCreateUser:false em toda chamada').toContain('shouldCreateUser:false');
});

test('verbo do banco nunca aparece cru: feita, repactuar, deliberar e arquivar viram verbo de gente', async ({page})=>{
  await abrir(page);
  await page.evaluate(()=>abrirFila(0));
  const botoes = await page.$$eval('#foco button, #folha button', bs=>bs.map(b=>b.textContent.trim().toLowerCase()));
  for (const cru of ['feita','repactuar','deliberar','arquivar']) expect(botoes, 'verbo cru '+cru).not.toContain(cru);
  expect(botoes).toContain('concluir');
  expect(botoes).toContain('mudar data');
  expect(botoes).toContain('pedir análise');
  expect(botoes).toContain('dar minha posição');
});

test('concluir sem prova escrita nao chama o banco; com prova, grava depois do prazo de desfazer', async ({page})=>{
  await abrir(page);
  await page.click('#foco .pri');
  await expect(page.locator('#cv')).toBeVisible();
  await page.fill('#cv','ok');
  await page.click('#campo .pri');
  await page.waitForTimeout(200);
  let agir = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir'));
  expect(agir, 'prova curta nao pode gravar').toEqual([]);
  await page.fill('#cv','e-mail do fiscal 08/10');
  await page.click('#campo .pri');
  await page.evaluate(()=>enviar());
  agir = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').map(c=>c.a));
  expect(agir).toEqual([{p_origem:'tarefa',p_ref:'2',p_verbo:'feita',p_valor:'e-mail do fiscal 08/10'}]);
});

test('desfazer dentro dos 8 s nao grava nada', async ({page})=>{
  await abrir(page);
  await page.evaluate(()=>{abrirFila(0);escolher('repactuar');});
  await page.click('#campo .datas button >> nth=0');
  await page.click('#tbtn');
  await page.waitForTimeout(100);
  const agir = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir'));
  expect(agir).toEqual([]);
});

test('frente abre a propria pagina com os cards do Igor; caixa desenha 13 semanas e o recebivel vencido', async ({page})=>{
  await abrir(page);
  await page.evaluate(()=>ir('frentes'));
  await page.click('#frentesLista .frente >> nth=1');
  const fr = await page.$$eval('#folha .item .t', e=>e.map(x=>x.textContent));
  expect(fr).toEqual(['Item esperando','Item depois']);
  await page.evaluate(()=>{fecharFolha();ir('caixa');});
  expect(await page.locator('#semanas rect.sem').count()).toBe(13);
  await expect(page.locator('#cobrarBox')).toContainText('Laudo L1');
  await page.click('#alavancas .linha-r >> nth=0');
  await expect(page.locator('#folhaTit')).toHaveText('Card de exemplo');
});

test('as quatro colunas da fila separam os cards do Igor e deixam o executor fora', async ({page})=>{
  await page.addInitScript(()=>{ window.__sem=['exec']; });
  await abrir(page);
  const n = await page.evaluate(()=>Object.fromEntries(['semana','esperando','decidir','depois'].map(c=>[c,contar(c)])));
  expect(n).toEqual({semana:1,esperando:1,decidir:1,depois:1});
  await expect(page.locator('#filaRodape')).toContainText('1 card do executor');
});

/* Print real de 02/10/2026 22:45: o foco mostrava "[atendente-1 16/09 04h] Prematuro..." como se fosse
   atual, a frase dizia "5,6 h das suas 2 h" sem alerta e a frente vinha "11 Renda Alternativa PF". */
test('nota velha nao vai para o foco, carimbo vira rotulo, capacidade estourada alerta e frente sem numero', async ({page})=>{
  await abrir(page);
  const r = await page.evaluate(()=>{
    const f=D.fila[0];
    f.recomendacao='[atendente-1 16/09 04h] Prematuro: setembro ainda nao fechou.';
    D.min=[{id:2,minutos_estimados:300}];
    ARV.find(a=>a.no==='11-renda-alt').rotulo='11 Renda Alternativa PF';
    render();
    const foco=document.getElementById('foco').textContent, sit=document.getElementById('situacao');
    abrirFila(0);
    const det=document.getElementById('folha').textContent;
    return {foco, sit:sit.textContent, alerta:!!sit.querySelector('.w'), det};
  });
  expect(r.foco, 'nota de 16/09 fora do foco').not.toContain('Prematuro');
  expect(r.foco, 'frente sem o numero do slug').toContain('Renda Alternativa PF');
  expect(r.foco).not.toContain('11 Renda');
  expect(r.sit, 'capacidade estourada diz quanto passa').toContain('Passa');
  expect(r.alerta).toBe(true);
  expect(r.det, 'no detalhe a nota aparece marcada como antiga').toContain('pode estar vencida');
  expect(r.det, 'carimbo da maquina nao aparece cru').not.toContain('[atendente-1');
});

/* p3: instrucao por voz. O reconhecimento do navegador e o gravador sao dublados: o que se cobra e que
   nada vai ao banco sem revisar e enviar (decisao do Igor 02/10/2026), que desfazer devolve o texto, e
   que a API do aparelho recebe o audio e o texto volta para a caixa de revisao. */
/* Dublado como o Safari do iPhone se comportou no print de 02/10/2026 23h16: cada frase e um resultado
   novo sem espaco no comeco, a lista acumula a sessao inteira e o fim da sessao chega depois do abort. */
const SR_DUBLE = ()=>{
  window.__srs=[];
  window.webkitSpeechRecognition = class {
    constructor(){ window.__sr=this; window.__srs.push(this); this.res=[]; }
    start(){ this.ligado=true; }
    stop(){ this.ligado=false; setTimeout(()=>this.onend&&this.onend(),0); }
    abort(){ this.stop(); }
    falar(t,final){
      const r=Object.assign([{transcript:t}],{isFinal:final}), u=this.res[this.res.length-1];
      if(u&&!u.isFinal)this.res[this.res.length-1]=r; else this.res.push(r);
      this.onresult&&this.onresult({resultIndex:0,results:this.res});
    }
  };
  window.SpeechRecognition = window.webkitSpeechRecognition;
};

test('voz pelo navegador: o texto aparece para revisar, so Enviar grava na inbox, e desfazer devolve o texto', async ({page})=>{
  await page.addInitScript(SR_DUBLE);
  await abrir(page);
  await page.click('#micTopo');
  await expect(page.locator('#folhaTit')).toHaveText('Falar uma instrução');
  await expect(page.locator('#vozMotor')).toContainText('grátis do navegador');
  await page.click('#vozMic');
  await expect(page.locator('#vozMic')).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>window.__sr.falar('reagendar a vistoria para quinta',false));
  await expect(page.locator('#vozTxt')).toHaveValue('reagendar a vistoria para quinta');
  await page.click('#vozMic');
  await expect(page.locator('#vozMic')).toHaveAttribute('aria-pressed','false');
  let inbox = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='inbox'));
  expect(inbox, 'falar nao grava nada sozinho').toEqual([]);
  await page.fill('#vozTxt','reagendar a vistoria da obra para quinta');
  await page.click('#folha .pri');
  await page.click('#tbtn');
  await expect(page.locator('#vozTxt'), 'desfazer devolve o texto para corrigir').toHaveValue('reagendar a vistoria da obra para quinta');
  inbox = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='inbox'));
  expect(inbox, 'desfazer nao grava').toEqual([]);
  await page.click('#folha .pri');
  await page.evaluate(()=>enviar());
  inbox = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='inbox').map(c=>c.a));
  expect(inbox).toEqual([{p_texto:'[voz] reagendar a vistoria da obra para quinta'}]);
});

/* Print do Igor, 02/10/2026 23h16: limpar com o microfone aberto e falar de novo trazia de volta o texto
   apagado, e as frases vinham coladas ("IgorQual", "amanhãQual"). */
test('voz: limpar com o microfone aberto nao devolve o apagado, e frases do Safari saem separadas', async ({page})=>{
  await page.addInitScript(SR_DUBLE);
  await abrir(page);
  await page.click('#micTopo');
  await page.click('#vozMic');
  await page.evaluate(()=>{ window.__sr.falar('Meu nome é Igor',true); window.__sr.falar('Qual a programação de amanhã',true); });
  await expect(page.locator('#vozTxt'), 'frases separadas por espaco').toHaveValue('Meu nome é Igor Qual a programação de amanhã');
  const velho = await page.evaluateHandle(()=>window.__sr);
  await page.click('#folha >> text=Limpar');
  await expect(page.locator('#vozTxt')).toHaveValue('');
  await expect.poll(()=>page.evaluate(()=>window.__srs.length), 'limpar abre sessao nova').toBe(2);
  await expect(page.locator('#vozMic')).toHaveAttribute('aria-pressed','true');
  await page.evaluate(v=>v.falar('resultado atrasado da sessao velha',true), velho);
  await page.evaluate(()=>window.__sr.falar('A minha programação pra amanhã',true));
  await expect(page.locator('#vozTxt'), 'nada do que foi limpo volta').toHaveValue('A minha programação pra amanhã');
  await page.fill('#vozTxt','Qual a minha agenda');
  await page.evaluate(()=>window.__sr.falar('amanhã cedo',true));
  await expect(page.locator('#vozTxt'), 'o digitado fica e o ja ouvido nao volta por cima').toHaveValue('Qual a minha agenda amanhã cedo');
  await page.evaluate(()=>abrirFila(0));
  expect(await page.evaluate(()=>window.__sr.ligado), 'abrir um card desliga o microfone').toBe(false);
});

/* Print de 02/10/2026 23h24 ("ouvindoAlô OlhaQual"): se o Safari colar frases dentro do MESMO resultado,
   a juncao entre resultados nao basta. */
test('voz: frases coladas dentro de um resultado ganham espaco, e iPhone fica inteiro', async ({page})=>{
  await page.addInitScript(SR_DUBLE);
  await abrir(page);
  await page.click('#micTopo');
  await page.click('#vozMic');
  await page.evaluate(()=>window.__sr.falar('Oi tem alguém me ouvindoAlô OlhaQual é a programação no iPhone',true));
  await expect(page.locator('#vozTxt')).toHaveValue('Oi tem alguém me ouvindo Alô Olha Qual é a programação no iPhone');
});

test('voz: fechar a tela desliga o microfone, e texto curto demais nao vai', async ({page})=>{
  await page.addInitScript(SR_DUBLE);
  await abrir(page);
  await page.evaluate(()=>abrirVoz(''));
  await page.click('#vozMic');
  await page.click('#folha .pri');
  await expect(page.locator('#vozEstado')).toContainText('Pare o microfone');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>window.__sr.ligado), 'microfone desligado ao fechar').toBe(false);
  await page.click('#micTopo');
  await page.fill('#vozTxt','ok');
  await page.click('#folha .pri');
  await expect(page.locator('#vozEstado')).toContainText('antes de enviar');
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='inbox').length)).toBe(0);
});

test('voz sem reconhecimento e sem API: o botao desliga e o campo segue aceitando o ditado do teclado', async ({page})=>{
  await page.addInitScript(()=>{ window.webkitSpeechRecognition=undefined; window.SpeechRecognition=undefined; });
  await abrir(page);
  await page.click('#micTopo');
  await expect(page.locator('#vozMic')).toBeDisabled();
  await expect(page.locator('#vozEstado')).toContainText('microfone do teclado');
  await page.fill('#vozTxt','mandar a proposta revisada ao cliente');
  await page.click('#folha .pri');
  await page.evaluate(()=>enviar());
  const inbox = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='inbox').map(c=>c.a.p_texto));
  expect(inbox).toEqual(['[voz] mandar a proposta revisada ao cliente']);
});

test('voz pela API do aparelho: o audio vai para a URL guardada, o texto volta para revisar, e a chave nao viaja para outra URL', async ({page})=>{
  await page.addInitScript(()=>{
    window.webkitSpeechRecognition=undefined; window.SpeechRecognition=undefined;
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}});
    window.MediaRecorder = class {
      static isTypeSupported(t){ return t==='audio/webm'; }
      constructor(s,o){ this.mimeType=(o&&o.mimeType)||''; }
      start(){}
      stop(){ this.ondataavailable({data:new Blob(['RIFF'],{type:'audio/webm'})}); this.onstop(); }
    };
  });
  const recebido=[];
  await page.route('https://transcreve.exemplo/**', async r=>{
    const q=r.request();
    if(q.method()==='OPTIONS') return r.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'POST'}});
    recebido.push({m:q.method(), tipo:q.headers()['content-type'], auth:q.headers()['authorization'], n:(q.postDataBuffer()||Buffer.alloc(0)).length});
    return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({texto:'cobrar o laudo L1 na sexta'})});
  });
  await abrir(page);
  await page.click('#micTopo');
  await page.click('#folha summary');
  await page.fill('#vozUrl','http://sem-tls.exemplo/x');
  await page.click('text=Guardar neste aparelho');
  expect(await page.evaluate(()=>localStorage.getItem('cerebro.voz.api')), 'http sem TLS e recusado').toBeNull();
  await page.fill('#vozUrl','https://transcreve.exemplo/v1');
  await page.fill('#vozKey','chave-de-teste');
  await page.click('text=Guardar neste aparelho');
  await expect(page.locator('#vozMotor')).toContainText('transcreve.exemplo');
  await page.click('#vozMic');
  await page.click('#folha >> text=Limpar');
  await expect(page.locator('#vozMic'), 'limpar recomeca a gravacao').toHaveAttribute('aria-pressed','true');
  await page.click('#vozMic');
  await expect(page.locator('#vozTxt')).toHaveValue('cobrar o laudo L1 na sexta');
  expect(recebido, 'a gravacao limpa nao foi transcrita').toEqual([{m:'POST',tipo:'audio/webm',auth:'Bearer chave-de-teste',n:4}]);
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='inbox').length), 'transcrever nao grava').toBe(0);
  await page.click('#folha summary');
  await page.fill('#vozUrl','https://outra.exemplo/v1');
  await page.click('text=Guardar neste aparelho');
  const guardado = await page.evaluate(()=>JSON.parse(localStorage.getItem('cerebro.voz.api')));
  expect(guardado).toEqual({url:'https://outra.exemplo/v1',chave:''});
  const fonte = require('fs').readFileSync(path.resolve(__dirname,'..','presidente.html'),'utf8');
  expect(fonte, 'nenhum endereco de API no fonte').not.toMatch(/fetch\(\s*["']https?:/);
});

/* Medido em 02/10/2026: o iPhone abriu a p3 20 s depois do deploy da p3.1 (cache de ate 10 min do Pages)
   e o Igor testou a versao velha. A pagina confere a propria versao no servidor e oferece a nova. */
test('pagina velha no cache oferece a versao nova; mesma versao nao mostra nada', async ({page})=>{
  await abrir(page);
  await expect(page.locator('#novaVersao')).toBeHidden();
  await page.evaluate(async()=>{ window.fetch=async()=>({ok:true,json:async()=>({presidente:VERP})}); await checarVersao(); });
  await expect(page.locator('#novaVersao'), 'mesma versao').toBeHidden();
  await page.evaluate(async()=>{ window.fetch=async()=>({ok:true,json:async()=>({presidente:'p9'})}); await checarVersao(); });
  await expect(page.locator('#novaVersao')).toBeVisible();
  await expect(page.locator('#novaVersao')).toContainText('p9');
  const alt = await page.locator('#novaVersao').evaluate(e=>e.getBoundingClientRect().height);
  expect(alt).toBeGreaterThanOrEqual(44);
  await page.click('#micTopo');
  await expect(page.locator('#vozMotor'), 'a tela de voz diz a versao em uso').toContainText('painel p4');
});

/* p4 (03/10/2026): resposta por evento. Medido em 30 dias: p90 de 2,2 h no deliberar e 6,7 h na voz, porque
   o despertador estava sem token e so a passagem fixa respondia. O painel nao pode prometer o que o banco
   nao mediu: o recibo e a linha do topo saem de atendente_estado(). */
const AGORA = ()=>new Date().toISOString();
test('recibo honesto: com despertador ligado diz que acordou; sem token diz a passagem fixa', async ({page})=>{
  await page.addInitScript(()=>{ window.webkitSpeechRecognition=undefined; window.SpeechRecognition=undefined; });
  await page.addInitScript(()=>{ window.__atd={despertador:'sem_token',pendentes:0,sessao_viva:false,proxima_varredura:'2026-10-03T11:58:00-04:00'}; });
  await abrir(page);
  await expect(page.locator('#atd')).toContainText('Sem despertador: próxima');
  await expect(page.locator('#atd')).toHaveClass(/velho/);
  await page.click('#micTopo');
  await expect(page.locator('#vozDestino')).toContainText('próxima passagem');
  await page.fill('#vozTxt','mandar a proposta revisada ao cliente');
  await page.click('#folha .pri');
  await page.evaluate(()=>enviar());
  await expect(page.locator('#tmsg')).toContainText('Despertador desligado');
  await page.evaluate(t=>{ window.__atd={despertador:'ligado',pendentes:1,sessao_viva:false,ultimo_despertar_em:t,http:null}; }, AGORA());
  await page.click('#micTopo');
  await page.fill('#vozTxt','reagendar a vistoria para quinta');
  await page.click('#folha .pri');
  await page.evaluate(()=>enviar());
  await expect(page.locator('#tmsg')).toContainText('O atendente está acordado');
  await expect(page.locator('#atd')).toContainText('Atendente acordado');
  await expect(page.locator('#atd')).not.toHaveClass(/velho/);
  await page.setViewportSize({width:390, height:820});
  /* p4.22: o teto era 20 px fixos, medido com letra de 12 px; uma linha e menos de 1,8 vez o tamanho da letra */
  const atd = await page.locator('#atd').evaluate(e=>({h:e.getBoundingClientRect().height, fs:parseFloat(getComputedStyle(e).fontSize)}));
  expect(atd.h, 'linha do atendente cabe numa linha a 390 px').toBeLessThan(atd.fs*1.8);
  await page.evaluate(()=>{ window.__atd={...window.__atd,ultimo_despertar_em:'2026-10-01T00:00:00Z',http:401}; return atendenteEstado(); });
  await expect(page.locator('#atd'), 'POST recusado aparece, nao vira "acordado"').toContainText('HTTP 401');
});

test('resposta chega sozinha: evento do Realtime avisa e redesenha a conversa do card, sem recarregar a pagina', async ({page})=>{
  await page.addInitScript(t=>{ window.__atd={despertador:'ligado',pendentes:1,sessao_viva:true,ultimo_despertar_em:t};
    window.__tab={dialogo:[{id:9,pergunta:'Vale repactuar para sexta?',resposta:null,perguntado_em:t,respondido_em:null}]}; }, AGORA());
  await abrir(page);
  await page.evaluate(()=>abrirFila(0));
  await expect(page.locator('#conv')).toContainText('Vale repactuar para sexta?');
  await expect(page.locator('#conv')).toContainText('o atendente está acordado');
  const cargas0 = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length);
  await page.evaluate(t=>{
    const linha={id:9,pergunta:'Vale repactuar para sexta?',resposta:'Sim: o fiscal so libera na quinta.',perguntado_em:t,respondido_em:t};
    window.__tab.dialogo=[linha];
    window.__rt.filter(h=>h.f.table==='dialogo').forEach(h=>{ h.cb({new:linha}); h.cb({new:linha}); });
  }, AGORA());
  await expect(page.locator('#tmsg')).toContainText('O atendente respondeu: Sim: o fiscal');
  await expect(page.locator('#conv')).toContainText('Atendente: Sim: o fiscal so libera na quinta.');
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length), 'dados redesenhados pelo evento').toBeGreaterThan(cargas0);
  /* resposta velha que reaparece numa reconexao nao vira aviso */
  await page.evaluate(()=>{ toast('limpo',null,false); window.__rt.filter(h=>h.f.table==='comando').forEach(h=>h.cb({new:{id:3,texto:'[voz] x',status:'processado',resultado:'antiga',processado_em:'2026-09-01T00:00:00Z'}})); });
  await page.waitForTimeout(100);
  await expect(page.locator('#tmsg')).toHaveText('limpo');
  /* verbo em card grava "painel: ..." em comando; o agir() ja recarrega, o evento nao pode recarregar de novo */
  const cargas1 = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length);
  await page.evaluate(()=>window.__rt.filter(h=>h.f.table==='comando').forEach(h=>h.cb({new:{id:4,texto:'painel: repactuar tarefa#2 2026-10-09',status:'processado',resultado:'aplicado por agir()',processado_em:new Date().toISOString()}})));
  await page.waitForTimeout(1800);
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length), 'evento de agir() nao recarrega').toBe(cargas1);
  await expect(page.locator('#tmsg')).toHaveText('limpo');
});

/* p4.43 (s2118, p167 etapa 1): o banco sobe painel_pulso quando o dado muda; a tela rele sozinha, sem toque e sem
   remontar o snapshot. Com folha aberta o pulso espera e sai quando a folha fecha. */
test('pulso do banco: a tela rele a carga sozinha, nunca por cima de folha aberta', async ({page})=>{
  await abrir(page);
  const ouvintes = await page.evaluate(()=>window.__rt.filter(h=>h.f.table==='painel_pulso'&&h.f.event==='UPDATE').length);
  expect(ouvintes, 'presidente ouve painel_pulso').toBe(1);
  const cargas = ()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length);
  const montar0 = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_snapshot_montar').length);
  const c0 = await cargas();
  await page.evaluate(()=>{
    window.__dados={fila:[{origem:'tarefa',ref:'2',camada_tela:'hoje',posicao:1,teto_tela:5,frente:'11-renda-alt',titulo:'Card que mudou no banco',porque_agora:'vence hoje',verbo_sugerido:'feita',acoes:[]}]};
    window.__rt.filter(h=>h.f.table==='painel_pulso').forEach(h=>{ h.cb({new:{id:1,versao:7}}); h.cb({new:{id:1,versao:8}}); });
  });
  await expect(page.locator('#foco .tit')).toContainText('Card que mudou no banco');
  expect(await cargas() - c0, 'dois pulsos seguidos viram uma carga so').toBe(1);
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_snapshot_montar').length), 'pulso nao remonta o snapshot').toBe(montar0);
  /* folha aberta: o pulso espera */
  await page.evaluate(()=>abrirFila(0));
  await expect(page.locator('#veu')).not.toHaveClass(/hidden/);
  const c1 = await cargas();
  await page.evaluate(()=>window.__rt.filter(h=>h.f.table==='painel_pulso').forEach(h=>h.cb({new:{id:1,versao:9}})));
  await page.waitForTimeout(2500);
  expect(await cargas(), 'nada rele por cima da folha aberta').toBe(c1);
  await page.evaluate(()=>fecharFolha());
  await expect.poll(cargas, {message:'o pulso guardado sai depois que a folha fecha', timeout:8000}).toBe(c1 + 1);
});

test('fio curto: 3 trocas em 7 dias no card desligam o "Pedir análise"', async ({page})=>{
  await page.addInitScript(t=>{ window.__tab={dialogo:[1,2,3].map(i=>({id:i,pergunta:'pergunta '+i,resposta:'resposta '+i,perguntado_em:t,respondido_em:t}))}; }, AGORA());
  await abrir(page);
  await page.evaluate(()=>abrirFila(0));
  await expect(page.locator('#conv')).toContainText('Fio cheio');
  await expect(page.locator('#folha [data-verbo="deliberar"]')).toBeDisabled();
  await page.evaluate(()=>escolher('deliberar'));
  await expect(page.locator('#campo textarea'), 'nem por atalho abre o campo').toHaveCount(0);
  await page.evaluate(()=>{ window.__tab.dialogo=[]; fecharFolha(); abrirFila(0); });
  await expect(page.locator('#folha [data-verbo="deliberar"]')).toBeEnabled();
});

/* v71 · R7 (03/10/2026): texto do banco e texto, nunca marcacao, nem dentro de argumento JS de onclick.
   esc() devolve a aspa como &#39;, que o navegador decodifica antes de rodar o onclick: o verbo hostil
   abaixo escapava do argumento em escolher('...') e confirmar('...'). */
test('texto hostil do banco aparece como texto e nao executa, nem no clique do verbo', async ({page})=>{
  const X='<img src=x onerror="window.__xss=1">', V="x');window.__xss=2;//";
  const corpo=DUBLE
    .replace("titulo:'Card de exemplo',titulo_completo:'Card de exemplo'",`titulo:${JSON.stringify(X)},titulo_completo:${JSON.stringify(X)}`)
    .replace("{label:'deliberar',verbo:'deliberar',campo:'text'}]",`{label:'deliberar',verbo:'deliberar',campo:'text'},{label:${JSON.stringify(X)},verbo:${JSON.stringify(V)},campo:'text'}]`);
  expect(corpo, 'o duble hostil foi montado').toContain('window.__xss=2');
  const erros=[]; page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(corpo);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA);
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit'));
  const r = await page.evaluate(async([V])=>{
    const out={tit:document.querySelector('#foco .tit').textContent};
    abrirFila(0);
    const b=[...document.querySelectorAll('#folha button[data-verbo]')].find(x=>x.dataset.verbo===V);
    out.rot=b&&b.textContent; b.click();
    document.getElementById('cv').value='texto qualquer';
    document.querySelector('#campo .pri').click();
    await enviar();
    out.agir=window.__rpc.filter(c=>c.n==='agir').map(c=>c.a.p_verbo);
    await new Promise(r=>setTimeout(r,200));
    out.imgs=document.querySelectorAll('img[onerror]').length; out.xss=window.__xss;
    return out;
  }, [V]);
  expect(erros).toEqual([]);
  expect(r.tit).toBe(X);
  expect(r.rot, 'o rotulo hostil do botao e texto').toBe(X);
  expect(r.agir, 'o verbo chega literal ao banco').toContain(V);
  expect(r.imgs).toBe(0);
  expect(r.xss).toBeUndefined();
});

/* p4: o painel acorda o atendente e a resposta chega pelo Realtime (websocket wss://<projeto>.supabase.co).
   Os testes de CSP do PR #47 rodam com o cliente dublado, que nunca abre websocket: uma CSP sem wss passaria
   verde e mataria a resposta ao vivo em silencio. Aqui um WebSocket e um fetch NATIVOS saem debaixo da CSP real
   da pagina; o veredito e o evento securitypolicyviolation, que o navegador decide antes de tocar a rede.
   Medido em 04/10/2026: page.routeWebSocket troca o WebSocket da pagina por um duble em JS e a CSP nem e
   consultada (abriu com connect-src 'self'). Por isso o socket vai para um subdominio que nao existe. */
test('a CSP do presidente deixa o Realtime e o REST do Supabase passarem', async ({page})=>{
  await page.addInitScript(()=>{ window.__csp=[]; document.addEventListener('securitypolicyviolation',
    e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI)); });
  await page.route(/supabase\.co\/rest/, r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await abrir(page);
  const r = await page.evaluate(async()=>{
    try{ const ws=new WebSocket('wss://csp-teste.supabase.co/realtime/v1/websocket?vsn=1.0.0'); ws.onerror=()=>{}; }
    catch(e){ window.__csp.push('excecao '+e.name); }
    let rest; try{ rest=(await fetch(URL_+'/rest/v1/')).status; }catch(e){ rest='bloqueado'; }
    await new Promise(res=>setTimeout(res,800));
    return {rest, csp:window.__csp};
  });
  expect(r.csp, 'nenhuma violacao de CSP falando com o Supabase (websocket e REST)').toEqual([]);
  expect(r.rest, 'REST do Supabase passa debaixo da CSP').toBe(200);
});

/* p4.1 (04/10/2026): as duas telas discordavam do proximo passo com o mesmo banco. O index.html (v68) sobe
   para Hoje a tarefa vencida ou de hoje que o banco deixou no segundo plano (chave exp) e ordena por classe
   de servico; o presidente lia so a camada hoje por posicao, e abria com a demanda de peso 75 que vence em
   3 dias na frente da fatura vencida ha 7. A regra agora mora num bloco comum copiado nas duas paginas, e
   este teste confere byte a byte: o mesmo padrao da tag do supabase-js, que tambem vive nas duas. */
const fs = require('fs');
const blocosComuns = arq => {
  const fonte = fs.readFileSync(path.resolve(__dirname,'..',arq),'utf8'), m = {};
  for (const x of fonte.matchAll(/\/\* comum:([a-z]+) [^\n]*\*\/\r?\n([\s\S]*?)\/\* fim comum:\1 \*\//g)) m[x[1]] = x[2];
  return m;
};
test('o codigo comum das duas telas (regra de Hoje, teto de tempo, texto recolhido, porta do segundo fator, escape e acao) e o mesmo byte a byte', async ()=>{
  const a = blocosComuns('index.html'), b = blocosComuns('presidente.html');
  expect(Object.keys(a).sort(), 'blocos no index.html').toEqual(['acao','escapa','fator','hoje','recolhe','teto']);
  expect(Object.keys(b).sort(), 'blocos no presidente.html').toEqual(['acao','escapa','fator','hoje','recolhe','teto']);
  for (const k of Object.keys(a)) expect(b[k], `bloco comum:${k} divergiu`).toBe(a[k]);
});

/* O caso medido em 02/10/2026 (v68): a demanda de peso maior vence em 3 dias, tres tarefas vencem hoje e a
   fatura EKOS, vencida ha 7 dias, ficou no segundo plano e so chega pela chave exp. */
const CASO_HOJE = ()=>{
  const dia=n=>{const d=new Date(); d.setDate(d.getDate()+n); return ivData(d);};
  const it=(origem,ref,pos,peso,dr,camada)=>({origem,ref:String(ref),posicao:pos,peso,data_ref:dr,camada_tela:camada||'hoje',teto_tela:5,
    nivel:3,frente:'20-contrato-pj',acoes:[{label:'feita',verbo:'feita'}],titulo:'item '+ref,titulo_completo:'item '+ref});
  return {fila:[it('demanda','demanda-exemplo',1,75,dia(3)),it('fluxo','32',2,72,null),it('tarefa','1545',3,70,dia(0)),
                it('tarefa','1517',4,70,dia(0)),it('tarefa','1424',5,70,dia(0))],
          exp:[it('tarefa','1334',9,70,dia(-7),'depois')]};
};
const DUBLE_INDEX = `window.supabase={createClient:()=>({
  from:()=>({select:()=>({eq:()=>Promise.resolve({data:[],error:null})})}),
  auth:{getSession:()=>new Promise(()=>{}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
  rpc:()=>new Promise(()=>{})})};`;
test('o mesmo banco poe o mesmo item no topo de Hoje nas duas telas, com a vencida do segundo plano na frente', async ({page, context})=>{
  const idx = await context.newPage(), errosIdx = [];
  idx.on('pageerror',e=>errosIdx.push(String(e)));
  await idx.addInitScript(DUBLE_INDEX);
  await idx.route('**cdn.jsdelivr.net**', r=>r.abort());
  await idx.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await idx.waitForFunction(()=>document.getElementById('selo-ver').textContent.trim()!=='\u2014');
  const caso = await idx.evaluate(CASO_HOJE);
  const noIndex = await idx.evaluate(c=>{
    D.fila=c.fila; D.exp=c.exp; D.depois=[]; D.cont={depois:1}; D.cor=[]; D.min=[]; D.cap=null; semTeto=false;
    rAgora(); return [...document.querySelectorAll('#fila1 .card')].map(x=>x.dataset.r);
  }, caso);
  /* no presidente o caso entra pelo caminho real: painel_carga com as CHAVES da pagina */
  await page.addInitScript(c=>{ window.__dados=c; }, caso);
  const erros = await abrir(page);
  const noPres = await page.evaluate(()=>({ordem:hojeLista().map(x=>String(x.ref)), foco:document.querySelector('#foco .tit').textContent,
    pediuExp:window.__rpc.find(c=>c.n==='painel_carga').a.p_chaves.includes('exp')}));
  expect(noIndex[0], 'no index a vencida ha 7 dias abre Hoje').toBe('1334');
  expect(noPres.ordem[0], 'o topo de Hoje e o mesmo nas duas telas').toBe(noIndex[0]);
  expect(noPres.pediuExp, 'o presidente pede a chave exp ao banco').toBe(true);
  expect(noPres.foco, 'o proximo passo do presidente e a vencida').toBe('item 1334');
  expect(noPres.ordem.slice(0, noIndex.length), 'a ordem ate o corte do index e a mesma').toEqual(noIndex);
  expect(errosIdx.concat(erros), 'erros de script').toEqual([]);
});

/* p126 E1.1 (s1582, 10/10/2026): o presidente mostrou 22 passos e 6,7 h e o bastidor 19 itens e 355 min com o mesmo
   banco (medido em 10/10). Cada tela montava o Hoje no navegador. Agora as duas leem a chave hoje (v_hoje_unico) e o
   resumo hoje_resumo: o banco decide o conjunto, a ordem e a conta. O caso poe na fila um item que o banco tirou de
   Hoje (fluxo 32), uma vencida do segundo plano que o banco poe em 1o e uma peca da Mesa; o codigo antigo reprova. */
const CASO_P126 = ()=>{
  const dia=n=>{const d=new Date(); d.setDate(d.getDate()+n); return ivData(d);};
  const it=(origem,ref,pos,peso,dr,camada)=>({origem,ref:String(ref),posicao:pos,peso,data_ref:dr,camada_tela:camada||'hoje',teto_tela:5,
    nivel:3,frente:'20-contrato-pj',acoes:[{label:'feita',verbo:'feita'}],titulo:'item '+ref,titulo_completo:'item '+ref});
  const hj=(ordem,tipo,origem,ref,dr,min,extra)=>Object.assign({ordem,tipo,origem,ref:String(ref),titulo:'banco '+ref,frente:'20-contrato-pj',
    data_ref:dr,entrada:'fila',classe:null,minutos:min,sem_estimativa:false,pecas_ligadas:[],em_jogo_rs:null,ato:null},extra||{});
  return {fila:[it('tarefa','1545',1,75,dia(1)),it('fluxo','32',2,72,null),it('tarefa','1517',3,70,dia(2))],
          exp:[it('tarefa','1334',9,70,dia(-7),'depois')],
          hoje:[hj(1,'card','tarefa','1334',dia(-7),20,{entrada:'vencida',classe:1}),hj(2,'card','tarefa','1517',dia(2),25),
                hj(3,'card','tarefa','1545',dia(1),30),hj(4,'peca','mesa','102',dia(0),15,{entrada:'nova',ato:'enviar'})],
          resumo:{passos:4,cards:3,pecas:1,minutos:90,sem_estimativa:0,capacidade_min:120,passa_min:0,pecas_dentro_de_card:[]}};
};
test('p126: as duas telas leem o Hoje do banco, com o mesmo conjunto, a mesma ordem e a mesma conta de passos e minutos', async ({page, context})=>{
  const idx = await context.newPage(), errosIdx = [];
  idx.on('pageerror',e=>errosIdx.push(String(e)));
  await idx.addInitScript(DUBLE_INDEX);
  await idx.route('**cdn.jsdelivr.net**', r=>r.abort());
  await idx.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await idx.waitForFunction(()=>document.getElementById('selo-ver').textContent.trim()!=='\u2014');
  const caso = await idx.evaluate(CASO_P126);
  const noIndex = await idx.evaluate(c=>{
    D.fila=c.fila; D.exp=c.exp; D.depois=[]; D.cont={depois:0}; D.cor=[]; D.min=[]; D.cap={minutos_dia:999}; semTeto=true;
    D.hoje=c.hoje; D.hoje_resumo=c.resumo;
    rAgora(); marcaAbas();
    return {ordem:[...document.querySelectorAll('#fila1 .card')].map(x=>x.dataset.r),
            n:document.getElementById('n-agora').textContent, cab:document.getElementById('h-fila1').textContent};
  }, caso);
  await page.addInitScript(c=>{ window.__dados={fila:c.fila, exp:c.exp, hoje:c.hoje, hoje_resumo:[c.resumo]}; }, caso);
  const erros = await abrir(page);
  const noPres = await page.evaluate(()=>({ordem:hojeLista().map(x=>String(x.ref)), pecas:pecasHoje().map(p=>String(p.id)),
    n:document.getElementById('n-hoje').textContent, sit:document.getElementById('situacao').textContent,
    foco:document.querySelector('#foco .tit').textContent,
    pediu:window.__rpc.find(c=>c.n==='painel_carga').a.p_chaves}));
  expect(noIndex.ordem, 'no index, a lista de Hoje e a do banco: fluxo 32 fora, vencida 1334 no topo').toEqual(['1334','1517','1545']);
  expect(noPres.ordem, 'no presidente, a mesma lista na mesma ordem').toEqual(noIndex.ordem);
  expect(noPres.pecas, 'a peca de Hoje e a do banco').toEqual(['102']);
  expect(noPres.n, 'o selo de Hoje do presidente conta os passos do banco').toBe('4');
  expect(noIndex.n, 'a aba Agora do bastidor conta os mesmos passos').toBe('4');
  expect(noPres.sit, 'o presidente diz os passos e o tempo do resumo').toContain('são 4 passos');
  expect(noPres.sit).toContain('1,5 h das suas 2 h');
  expect(noIndex.cab, 'o bastidor diz os mesmos passos e minutos').toContain('4 passos, 1 peça da Mesa, ~90 de 120 min');
  expect(noPres.foco, 'o proximo passo e o do banco, com o titulo da fila').toBe('item 1334');
  expect(noPres.pediu, 'o presidente pede as duas chaves ao banco').toEqual(expect.arrayContaining(['hoje','hoje_resumo']));
  expect(errosIdx.concat(erros), 'erros de script').toEqual([]);
});

/* p4.1: nenhuma ida ao banco do presidente tinha teto. RPC que nao volta deixava "gravando…" na tela para
   sempre, sem erro. O relogio e o do Playwright (page.clock): o teste salta o teto em vez de esperar 12 s. */
test('no presidente, RPC que nao volta vira erro visivel no teto, e o toast nao fica em "gravando…"', async ({page})=>{
  await page.addInitScript(()=>{ window.__pendura=['agir','inbox']; window.webkitSpeechRecognition=undefined; window.SpeechRecognition=undefined; });
  const erros = await abrir(page);
  await page.clock.install();
  const lim = await page.evaluate(()=>LIMITE_ACAO);
  await page.evaluate(()=>{abrirFila(0);escolher('repactuar');});
  await page.click('#campo .datas button >> nth=0');
  await page.evaluate(()=>{ enviar(); });
  await expect(page.locator('#tmsg')).toHaveText('gravando…');
  await page.clock.fastForward(lim-1000);
  await expect(page.locator('#tmsg'), 'antes do teto ainda espera').toHaveText('gravando…');
  await page.clock.fastForward(1100);
  await expect(page.locator('#tmsg'), 'agir: estouro vira erro').toContainText('sem resposta do banco em '+lim/1000+' s');
  await expect(page.locator('#tmsg'), 'estouro nao finge que nada gravou').toContainText('Nada foi confirmado');
  await expect(page.locator('#toast')).toHaveClass(/bad/);
  await expect(page.locator('#toast')).toBeVisible();
  /* p4.3: o ato abriu o proximo card de Hoje (auto-advance); o microfone fica atras da folha ate fechar */
  await expect(page.locator('#veu')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.click('#micTopo');
  await page.fill('#vozTxt','cobrar o laudo L1 na sexta');
  await page.click('#folha .pri');
  await page.evaluate(()=>{ enviar(); });
  await expect(page.locator('#tmsg')).toHaveText('gravando…');
  await page.clock.fastForward(lim+100);
  await expect(page.locator('#tmsg'), 'inbox: estouro vira erro').toContainText('sem resposta do banco');
  await expect(page.locator('#tmsg')).toContainText('O texto ficou guardado no microfone');
  expect(await page.evaluate(()=>VOZ.rascunho), 'o texto ditado nao se perde').toBe('cobrar o laudo L1 na sexta');
  expect(erros).toEqual([]);
});

test('no presidente, leitura que nao volta se declara: carga, inventario, historico e conversa do card', async ({page})=>{
  const erros = await abrir(page);
  await page.clock.install();
  const lim = await page.evaluate(()=>LIMITE_RECARGA);
  await page.evaluate(()=>{ window.__pendura=['painel_carga']; carregar(); });
  await page.clock.fastForward(lim+100);
  await expect(page.locator('#falha'), 'carga: estouro aparece').toBeVisible();
  await expect(page.locator('#falha')).toContainText('sem resposta do banco em '+lim/1000+' s');
  await page.evaluate(async()=>{ window.__pendura=['v_inventario_frente']; INV=null; await carregar(); });
  await page.clock.fastForward(lim+100);
  await expect(page.locator('#falha'), 'inventario: estouro aparece').toContainText('inventário: sem resposta do banco');
  await page.evaluate(()=>{ window.__pendura=['acao','dialogo']; abrirFila(0); });
  await expect(page.locator('#hist .sk'), 'p4.82: esqueleto no lugar de "carregando"').toHaveCount(1);
  await page.clock.fastForward(lim+100);
  await expect(page.locator('#hist')).toContainText('Histórico indisponível');
  await expect(page.locator('#conv')).toContainText('Conversa indisponível');
  expect(erros).toEqual([]);
});

/* p4.2 (04/10/2026): print do Igor no celular, aba Hoje. O fluxo 19 vinha com 14 linhas de prosa no lugar do
   titulo ("Cliente Exemplo Fase A, parcela 1/5 (entrada). R$ 3.890,40, vence 05/10/2026, boleto emitido. - Contrato v14
   assinado ..."). O banco ja corrigiu a causa, mas a tela se defende sozinha: na lista o titulo para em 2 linhas,
   e o contexto inteiro mora na folha, recolhido em 3 linhas com "ver mais". */
const FRASE = 'Cliente Exemplo Fase A, parcela 1/5 (entrada). R$ 3.890,40, vence 05/10/2026, boleto emitido. - Contrato v14 assinado pelas duas partes no DocuSign, com a ressalva do item 7 sobre o reajuste. ';
const LONGO = (FRASE.repeat(Math.ceil(1300/FRASE.length))).slice(0,1300);
const linhas = sel => [...document.querySelectorAll(sel)].map(e=>{
  const cs=getComputedStyle(e), lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.45;
  return {sel, n:e.getBoundingClientRect().height/lh, cortado:e.scrollHeight>e.clientHeight+1};});

test('titulo de 1.300 caracteres ocupa no maximo 2 linhas na lista a 390 px, sem rolagem horizontal', async ({page})=>{
  await page.setViewportSize({width:390, height:820});
  const erros = await abrir(page);
  expect(LONGO.length).toBe(1300);
  const r = await page.evaluate(([L,fn])=>{
    const linhas=eval(fn), out={};
    MS.dados=null;   /* p4.14: mede so os cards; a peca da Mesa em Hoje tem teste proprio */
    const sem='x'.repeat(400);   /* palavra sem espaco: so overflow-wrap impede a rolagem lateral */
    D.fila.forEach(f=>{f.titulo=f.titulo_completo=L; f.porque_agora='vence em 1d';});
    D.fila[1].titulo_completo=sem+' '+L;
    D.fila[0].recomendacao=L;
    INV.forEach(t=>{t.titulo=L;});
    D.c13i[0].descricao=L;
    render();
    const W=()=>({W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth});
    ir('hoje'); out.hoje={foco:linhas('#foco .tit'), porque:linhas('#foco .porque'), ordem:linhas('#ordem .l2'), meta:linhas('#ordem small'), ...W()};
    ir('fila'); out.fila={itens:linhas('#kanban .coluna.on .item .t'), ...W()};
    ir('caixa'); out.caixa={linhas:linhas('#p-caixa .linha-r .l2'), ...W()};
    ir('hoje'); abrirFila(1); out.folha={tit:document.getElementById('folhaTit').textContent, ...W()};
    return out;
  }, [LONGO, linhas.toString()]);
  for (const [aba, m] of Object.entries(r)) expect(m.SW, `rolagem horizontal em ${aba}`).toBe(m.W);
  const todos = [...r.hoje.foco, ...r.hoje.porque, ...r.hoje.ordem, ...r.fila.itens, ...r.caixa.linhas];
  for (const x of todos) { expect(x.n, 'no maximo 2 linhas em '+x.sel).toBeLessThanOrEqual(2.05); expect(x.cortado, 'o texto foi cortado, nao era curto: '+x.sel).toBe(true); }
  expect(todos.length, 'mediu foco, ordem, fila e caixa').toBeGreaterThanOrEqual(5);
  for (const x of r.hoje.meta) expect(x.n, 'a meta e uma linha so').toBeLessThanOrEqual(1.05);
  expect(r.folha.tit.endsWith(LONGO), 'a folha mostra o titulo inteiro').toBe(true);
  expect(erros).toEqual([]);
});

test('na folha, o contexto longo vem da tabela de origem, nasce recolhido em 3 linhas e abre com "ver mais" pelo teclado', async ({page})=>{
  await page.setViewportSize({width:390, height:820});
  await page.addInitScript(L=>{ window.__tab={tarefa:[{descricao:L}],fluxo_caixa:[{descricao:'curto'}]}; }, LONGO);
  const erros = await abrir(page);
  await page.evaluate(()=>abrirFila(0));
  const txt = page.locator('#descTxt'), bt = page.locator('#desc .ver-mais');
  await expect(txt).toHaveText(LONGO.trim());
  await expect(bt).toHaveAttribute('aria-expanded','false');
  await expect(bt).toHaveAttribute('aria-controls','descTxt');
  await expect(bt).toHaveText('ver mais');
  const alto = async()=>txt.evaluate(e=>e.getBoundingClientRect().height/parseFloat(getComputedStyle(e).lineHeight));
  expect(await alto(), 'recolhido: 3 linhas').toBeLessThanOrEqual(3.05);
  const tam = await bt.evaluate(e=>{const r=e.getBoundingClientRect();return [r.width,r.height];});
  expect(Math.min(...tam), 'ver mais tem alvo de toque de 44 px').toBeGreaterThanOrEqual(44);
  await bt.focus(); await page.keyboard.press('Enter');
  await expect(bt).toHaveAttribute('aria-expanded','true');
  await expect(bt).toHaveText('ver menos');
  expect(await alto(), 'aberto: o texto inteiro').toBeGreaterThan(10);
  await page.keyboard.press('Space');
  await expect(bt).toHaveAttribute('aria-expanded','false');
  expect(await alto()).toBeLessThanOrEqual(3.05);
  const w = await page.evaluate(()=>({W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth}));
  expect(w.SW, 'rolagem horizontal com o contexto aberto').toBe(w.W);
  /* contexto curto nao ganha botao; contexto igual ao titulo nao se repete; origem sem fonte nao pede nada */
  await page.evaluate(()=>{ fecharFolha(); window.__tab.tarefa=[{descricao:'Ligar para o fiscal.'}]; abrirFila(0); });
  await expect(page.locator('#descTxt')).toHaveText('Ligar para o fiscal.');
  await expect(page.locator('#desc .ver-mais')).toBeHidden();
  await page.evaluate(()=>{ fecharFolha(); window.__tab.tarefa=[{descricao:D.fila[0].titulo_completo}]; abrirFila(0); });
  await expect(page.locator('#descBox')).toHaveCount(0);
  await page.evaluate(()=>{ fecharFolha(); D.fila[0].origem='gargalo'; abrirFila(0); });
  await expect(page.locator('#descBox')).toHaveCount(0);
  expect(erros).toEqual([]);
});

test('na folha, contexto que nao volta se declara no teto', async ({page})=>{
  await page.addInitScript(()=>{ window.__pendura=['tarefa']; });
  const erros = await abrir(page);
  await page.clock.install();
  const lim = await page.evaluate(()=>LIMITE_RECARGA);
  await page.evaluate(()=>abrirFila(0));
  await expect(page.locator('#desc .sk'), 'p4.82: esqueleto no lugar de "carregando"').toHaveCount(1);
  await page.clock.fastForward(lim+100);
  await expect(page.locator('#desc')).toContainText('Contexto indisponível');
  expect(erros).toEqual([]);
});

/* ---------- p4.3 (04/10/2026): onda 1 do benchmark, card t1635 ---------- */

/* Linear Triage: todo card diz ha quanto tempo espera o Igor. Medido na carga real de 04/10/2026: a fila
   traz dias_parado (dias inteiros, de atualizado_em::date) e nenhum timestamp; se atualizado_em vier, o selo
   passa a horas. Card sem medida nenhuma mostra o selo assim mesmo, dizendo que falta a data. */
test('todo card de Hoje e da Fila mostra ha quanto tempo espera voce', async ({page})=>{
  const erros = await abrir(page);
  const r = await page.evaluate(()=>{
    MS.dados=null;   /* p4.14: mede so os cards; a peca da Mesa em Hoje tem teste proprio */
    D.fila[0].dias_parado=9;
    D.fila[1].atualizado_em=new Date(Date.now()-5*36e5).toISOString();
    D.fila.push({origem:'demanda',ref:'dx',camada_tela:'hoje',posicao:3,teto_tela:5,frente:'20-contrato-pj',titulo:'Sem medida',acoes:[]});
    D.fila.push({origem:'tarefa',ref:'2b',camada_tela:'hoje',posicao:4,teto_tela:5,frente:'20-contrato-pj',titulo:'Hoje mesmo',dias_parado:0,acoes:[]});
    render(); ir('hoje');
    const cards=[document.querySelector('#foco'),...document.querySelectorAll('#ordem button')];
    const sel=cards.map(c=>{const e=c.querySelector('.espera');return e?{t:e.textContent,w:e.classList.contains('w')}:null;});
    ir('fila');
    const fila=[...document.querySelectorAll('#kanban .item')].map(i=>{const e=i.querySelector('.espera');return {tit:i.querySelector('.t').textContent,esp:e?e.textContent:null};});
    return {n:hojeLista().length, sel, fila};
  });
  expect(r.sel.length, 'mediu todos os cards de Hoje').toBe(r.n);
  expect(r.sel.filter(x=>!x), 'card de Hoje sem selo').toEqual([]);
  expect(r.sel[0]).toEqual({t:'esperando você há 9 d', w:true});
  expect(r.sel[1]).toEqual({t:'esperando você há 5 h', w:false});
  expect(r.sel[2].t).toBe('esperando você (sem data de entrada)');
  expect(r.sel[3].t).toBe('esperando você desde hoje');
  expect(r.fila.length).toBeGreaterThanOrEqual(4);
  expect(r.fila.filter(x=>!x.esp), 'card da Fila sem selo').toEqual([]);
  expect(r.fila.find(x=>x.tit==='Item esperando').esp, 'bola com terceiro nao e "esperando voce"').toBe('com outra pessoa desde hoje');
  expect(r.fila.find(x=>x.tit==='Item para decidir').esp).toBe('esperando você há 40 d');
  /* tarefa da fila sem dias_parado usa o parado_dias do inventario */
  const sem = await page.evaluate(()=>{ delete D.fila[0].dias_parado; render(); ir('hoje'); return document.querySelector('#foco .espera').textContent; });
  expect(sem).toBe('esperando você há 1 d');
  expect(erros).toEqual([]);
});

/* Superhuman: depois do ato o proximo card de Hoje ja esta aberto, sem recarregar e sem esperar o banco.
   O relogio do ato e o mesmo painel_medir_decisao do index.html, com p_modo 'presidente'. */
test('ato na folha abre o proximo card de Hoje em menos de 300 ms, sem recarregar, e mede a decisao', async ({page})=>{
  const erros = await abrir(page);
  const r = await page.evaluate(()=>{
    window.__marca=1;
    const cargas=window.__rpc.filter(c=>c.n==='painel_carga').length;
    abrirFila(0); escolher('repactuar');
    const t0=performance.now();
    document.querySelector('#campo .datas button').click();
    const dt=performance.now()-t0;
    return {dt, tit:document.getElementById('folhaTit').textContent, veu:!document.getElementById('veu').classList.contains('hidden'),
      cargas:window.__rpc.filter(c=>c.n==='painel_carga').length-cargas, toast:document.getElementById('tmsg').textContent,
      desfazer:!document.getElementById('tbtn').classList.contains('hidden'),
      medida:window.__rpc.filter(c=>c.n==='painel_medir_decisao').map(c=>c.a)};
  });
  expect(r.veu, 'a folha seguinte esta aberta').toBe(true);
  expect(r.tit, 'o proximo card de Hoje').toBe('Segundo card');
  expect(r.dt, 'abre em ate 300 ms').toBeLessThan(300);
  expect(r.cargas, 'sem recarregar').toBe(0);
  expect(r.desfazer, 'o desfazer do ato continua na tela').toBe(true);
  expect(r.toast, 'p4.21: o aviso diz o card pelo titulo').toContain('Card de exemplo');
  expect(r.medida.length).toBe(1);
  expect(r.medida[0]).toMatchObject({p_origem:'tarefa',p_ref:'2',p_ato:'s',p_modo:'presidente'});
  expect(Number.isInteger(r.medida[0].p_ms)).toBe(true);
  /* ato no ultimo card: nada mais pede voce, a folha fecha; o primeiro ato e gravado, a pagina e a mesma */
  await page.evaluate(()=>{ escolher('repactuar'); document.querySelector('#campo .datas button').click(); });
  await expect(page.locator('#veu')).toBeHidden();
  expect(await page.evaluate(()=>window.__marca), 'a pagina nao recarregou').toBe(1);
  const agir = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').map(c=>c.a.p_ref));
  expect(agir, 'o ato anterior gravou quando veio o seguinte').toEqual(['2']);
  /* desfazer o ultimo devolve o card a volta */
  await page.click('#tbtn');
  await page.evaluate(()=>{ abrirFila(0); escolher('repactuar'); document.querySelector('#campo .datas button').click(); });
  await expect(page.locator('#folhaTit')).toHaveText('Segundo card');
  expect(erros).toEqual([]);
});

/* O resultado do ato anterior volta do banco com o ato seguinte ainda pendente: nao pode tirar da tela o
   botao de desfazer do seguinte. */
test('o "Gravado." do ato anterior nao cobre o desfazer do ato seguinte', async ({page})=>{
  const erros = await abrir(page);
  await page.evaluate(()=>{ abrirFila(0); escolher('repactuar'); document.querySelector('#campo .datas button').click(); });
  await page.evaluate(()=>{ escolher('repactuar'); document.querySelector('#campo .datas button').click(); });
  await page.waitForTimeout(200);
  await expect(page.locator('#tbtn'), 'desfazer do segundo ato a vista').toBeVisible();
  await expect(page.locator('#tmsg'), 'p4.21: o aviso diz o card pelo titulo').toContainText('Segundo card');
  expect(erros).toEqual([]);
});

test('teclado na folha: A ato principal, S adiar (p157), R responder, e nada disso dentro de campo de texto', async ({page})=>{
  const erros = await abrir(page);
  await page.keyboard.press('s');
  await expect(page.locator('#veu'), 'sem folha, S nao faz nada').toBeHidden();
  await page.evaluate(()=>abrirFila(0));
  await page.keyboard.press('Control+s');
  await expect(page.locator('#campo')).toBeEmpty();
  await page.keyboard.press('s');
  /* p4.54 (p157): S adia escondendo; a nova data segue no botao da folha */
  await expect(page.locator('#campo .datas button')).toHaveCount(3);
  await expect(page.locator('#campo')).toContainText('Adiar só esconde');
  await page.keyboard.press('r');
  await expect(page.locator('#campo label')).toHaveText('Pedir análise');
  await expect(page.locator('#cv')).toBeFocused();
  await page.keyboard.type('sra');
  await expect(page.locator('#cv'), 'letra digitada no campo e texto, nao atalho').toHaveValue('sra');
  await expect(page.locator('#campo label')).toHaveText('Pedir análise');
  await page.locator('#folhaTit').click();
  await page.keyboard.press('a');
  await expect(page.locator('#campo .pri')).toHaveText('Concluir com esta prova');
  await expect(page.locator('#cv')).toHaveValue('');
  /* card sem deliberar: R responde pela inbox, com o card no comeco do texto */
  await page.evaluate(()=>{ fecharFolha(); D.fila[1].acoes=[{label:'feita',verbo:'feita'}]; abrirFila(1); });
  await page.keyboard.press('r');
  await expect(page.locator('#campo label')).toHaveText('Responder ao atendente sobre este card');
  await page.fill('#cv','o fiscal ja aprovou');
  await page.click('#campo .pri');
  await page.evaluate(()=>enviar());
  const r = await page.evaluate(()=>({inbox:window.__rpc.filter(c=>c.n==='inbox').map(c=>c.a.p_texto), agir:window.__rpc.filter(c=>c.n==='agir'),
    medida:window.__rpc.filter(c=>c.n==='painel_medir_decisao').map(c=>c.a.p_ato)}));
  expect(r.inbox).toEqual(['[resposta tarefa 5] o fiscal ja aprovou']);
  expect(r.agir).toEqual([]);
  expect(r.medida).toEqual(['r']);
  expect(erros).toEqual([]);
});

/* Statuspage: um selo so no topo, agregando snapshot, rotinas e backup. Backup falho e degradado. */
const saudeCom = async (page, dados)=>{
  await page.addInitScript(d=>{ window.__dados=d; }, dados);
  const erros = await abrir(page);
  return {erros, txt:await page.locator('#saude').textContent(), cls:await page.locator('#saude').getAttribute('class')};
};
test('selo de saude: tudo em dia diz "sistema ok" e o ultimo backup', async ({page})=>{
  const r = await saudeCom(page, {});
  expect(r.txt).toBe('sistema ok');
  expect(r.cls).toContain('ok');
  expect(await page.locator('#saude').getAttribute('title')).toContain('último backup');
  expect(await page.evaluate(()=>window.__rpc.find(c=>c.n==='painel_carga').a.p_chaves), 'pede fresc, mo e eb ao banco').toEqual(expect.arrayContaining(['fresc','mo','eb']));
  await expect(page.locator('#falha')).toBeHidden();
  expect(r.erros).toEqual([]);
});
test('selo de saude: backup falho aparece como degradado', async ({page})=>{
  const r = await saudeCom(page, {eb:[{nome:'backup-cerebro',falhas_7d:2,orcamento_falhas_7d:1,veredito_budget:'ESTOURADO'}]});
  expect(r.txt).toBe('sistema degradado: backup falhou 2× em 7 d');
  expect(r.cls).toContain('w');
  expect(r.erros).toEqual([]);
});
test('selo de saude: backup atrasado, rotina atrasada, snapshot velho e medida ausente tambem degradam', async ({page})=>{
  const r = await saudeCom(page, {mo:[{nome:'backup-cerebro',estado:'atrasada',janela_horas:26},{nome:'painel-snapshot',estado:'atrasada'}]});
  expect(r.txt).toBe('sistema degradado: 1 rotina atrasada · backup atrasado');
  expect(await page.locator('#saude').getAttribute('title')).toContain('painel-snapshot');
  const v = await page.evaluate(()=>{ D.mo=[{nome:'backup-cerebro',estado:'no ponto'}]; IDADE=IDADE_MAX+600; renderSaude(); const a=document.getElementById('saude').textContent;
    IDADE=0; delete D.eb; renderSaude(); return [a, document.getElementById('saude').textContent]; });
  expect(v[0]).toContain('sistema degradado: dados de');
  expect(v[1]).toBe('sistema degradado: rotinas sem medida nesta carga');
  expect(r.erros).toEqual([]);
});

/* Mercury/Stripe: recebivel vencido tem "Cobrar" a um toque. O toque pede pela inbox() um rascunho ao
   atendente e nao manda nada a ninguem; o texto ao pagador nao cita valor, porque o c13i so tem a parte do
   Igor e nao o bruto da nota. */
test('Cobrar em recebivel vencido pede o rascunho pela inbox, sem agir e sem enviar nada ao pagador', async ({page})=>{
  await page.addInitScript(()=>{
    const d=n=>{const x=new Date(); x.setDate(x.getDate()+n); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};
    const fx=(ref,dr)=>({origem:'fluxo',ref,camada_tela:'hoje',teto_tela:5,frente:'20-contrato-pj',titulo:'Receber fluxo '+ref,data_ref:dr,dias_parado:2,acoes:[{label:'caiu',verbo:'confirmado'}]});
    window.__dados={fila:[fx('251',d(-2)),fx('252',d(0)),fx('253',d(-2))],
      c13i:[{id:251,natureza:'receber',vencido:true,valor_igor:1400,descricao:'NF 001 Cliente',data_venc:d(-2),frente_slug:'20-contrato-pj'},
            {id:252,natureza:'receber',vencido:false,valor_igor:900,descricao:'NF 002',data_venc:d(0),frente_slug:'20-contrato-pj'},
            {id:253,natureza:'pagar',vencido:true,valor_igor:500,descricao:'Boleto',data_venc:d(-2),frente_slug:'20-contrato-pj'}]};
  });
  const erros = await abrir(page);
  const tem = await page.evaluate(()=>['251','252','253'].map(ref=>{ fecharFolha(); abrirHoje(hojeLista().find(x=>x.ref===ref)); return !!document.getElementById('btCobrar'); }));
  expect(tem, 'so o recebivel com data passada tem Cobrar').toEqual([true,false,false]);
  await page.evaluate(()=>{ fecharFolha(); abrirHoje(hojeLista().find(x=>x.ref==='251')); });
  await page.click('#btCobrar');
  await expect(page.locator('#tbtn'), 'tem desfazer').toBeVisible();
  await page.evaluate(()=>enviar());
  const r = await page.evaluate(()=>({inbox:window.__rpc.filter(c=>c.n==='inbox').map(c=>c.a.p_texto), agir:window.__rpc.filter(c=>c.n==='agir')}));
  expect(r.agir, 'cobrar nao e verbo do agir').toEqual([]);
  expect(r.inbox.length).toBe(1);
  expect(r.inbox[0]).toMatch(/^\[cobrar\] Rascunhe e NÃO envie/);
  expect(r.inbox[0]).toContain('fluxo 251');
  expect(r.inbox[0]).toContain('NF 001 Cliente');
  expect(r.inbox[0].split('Sugestão:')[1], 'o texto ao pagador nao cita a parte do Igor como se fosse o valor').not.toContain('R$');
  await expect(page.locator('#tmsg')).toContainText('nada vai ao pagador sem você');
  /* no Caixa, a linha do vencido tem o mesmo Cobrar */
  await page.evaluate(()=>{ fecharFolha(); ir('caixa'); });
  await expect(page.locator('#cobrarBox .cobrar')).toHaveCount(1);
  await page.click('#cobrarBox .cobrar');
  await page.evaluate(()=>enviar());
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='inbox').length)).toBe(2);
  expect(erros).toEqual([]);
});

/* p4.9 (s880, 06/10/2026): o "caiu" gravava confirmado, status ABERTO, e o card voltava a tela (fluxos 251 e 19).
   Agora o banco oferece caiu -> recebido com campo "entidade": o toque pede a conta (PF, Ruiz e Dabli nao se
   misturam, trava 658), a ultima usada so pre-destaca e nada vai ao banco sem o toque explicito na conta. */
test('caiu pede o banco exato: 11 contas sem rolar a 360 px, a ultima usada destacada, e o agir leva a conta tocada', async ({page})=>{
  await page.setViewportSize({width:360, height:820});
  await page.addInitScript(()=>{
    const d=n=>{const x=new Date(); x.setDate(x.getDate()+n); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};
    const ops=[['BANCO_A','PF · Banco A 10001-1'],['BANCO_B','PF · Banco B 200002-2'],['CARTEIRA','PF · Carteira digital'],['EXTERIOR','PF · Exterior (US$)'],
      ['EMPRESA1_X_3000003-3','Empresa 1 · Banco X 3000003-3'],['EMPRESA2_X_4000004-4','Empresa 2 · Banco X 4000004-4'],['EMPRESA3_Y_5005-5','Empresa 3 · Banco Y 5005-5'],
      ['EMPRESA3_A_60006-6','Empresa 3 · Banco A 60006-6'],['EMPRESA3_Z','Empresa 3 · Banco Z'],['EMPRESA3_W','Empresa 3 · Banco W'],['EMPRESA4_V_70007-7','Empresa 4 · Banco V 70007-7']]
      .map(([v,rot])=>({v,rot}));
    window.__dados={fila:[{origem:'fluxo',ref:'19',camada_tela:'hoje',teto_tela:5,frente:'08-startup',titulo:'Receber parcela 1/5 do cliente',data_ref:d(-1),dias_parado:1,
      acoes:[{label:'caiu',verbo:'recebido',campo:'entidade',padrao:'EMPRESA2_X_4000004-4',opcoes:ops},{campo:'date',label:'nova data',verbo:'repactuar'}]}]};
  });
  const erros = await abrir(page);
  await page.evaluate(()=>abrirFila(0,'recebido'));
  const contas = page.locator('#campo .contas button');
  await expect(contas).toHaveCount(11);
  await expect(page.locator('#campo .contas button.sug'), 'so a ultima usada vem destacada').toHaveCount(1);
  await expect(page.locator('#campo .contas button.sug')).toHaveAttribute('data-conta','EMPRESA2_X_4000004-4');
  /* p4.10: classe no DOM nao prova destaque. Mede a cor DESENHADA: todo texto das contas passa 4,5:1 e a
     sugerida tem fundo e borda diferentes das outras (o chip de uma das contas sumiu com a classe certa) */
  const med = await page.evaluate(contrasteDos, '#campo .contas button, #campo .contas button *');
  expect(med.length, 'mediu as 11 contas e o selo').toBe(12);
  expect(med.filter(m=>!(m.razao>=4.5)), 'texto das contas abaixo de 4,5:1 (NaN reprova)').toEqual([]);
  const vis = await page.evaluate(()=>{const g=e=>{const c=getComputedStyle(e);return c.backgroundColor+'|'+c.borderTopColor;};
    const s=document.querySelector('#campo .contas button.sug'), o=document.querySelector('#campo .contas button:not(.sug)');return [g(s),g(o)];});
  expect(vis[0], 'a sugerida se distingue das outras').not.toBe(vis[1]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth), 'sem rolagem horizontal a 360 px').toBe(true);
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').length), 'abrir a escolha nao grava nada').toBe(0);
  await page.click('#campo .contas button[data-conta="EMPRESA1_X_3000003-3"]');
  await page.evaluate(()=>enviar());
  const ag = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').map(c=>c.a));
  expect(ag).toEqual([{p_origem:'fluxo',p_ref:'19',p_verbo:'recebido',p_valor:'EMPRESA1_X_3000003-3'}]);
  expect(erros).toEqual([]);
});

/* p4.49 (p137, s2833 11/10/2026): pagar pelo painel. O paguei copia o codigo do boleto ou do Pix que o banco guardou,
   mostra o atalho do app so da conta que tem atalho testado, e a conta tocada leva o print do comprovante ao banco.
   A acao do card passa por acoesFila: campo que ela nao repassa some calado, por isso o teste parte do dado do banco. */
test('p137: paguei copia o codigo, abre o app da conta sugerida e leva conta e print; sem codigo nao ha copiar', async ({page})=>{
  await page.setViewportSize({width:360, height:820});
  await page.addInitScript(()=>{
    const d=n=>{const x=new Date(); x.setDate(x.getDate()+n); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:t=>{window.__copiado=t;return Promise.resolve();}}});
    const ops=[{v:'BANCO_A',rot:'PF · Banco A 10001-1',app:'exemplo-banco://abrir'},{v:'BANCO_B',rot:'PF · Banco B 200002-2'}];
    const pagar=(ref,padrao,extra)=>({origem:'fluxo',ref,camada_tela:'hoje',teto_tela:5,frente:'07-financas-pf',titulo:'Pagar parcela de exemplo '+ref,data_ref:d(0),dias_parado:0,
      acoes:[Object.assign({label:'paguei',verbo:'pago',campo:'entidade',padrao,opcoes:ops},extra),{campo:'date',label:'nova data',verbo:'repactuar'}]});
    window.__dados={fila:[pagar('41','BANCO_A',{codigo:'00190000090000000000000000000000000000000000000',codigo_tipo:'boleto'}),pagar('42','BANCO_B',{})]};
  });
  const erros = await abrir(page);
  const abrirRef = ref=>page.evaluate(r=>abrirHoje(hojeLista().find(x=>String(x.ref)===r),'pago'), ref);
  await abrirRef('42');
  await expect(page.locator('#campo [data-acao="copiarCodigo"]'), 'sem codigo no banco, sem botao de copiar').toHaveCount(0);
  await expect(page.locator('#campo a.abrir-app'), 'conta sugerida sem atalho testado, sem botao de app').toHaveCount(0);
  await expect(page.locator('#campo #cvArq'), 'o print segue disponivel').toHaveCount(1);
  await page.evaluate(()=>fecharFolha());
  await abrirRef('41');
  const copiar = page.locator('#campo [data-acao="copiarCodigo"]');
  await expect(copiar).toHaveText('Copiar a linha do boleto');
  await copiar.click();
  expect(await page.evaluate(()=>window.__copiado), 'copiou a linha que veio do banco').toBe('00190000090000000000000000000000000000000000000');
  await expect(page.locator('#campo a.abrir-app')).toHaveAttribute('href','exemplo-banco://abrir');
  const alturas = await page.evaluate(()=>[...document.querySelectorAll('#campo .copiar-cod, #campo .abrir-app')].map(e=>Math.round(e.getBoundingClientRect().height)));
  expect(alturas.length).toBe(2);
  expect(alturas.filter(h=>h<44||h>80), 'copiar e abrir app com altura de toque, sem esticar').toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth), 'sem rolagem horizontal a 360 px').toBe(true);
  await page.setInputFiles('#cvArq', {name:'comprovante.png', mimeType:'image/png', buffer:Buffer.from('png de exemplo')});
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').length), 'copiar e anexar nao gravam nada').toBe(0);
  await page.click('#campo .contas button[data-conta="BANCO_B"]');
  await page.evaluate(()=>enviar());
  const up = await page.evaluate(()=>window.__storage.filter(s=>s.op==='upload'));
  expect(up.length, 'o print subiu uma vez').toBe(1);
  expect(up[0].b).toBe('mesa-provas');
  const ag = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').map(c=>c.a));
  expect(ag.length).toBe(1);
  expect(ag[0].p_verbo).toBe('pago');
  expect(ag[0].p_valor, 'conta tocada + caminho do print, no formato que o agir_nucleo separa').toMatch(/^BANCO_B · anexo mesa-provas\/.+\.png$/);
  expect(erros).toEqual([]);
});

/* p4.10 (06/10/2026): varredura de contraste. O chip da conta sugerida sumiu (1,09:1) com a classe certa no DOM,
   porque uma regra mais especifica trocou o fundo e deixou o texto. A classe do defeito e cascata que pinta texto
   escuro em fundo escuro: aqui todo texto de botao visivel, nas cinco abas e na folha do card, passa 4,5:1. */
test('nenhum texto abaixo de 4,5:1 nas cinco abas e na folha do card', async ({page})=>{
  await page.setViewportSize({width:390, height:844});
  const erros = await abrir(page);
  const ruins = [];
  for (const aba of ['hoje','fila','frentes','caixa','mesa']){
    await page.evaluate(a=>ir(a), aba);
    const m = await page.evaluate(contrasteDos, 'body *');
    ruins.push(...m.filter(x=>!(x.razao>=4.5)).map(x=>aba+': '+x.txt+' = '+x.razao));
  }
  await page.evaluate(()=>{ ir('hoje'); abrirFila(0); });
  const f = await page.evaluate(contrasteDos, '#folha *');
  expect(f.length, 'a folha tem texto medido').toBeGreaterThan(0);
  ruins.push(...f.filter(x=>!(x.razao>=4.5)).map(x=>'folha: '+x.txt+' = '+x.razao));
  expect(ruins).toEqual([]);
  expect(erros).toEqual([]);
});

/* p4.11 (06/10/2026): o mesmo nome de token com valor diferente e a mesma classe do chip que sumiu. --line e
   --line2 estavam trocados entre o index e o presidente, e --warn, --r e --mono divergiam. Mesmo nome, mesmo valor. */
/* p4.23 (plano 82a): o p4.11 comparava tres :root copiados a mao. Agora a fonte e uma so (tokens.css): a classe
   "mesmo nome, valor diferente" morre por construcao. O teste cobra que nenhuma pagina volta a declarar token
   proprio e que as tres ligam o tokens.css com o carimbo do conteudo atual (senao o Pages serve o velho). */
test('tokens: as tres paginas ligam o mesmo tokens.css, com carimbo atual, e nenhuma declara token proprio', async ()=>{
  const fs=require('fs'), crypto=require('crypto');
  const tok=fs.readFileSync(path.resolve(__dirname,'..','tokens.css'),'utf8').replace(/\r\n/g,'\n');
  const v8=crypto.createHash('md5').update(tok,'utf8').digest('hex').slice(0,8);
  const nomes=[...tok.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map(m=>m[1]);
  expect(nomes.length, 'leu o tokens.css').toBeGreaterThan(60);
  expect(nomes.filter((n,i)=>nomes.indexOf(n)!==i), 'nome repetido no tokens.css').toEqual([]);
  for (const arq of ['index.html','presidente.html','seguranca.html']) {
    const s=fs.readFileSync(path.resolve(__dirname,'..',arq),'utf8');
    expect(s.match(/<link rel="stylesheet" href="tokens\.css\?v=([0-9a-f]{8})">/)?.[1], arq+': carimbo do tokens.css').toBe(v8);
    const proprios=[...s.matchAll(/:root\{([^}]*)\}/g)].flatMap(m=>[...m[1].matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map(x=>x[1])).filter(n=>n!=='--topo');
    expect(proprios, arq+': token declarado fora do tokens.css').toEqual([]);
  }
});

/* p4.23: arquivo ligado que nao carrega nao da erro, da pagina sem cor. A prova e a cor pintada nas tres. */
test('p4.23: o tokens.css chega pintado nas tres paginas (fundo navy, letra ice)', async ({page})=>{
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  for (const arq of ['index.html','presidente.html','seguranca.html']) {
    await page.goto('file://' + path.resolve(__dirname, '..', arq));
    const c = await page.evaluate(()=>{const s=getComputedStyle(document.body);return [s.backgroundColor,s.color,getComputedStyle(document.documentElement).getPropertyValue('--on-bad-bg').trim()];});
    expect(c, arq).toEqual(['rgb(11, 16, 32)','rgb(244, 247, 251)','#ff8a8f']);
  }
});

/* p4.23 (plano 82a): 94 cores soltas nas tres paginas (71 no bastidor). Cor entra no tokens.css com nome de papel;
   na pagina, so var(). Ficam tres excecoes medidas: a meta theme-color (o navegador nao le var) e as duas cores da
   janela solta do PDF de demonstracao, que nasce sem folha de estilo. O p4.22 reprova aqui. */
test('p4.23: zero cor literal nas tres paginas, fora as tres excecoes medidas', ()=>{
  const fs=require('fs');
  const COR=/(?<![&\w])#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b|rgba?\(\s*\d|hsla?\(\s*\d/g;
  const EXC=['<meta name="theme-color" content="#0B1020">','background:#fff;color:#111','<p style="color:#444">'];
  for (const arq of ['index.html','presidente.html','seguranca.html']) {
    let s=fs.readFileSync(path.resolve(__dirname,'..',arq),'utf8');
    for (const e of EXC) s=s.split(e).join('');
    const soltas=[...s.matchAll(COR)].map(m=>{const l=s.slice(0,m.index).split('\n').length;return l+': '+s.slice(m.index,m.index+24);});
    expect(soltas, arq+': cor literal fora do tokens.css').toEqual([]);
  }
});

/* p4.23 (plano 82a): fundo --X e texto --on-X andam em par. Cada par mede pelo menos 4,5:1 (WCAG AA, texto normal).
   Medido antes: branco sobre --acc dava 3,7:1 e branco sobre --bad 2,3:1; os dois passaram ao navy. --on-grad fica
   fora da conta: o fundo e um degrade, e o contraste dele e medido na tela pelo teste de login. */
test('p4.23: todo par --X / --on-X do tokens.css passa 4,5:1', ()=>{
  const fs=require('fs');
  const tok=fs.readFileSync(path.resolve(__dirname,'..','tokens.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
  const v={};for(const m of tok.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g))v[m[1]]=m[2].trim();
  const res=n=>{let x=v[n];for(let i=0;i<9&&x&&/^var\(/.test(x);i++)x=v[x.slice(4,-1)];return x;};
  const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(u=>u<=.03928?u/12.92:((u+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
  const pares=Object.keys(v).filter(n=>n.startsWith('--on-')&&n!=='--on-grad');
  expect(pares.length, 'pares lidos').toBeGreaterThan(12);
  const ruins=[];
  for (const on of pares) {
    const fundo='--'+on.slice(5), a=res(fundo), b=res(on);
    if (!/^#[0-9a-fA-F]{6}$/.test(a||'') || !/^#[0-9a-fA-F]{6}$/.test(b||'')) { ruins.push(on+': par sem cor solida ('+a+' / '+b+')'); continue; }
    const [L1,L2]=[lum(a),lum(b)], r=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
    if (r<4.5) ruins.push(on+' sobre '+fundo+': '+r.toFixed(2)+':1');
  }
  expect(ruins).toEqual([]);
});

/* p4.11: a folha e dialogo modal. Abrir pelo teclado leva o foco para dentro, o Tab nao sai e o Esc devolve o foco. */
test('folha modal: foco entra, 40 Tabs nao saem e o Esc devolve o foco a quem abriu', async ({page})=>{
  await page.setViewportSize({width:390, height:844});
  const erros = await abrir(page);
  await page.evaluate(()=>{const b=document.querySelector('#foco .tit');b.setAttribute('tabindex','0');b.id=b.id||'abridor';b.focus();abrirFila(0);});
  expect(await page.evaluate(()=>!!document.activeElement.closest('#folha')), 'foco entrou na folha').toBe(true);
  expect(await page.evaluate(()=>document.getElementById('app').inert), 'fundo inerte').toBe(true);
  let fora=0; for(let i=0;i<40;i++){ await page.keyboard.press(i%7===6?'Shift+Tab':'Tab'); if(!(await page.evaluate(()=>!!document.activeElement.closest('#folha')))) fora++; }
  expect(fora, 'Tabs que sairam da folha').toBe(0);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>document.getElementById('app').inert), 'fundo volta a ser usavel').toBe(false);
  expect(await page.evaluate(()=>document.activeElement.id), 'foco volta a quem abriu').toBe(await page.evaluate(()=>document.querySelector('#foco .tit').id));
  expect(erros).toEqual([]);
});

/* ---------- p4.4 (05/10/2026): aba Mesa ----------
   O banco ja guarda o estoque de pecas paradas esperando o Igor (mesa_painel) e aceita a baixa de envio
   (mesa_baixa_painel). A tela cobra tres coisas: codigo do banco nunca aparece cru (ato, canal, gaveta,
   tipo de prova, slug de frente), baixa sem canal nao vai ao banco (LC-14) e o relatorio abre por link
   assinado do bucket mesa, com erro virando aviso e nunca tela em branco. */
const CRUS_MESA = ['aprovar','enviar','assinar','A_AGIR','B_FEITO','C_SISTEMA','whatsapp','gmail','email_corporativo','em_maos','documental','declaratoria','20-contrato-pj','11-renda-alt','null','undefined','NaN'];
const abrirMesa = async page=>{
  const erros = await abrir(page);
  await page.evaluate(()=>ir('mesa'));
  await page.waitForSelector('#ms-raiz .ms-item');
  return erros;
};

test('Mesa: a aba mostra as 3 pecas, o dia e os 2 relatorios, sem codigo cru do banco', async ({page})=>{
  await page.setViewportSize({width:360, height:820});
  const erros = await abrirMesa(page);
  await expect(page.locator('#ms-raiz .ms-item')).toHaveCount(3);
  await expect(page.locator('#ms-raiz .ms-rel')).toHaveCount(2);
  await expect(page.locator('#n-mesa'), 'selo da nav = pecas no estoque').toHaveText('3');
  await expect(page.locator('#tituloAba')).toHaveText('Mesa');
  /* toLocaleString poe espaco fixo (U+00A0) depois do R$: o teste compara com espaco comum */
  const txt = (await page.locator('#p-mesa').innerText()).replace(/\u00a0/g,' ');
  expect(txt).toContain('3 peças esperam você');
  expect(txt).toContain('1 nova hoje');
  for (const s of ['Aprovação para Fiscal de exemplo','Envio para Cliente de exemplo','Assinatura','sem valor','parada há 9 d','parada desde hoje','Saiu hoje','com comprovante','Fechamento do dia','versão 02'])
    expect(txt, 'mostra '+s).toContain(s);
  for (const cru of CRUS_MESA) expect(txt, 'codigo cru na aba: '+cru).not.toContain(cru);
  /* a folha da peca tambem fala lingua de gente */
  await page.click('#ms-raiz .ms-item >> nth=0');
  await expect(page.locator('#folhaTit')).toHaveText('Medicao 7 de exemplo');
  const folha = (await page.locator('#folha').innerText()).replace(/\u00a0/g,' ');
  expect(folha).toContain('Falta a sua aprovacao para protocolar.');
  /* p4.53: o destinatario mora no "Enviei por" da peca de envio, uma vez so */
  await page.evaluate(()=>{ fecharFolha(); msAbrirId(102); });
  await expect(page.locator('#msDest'), 'para quem vem preenchido').toHaveValue('Cliente de exemplo');
  for (const cru of CRUS_MESA) expect(folha, 'codigo cru na folha: '+cru).not.toContain(cru);
  /* fonte mais larga (Linux da CI): o desenho encolhe o texto, nao a pagina */
  const w = await page.evaluate(()=>{ document.body.style.letterSpacing='1.5px'; const a={W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};
    fecharFolha(); return [a,{W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth}]; });
  for (const m of w) expect(m.SW, 'rolagem horizontal com letra larga').toBe(m.W);
  expect(erros).toEqual([]);
});

test('Mesa: "Enviei por" sem canal nao chama o banco e diz o que falta', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.click('#ms-raiz .ms-item >> nth=1');
  await page.click('#msBt');
  await expect(page.locator('#msAviso')).toContainText('Escolha por onde a peça saiu');
  await expect(page.locator('#veu'), 'a folha continua aberta').toBeVisible();
  await page.waitForTimeout(150);
  const r = await page.evaluate(()=>({baixa:window.__rpc.filter(c=>c.n==='mesa_baixa_painel'), up:window.__storage.filter(c=>c.op==='upload')}));
  expect(r.baixa, 'sem canal nao grava').toEqual([]);
  expect(r.up, 'sem canal nem o print sobe').toEqual([]);
  expect(erros).toEqual([]);
});

test('Mesa: com canal, a baixa chama mesa_baixa_painel com a peca e o canal certos; com print, o arquivo sobe antes', async ({page})=>{
  const erros = await abrirMesa(page);
  const baixas = ()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_baixa_painel').map(c=>c.a));
  const cargas0 = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_painel').length);
  await page.click('#ms-raiz .ms-item >> nth=1');
  await page.click('#folha [data-canal="gmail"]');
  await expect(page.locator('#folha [data-canal="gmail"]')).toHaveAttribute('aria-pressed','true');
  await page.click('#msBt'); await expect(page.locator('#msAviso')).toContainText('Anexe o print'); await page.waitForTimeout(100); expect(await baixas(), 'o 1o toque sem print nao grava').toEqual([]); await expect(page.locator('#msBt')).toHaveText('Enviei sem print'); await page.click('#msBt');
  await expect.poll(baixas).toEqual([{p_doc:102,p_canal:'gmail',p_dest:'Cliente de exemplo',p_prova_path:null}]);
  await expect(page.locator('#veu'), 'baixa gravada fecha a folha').toBeHidden();
  await expect(page.locator('#tmsg')).toContainText('Enviada por E-mail para Cliente de exemplo: aprovada e com baixa');
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_painel').length), 'a aba recarrega').toBeGreaterThan(cargas0);
  /* com print: sobe para mesa-provas em AAAA-MM/<peca>_<hora>.<ext> e o banco recebe o mesmo caminho */
  await page.click('#ms-raiz .ms-item >> nth=2');
  await page.click('#folha [data-canal="whatsapp"]');
  await page.fill('#msDest','Fiscal de exemplo');
  await page.setInputFiles('#msArq', {name:'print.PNG', mimeType:'image/png', buffer:Buffer.from('png')});
  await page.click('#msBt');
  await expect.poll(async()=>(await baixas()).length).toBe(2);
  const b = (await baixas())[1], up = await page.evaluate(()=>window.__storage.filter(c=>c.op==='upload'));
  expect(b).toMatchObject({p_doc:103,p_canal:'whatsapp',p_dest:'Fiscal de exemplo'});
  expect(b.p_prova_path).toMatch(/^\d{4}-\d{2}\/103_\d+\.png$/);
  expect(up).toEqual([{b:'mesa-provas',op:'upload',p:b.p_prova_path,tipo:'image/png'}]);
  /* recusa do banco vira aviso com o texto, e a folha fica para corrigir */
  await page.evaluate(()=>{ window.__baixa='RECUSADO: doc 103 nao esta esperando voce'; });
  await page.click('#ms-raiz .ms-item >> nth=2');
  await expect(page.locator('#msDest')).toHaveValue('');
  await page.click('#folha [data-canal="em_maos"]');
  await page.click('#msBt');
  await expect(page.locator('#msAviso'), 'sem destinatario nao grava').toContainText('para quem');
  await page.fill('#msDest','Cartorio de exemplo');
  await page.click('#msBt'); await expect(page.locator('#msBt'), 'sem print o 1o toque pede o print').toHaveText('Enviei sem print'); await page.click('#msBt');
  await expect(page.locator('#toast')).toHaveClass(/bad/);
  await expect(page.locator('#tmsg')).toContainText('Não gravou: doc 103 nao esta esperando voce');
  await expect(page.locator('#veu')).toBeVisible();
  await expect(page.locator('#msBt')).toBeEnabled();
  expect((await baixas()).length).toBe(3);
  expect(erros).toEqual([]);
});

test('Mesa: o relatorio abre a folha; o PDF sai do botao pelo link assinado do bucket mesa; erro vira aviso', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.evaluate(()=>{ window.__abas=[]; window.open=()=>{ const w={closed:false,location:{href:''},close(){this.closed=true;}}; window.__abas.push(w); return w; }; });
  await page.click('#ms-raiz .ms-rel >> nth=0');
  /* p4.12: o toque abre a folha do relatorio, nunca o PDF direto */
  await expect(page.locator('#folhaTit')).toContainText('Fechamento do dia');
  expect(await page.evaluate(()=>window.__storage), 'o toque na lista nao abre o PDF').toEqual([]);
  await page.click('#msRelPdf');
  await expect.poll(()=>page.evaluate(()=>window.__abas.map(w=>w.location.href))).toEqual(['about:blank']);
  expect(await page.evaluate(()=>window.__storage)).toEqual([{b:'mesa',op:'createSignedUrl',p:'dia/fechamento_v02.pdf',s:300}]);
  await expect(page.locator('#tmsg')).toContainText('Relatório aberto');
  await page.evaluate(()=>{ window.__storageErro=true; fecharFolha(); });
  await page.click('#ms-raiz .ms-rel >> nth=1');
  await page.click('#msRelPdf');
  await expect(page.locator('#toast')).toHaveClass(/bad/);
  await expect(page.locator('#tmsg')).toContainText('Não consegui abrir o relatório: objeto nao encontrado');
  expect(await page.evaluate(()=>window.__abas[1].closed), 'a aba vazia fecha').toBe(true);
  await expect(page.locator('#ms-raiz .ms-rel'), 'a lista continua na tela').toHaveCount(2);
  expect(erros).toEqual([]);
});

/* ---------- p4.5 (05/10/2026): abrir a peca e deliberar ----------
   A copia da peca vem do bucket privado mesa por link assinado de 10 min, com a aba aberta no toque.
   A decisao vai por mesa_deliberar(p_doc, p_decisao, p_nota); ajuste e largar sem nota nao chamam o banco. */
const deliberacoes = page=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_deliberar').map(c=>c.a));
const abaFalsa = page=>page.evaluate(()=>{ window.__abas=[]; window.open=()=>{ const w={closed:false,location:{href:''},close(){this.closed=true;}}; window.__abas.push(w); return w; }; });

/* p4.50 (s2867, card 2307): auditoria da Mesa (doc 4005). A peca 703 (.xlsx) abria aba em branco no iPhone com o aviso
   "Peca aberta"; 26 de 63 pecas nao eram PDF. A classe: todo formato tem um caminho que o Safari mostra. */
const MESA_FMT = ()=>({hoje:new Date().toISOString().slice(0,10), em_jogo:0, horas_mes:0, producao_hoje:{}, saiu_hoje:[], relatorios:[], fechamentos:[],
  valor_hora:{recebido:0,horas:0,por_hora:0,piso:63.03,teto:480},
  estoque:[{id:201,frente:'20-contrato-pj',titulo:'Nota de exemplo em texto',ato:'ler',dias:1,peca:'pecas/201/nota_exemplo_v01.md'},
    {id:202,frente:'20-contrato-pj',titulo:'Relatorio de exemplo em pagina',ato:'decidir',dias:1,peca:'pecas/202/relatorio_exemplo_v01.html'},
    {id:203,frente:'20-contrato-pj',titulo:'Planilha de exemplo',ato:'entregar',dias:1,peca:'pecas/203/planilha_exemplo_v01.xlsx',drive:'1AbCdEfGhIjKlMnOp_exemplo'},
    {id:204,frente:'20-contrato-pj',titulo:'Minuta de exemplo em Word',ato:'aprovar',dias:1,peca:'pecas/204/minuta_exemplo_v01.docx'},
    {id:205,frente:'20-contrato-pj',titulo:'Laudo de exemplo em PDF',ato:'ler',dias:1,peca:'pecas/205/laudo_exemplo_v01.pdf'},
    {id:206,frente:'20-contrato-pj',titulo:'Resposta de exemplo sem arquivo',ato:null,dias:0,peca:null}]});
const abrirMesaFmt = async page=>{
  await page.route('https://exemplo.supabase.co/**', r=>{ const pagina=/\.html/.test(r.request().url());
    r.fulfill({status:200, headers:{'access-control-allow-origin':'*','content-type':pagina?'text/html; charset=utf-8':'text/markdown; charset=utf-8'},
      body:pagina?'<h2>Relatorio de exemplo</h2><script>window.parent.__vazou=1</script>'
                 :'# Titulo de exemplo\n\n- item **forte**\n- outro item\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n<img src=x onerror="window.__vazou=2">'}); });
  const erros = await abrir(page);
  await page.evaluate(m=>{ window.__mesa=m; window.__storageUrl=p=>'https://exemplo.supabase.co/storage/v1/object/sign/mesa/'+p+'?token=t'; }, MESA_FMT());
  await page.evaluate(()=>ir('mesa'));
  await page.waitForSelector('#ms-raiz .ms-item');
  await abaFalsa(page);
  return erros;
};

test('Mesa: cada formato abre do jeito que o iPhone mostra (texto e pagina na folha, planilha pelo Drive, Word com aviso)', async ({page})=>{
  const erros = await abrirMesaFmt(page);
  /* .md: le dentro da folha, com titulo, negrito e lista; HTML da peca nao vira tag */
  await page.evaluate(()=>msAbrirId(201));
  await expect(page.locator('#msPeca')).toHaveText('Ler a peça aqui');
  await page.click('#msPeca');
  await expect(page.locator('#msLeitura')).toBeVisible();
  await expect(page.locator('#msLeitura h4')).toHaveText('Titulo de exemplo');
  await expect(page.locator('#msLeitura b')).toHaveText('forte');
  await expect(page.locator('#msLeitura li')).toHaveCount(2);
  await expect(page.locator('#msLeitura img')).toHaveCount(0);
  await expect(page.locator('#msPeca')).toHaveText('Fechar a leitura');
  expect(await page.evaluate(()=>window.__abas.length), 'texto nao abre aba').toBe(0);
  await page.click('#msPeca');
  await expect(page.locator('#msLeitura')).toBeHidden();
  /* .html: moldura isolada, sem script */
  await page.evaluate(()=>{ fecharFolha(); msAbrirId(202); });
  await expect(page.locator('#msPeca')).toHaveText('Ler a peça aqui');
  await page.click('#msPeca');
  const q = page.locator('#msLeitura iframe.ms-quadro');
  await expect(q).toHaveAttribute('sandbox','');
  expect(await q.getAttribute('srcdoc')).toContain('Relatorio de exemplo');
  await page.waitForTimeout(300);
  expect(await page.evaluate(()=>window.__vazou), 'script da peca nao roda').toBeUndefined();
  /* .xlsx com id do Drive: abre o Drive na aba criada no toque, sem ir ao bucket */
  const antes = await page.evaluate(()=>window.__storage.length);
  await page.evaluate(()=>{ fecharFolha(); msAbrirId(203); });
  await expect(page.locator('#msPeca')).toHaveText('Abrir no Google Drive');
  await page.click('#msPeca');
  expect(await page.evaluate(()=>window.__abas.map(w=>w.location.href))).toEqual(['https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp_exemplo/view']);
  expect(await page.evaluate(()=>window.__storage.length), 'planilha com Drive nao pede link ao bucket').toBe(antes);
  /* .docx sem id do Drive: baixa e diz onde achar, nunca "Peca aberta" */
  await page.evaluate(()=>{ fecharFolha(); msAbrirId(204); });
  await expect(page.locator('#msPeca')).toHaveText('Baixar a peça (.docx)');
  await page.click('#msPeca');
  await expect(page.locator('#tmsg')).toContainText('abra pelo app Arquivos, em Downloads');
  await expect(page.locator('#tmsg')).not.toContainText('Peça aberta');
  /* .pdf segue como antes */
  await page.evaluate(()=>{ fecharFolha(); msAbrirId(205); });
  await expect(page.locator('#msPeca')).toHaveText('Abrir a peça');
  expect(erros).toEqual([]);
});

test('Mesa: peca sem arquivo nao mostra Ok e o gravar recusa o Ok sem ver', async ({page})=>{
  const erros = await abrirMesaFmt(page);
  await page.evaluate(()=>msAbrirId(206));
  await expect(page.locator('#msPeca')).toHaveCount(0);
  await expect(page.locator('#msBtAprovar')).toHaveCount(0);
  await expect(page.locator('#folha')).toContainText('Ainda sem arquivo para abrir');
  await expect(page.locator('#msAbreAjustar')).toBeVisible();
  const rpc0 = await page.evaluate(()=>window.__rpc.length);
  await page.evaluate(()=>msDecidir('aprovado'));
  await expect(page.locator('#msAvisoDec')).toContainText('o Ok fica para quando a cópia subir');
  expect(await page.evaluate(r0=>window.__rpc.slice(r0).filter(c=>c.n==='mesa_deliberar').length, rpc0), 'nada vai ao banco').toBe(0);
  /* peca com arquivo continua com Ok */
  await page.evaluate(()=>{ fecharFolha(); msAbrirId(205); });
  await expect(page.locator('#msBtAprovar')).toBeVisible();
  expect(erros).toEqual([]);
});

test('Mesa: "Abrir a peça" pede o link assinado da copia ao bucket mesa; peca sem copia avisa e nao tem o botao', async ({page})=>{
  const erros = await abrirMesa(page);
  await abaFalsa(page);
  await page.click('#ms-raiz .ms-item >> nth=0');
  await expect(page.locator('#msPeca')).toHaveText('Abrir a peça');
  await page.click('#msPeca');
  await expect.poll(()=>page.evaluate(()=>window.__abas.map(w=>w.location.href)), 'a aba abre no toque e recebe o link').toEqual(['about:blank']);
  expect(await page.evaluate(()=>window.__storage)).toEqual([{b:'mesa',op:'createSignedUrl',p:'pecas/101/medicao-7_exemplo_v01.pdf',s:600}]);
  await expect(page.locator('#tmsg')).toContainText('Peça aberta em outra aba');
  /* segunda peca: o caminho e o dela, nao o da primeira */
  await page.evaluate(()=>fecharFolha());
  await page.click('#ms-raiz .ms-item >> nth=1');
  await page.click('#msPeca');
  await expect.poll(()=>page.evaluate(()=>window.__storage.map(c=>c.p))).toEqual(['pecas/101/medicao-7_exemplo_v01.pdf','pecas/102/laudo_exemplo_v02.pdf']);
  /* terceira peca, sem copia: aviso no lugar do botao e nenhuma ida ao bucket */
  await page.evaluate(()=>fecharFolha());
  await page.click('#ms-raiz .ms-item >> nth=2');
  await expect(page.locator('#msPeca')).toHaveCount(0);
  await expect(page.locator('#folha')).toContainText('Ainda sem arquivo para abrir.');
  /* erro do bucket vira aviso e a aba vazia fecha */
  await page.evaluate(()=>{ fecharFolha(); window.__storageErro=true; });
  await page.click('#ms-raiz .ms-item >> nth=0');
  await page.click('#msPeca');
  await expect(page.locator('#toast')).toHaveClass(/bad/);
  await expect(page.locator('#tmsg')).toContainText('Não consegui abrir a peça: objeto nao encontrado');
  expect(await page.evaluate(()=>window.__abas[2].closed), 'a aba vazia fecha').toBe(true);
  expect(await page.evaluate(()=>window.__storage.length)).toBe(3);
  expect(erros).toEqual([]);
});

test('Mesa: "Aprovar" chama mesa_deliberar com a peca certa, fecha a folha e recarrega; recusa volta a folha', async ({page})=>{
  const erros = await abrirMesa(page);
  const cargas0 = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_painel').length);
  await page.click('#ms-raiz .ms-item >> nth=0');
  await expect(page.locator('#folha .ms-decide')).toContainText('Ok tira a peça da sua mesa.');
  await page.click('#msBtAprovar');
  await expect(page.locator('#veu'), 'a folha fecha no toque').toBeHidden();
  expect(await deliberacoes(page), 'p4.19: nada vai antes do prazo de desfazer').toEqual([]);
  await page.evaluate(()=>enviar());
  await expect.poll(()=>deliberacoes(page)).toEqual([{p_doc:101,p_decisao:'aprovado',p_nota:null}]);
  await expect(page.locator('#toast')).not.toHaveClass(/bad/);
  await expect(page.locator('#tmsg')).toHaveText('Aprovada: a peça saiu da sua mesa.');
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_painel').length), 'a aba recarrega').toBeGreaterThan(cargas0);
  /* RECUSADO: toast de erro com o texto do banco, folha aberta e botoes de volta */
  await page.evaluate(()=>{ window.__deliberar='RECUSADO: doc 101 ja saiu da mesa'; });
  await page.click('#ms-raiz .ms-item >> nth=0');
  await page.click('#msBtAprovar');
  await page.evaluate(()=>enviar());
  await expect(page.locator('#toast')).toHaveClass(/bad/);
  await expect(page.locator('#tmsg')).toContainText('Não gravou: doc 101 ja saiu da mesa');
  await expect(page.locator('#msAvisoDec')).toContainText('Não gravou: doc 101 ja saiu da mesa');
  await expect(page.locator('#veu')).toBeVisible();
  await expect(page.locator('#msBtAprovar')).toBeEnabled();
  await expect(page.locator('#msBtAprovar')).toHaveText('Aprovar');
  expect((await deliberacoes(page)).map(a=>a.p_doc)).toEqual([101,101]);
  expect(erros).toEqual([]);
});

test('Mesa: "Pedir ajuste" sem texto nao chama o banco; com texto vai com a nota', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.click('#ms-raiz .ms-item >> nth=1');
  await expect(page.locator('#msTxtAjustar'), 'o campo nasce fechado').toBeHidden();
  await page.click('#msAbreAjustar');
  await expect(page.locator('#msTxtAjustar')).toBeVisible();
  await expect(page.locator('#msAbreAjustar')).toHaveAttribute('aria-expanded','true');
  await page.click('#msBtAjustar');
  await expect(page.locator('#msAvisoDec')).toContainText('Diga o que precisa mudar na peça');
  await page.fill('#msTxtAjustar','   ');
  await page.click('#msBtAjustar');
  await page.waitForTimeout(150);
  expect(await deliberacoes(page), 'texto vazio ou so espaco nao grava').toEqual([]);
  await expect(page.locator('#veu')).toBeVisible();
  await page.fill('#msTxtAjustar','  Trocar a data da capa para 06/10  ');
  await page.click('#msBtAjustar');
  await page.evaluate(()=>enviar());
  await expect.poll(()=>deliberacoes(page)).toEqual([{p_doc:102,p_decisao:'ajustar',p_nota:'Trocar a data da capa para 06/10'}]);
  await expect(page.locator('#veu')).toBeHidden();
  await expect(page.locator('#tmsg')).toHaveText('Pedido de ajuste gravado.');
  expect(erros).toEqual([]);
});

test('Mesa: "Descartar" sem motivo nao chama o banco; com motivo vai com a nota', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.click('#ms-raiz .ms-item >> nth=2');
  await page.click('#msAbreLargar');
  await expect(page.locator('#msTxtLargar')).toBeVisible();
  await expect(page.locator('#msTxtAjustar'), 'um campo por vez').toBeHidden();
  await page.click('#msBtLargar');
  await expect(page.locator('#msAvisoDec')).toContainText('Diga por que descartar a peça');
  await page.waitForTimeout(150);
  expect(await deliberacoes(page), 'sem motivo nao grava').toEqual([]);
  await page.fill('#msTxtLargar','Cliente desistiu do contrato');
  await page.click('#msBtLargar');
  await page.evaluate(()=>enviar());
  await expect.poll(()=>deliberacoes(page)).toEqual([{p_doc:103,p_decisao:'largar',p_nota:'Cliente desistiu do contrato'}]);
  await expect(page.locator('#tmsg')).toHaveText('Peça descartada.');
  expect(erros).toEqual([]);
});

test('Mesa: nenhum codigo da decisao aparece cru na folha nem no aviso', async ({page})=>{
  const erros = await abrirMesa(page);
  /* "O que ajustar" e o rotulo pedido, em portugues de gente; fora dele, nada */
  const CRUS_DEC = ['aprovado','ajustar','largar','mesa_deliberar','p_decisao','p_nota','RECUSADO','OK:'];
  const textos = [];
  const colhe = async()=>textos.push((await page.locator('#folha').innerText())+'\n'+(await page.locator('#tmsg').innerText()));
  await page.click('#ms-raiz .ms-item >> nth=0');
  await colhe();
  await page.click('#msAbreAjustar'); await page.click('#msBtAjustar'); await colhe();
  await page.click('#msAbreLargar'); await page.click('#msBtLargar'); await colhe();
  await page.evaluate(()=>{ window.__deliberar='RECUSADO: fora do prazo'; });
  await page.click('#msBtAprovar'); await page.evaluate(()=>enviar()); await expect(page.locator('#toast')).toHaveClass(/bad/); await colhe();
  await page.evaluate(()=>{ window.__deliberar='OK: aprovado'; });
  await page.click('#msBtAprovar'); await expect(page.locator('#veu')).toBeHidden(); await colhe();
  for (const t of textos) {
    const limpo = t.replace(/ /g,' ').split('O que ajustar').join('');
    for (const cru of [...CRUS_DEC, ...CRUS_MESA]) expect(limpo, 'codigo cru: '+cru).not.toContain(cru);
  }
  const rot = await page.evaluate(()=>{ msAbrirP(msEst(MS.dados)[0]); return [...document.querySelectorAll('#folha .ms-decide button, #folha .ms-decide label, #msPeca')].map(e=>e.textContent.trim()); });
  expect(rot).toEqual(['Abrir a peça','Aprovar','Ajustar','Adiar','Descartar','O que ajustar','Enviar pedido','Volta para a mesa em','Adiar','Por que descartar','Descartar']);
  expect(erros).toEqual([]);
});

test('Mesa: leitura que falha se declara na aba, sem tela em branco', async ({page})=>{
  await page.addInitScript(()=>{ window.__pendura=['mesa_painel']; });
  const erros = await abrir(page);
  await page.clock.install();
  const lim = await page.evaluate(()=>LIMITE_RECARGA);
  /* a carga da partida ja pendurou com o relogio de verdade: solta ela e abre a aba sob o relogio falso */
  await page.evaluate(()=>{ MS.carga=null; ir('mesa'); });
  await expect(page.locator('#ms-raiz .sk'), 'p4.82: esqueleto no lugar de "carregando"').toHaveCount(1);
  await page.clock.fastForward(lim+100);
  await expect(page.locator('#ms-raiz .aviso')).toContainText('Não consegui ler a mesa: sem resposta do banco');
  expect(erros).toEqual([]);
});

/* t1745 (s855, 05/10/2026): o MFA (TOTP) do Igor ficou ativo as 20h01, mas as duas telas abriam com a
   sessao so de senha ou e-mail (aal1). A porta comum:fator le o nivel da sessao: com fator ativo e sessao
   aal1, pede o codigo do app e NAO carrega nada do banco antes de conferir. Leitura que falha fecha a porta
   (nunca abre por omissao) e oferece tentar de novo. Sessao que ja entrou com o codigo (aal2) abre direto. */
const FATOR_ATIVO = [{id:'fator-1',friendly_name:'celular',factor_type:'totp',status:'verified'}];
async function abrirComFator(page, cenario){
  const erros=[];
  page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(DUBLE);
  await page.addInitScript(c=>{ Object.assign(window,c); }, cenario);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA);
  return erros;
}
const cargas = page => page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length);
const opsMfa = page => page.evaluate(()=>(window.__mfa||[]).map(c=>c.op));

test('fator ativo e sessao so de senha: pede o codigo do app, nada carrega antes, codigo errado nao abre', async ({page})=>{
  const erros = await abrirComFator(page, {__fatores:FATOR_ATIVO});
  await expect(page.locator('#fator')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  await expect(page.locator('#login')).toBeHidden();
  await expect(page.locator('#btFatorDeNovo')).toBeHidden();
  const campo = await page.locator('#codFator').evaluate(e=>({im:e.inputMode, ac:e.autocomplete, foco:document.activeElement===e}));
  expect(campo).toEqual({im:'numeric', ac:'one-time-code', foco:true});
  expect(await cargas(page), 'painel_carga antes do codigo').toBe(0);
  await page.fill('#codFator','12');
  await page.click('#btFator');
  await expect(page.locator('#fmsg')).toContainText('6 números');
  expect(await opsMfa(page), 'codigo curto nao pede desafio').not.toContain('challenge');
  await page.fill('#codFator','999999');            /* 6 digitos confere sozinho, sem tocar no botao */
  await expect(page.locator('#fmsg')).toContainText('não confere');
  await expect(page.locator('#codFator')).toHaveValue('');
  await expect(page.locator('#app')).toBeHidden();
  expect(await cargas(page), 'painel_carga com codigo errado').toBe(0);
  await page.fill('#codFator','123456');
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#fator')).toBeHidden();
  const ver = await page.evaluate(()=>window.__mfa.filter(c=>c.op==='verify').map(c=>c.a));
  expect(ver.at(-1)).toEqual({factorId:'fator-1', challengeId:'desafio-1', code:'123456'});
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit'));
  expect(await cargas(page), 'uma carga depois do codigo').toBe(1);
  expect(erros).toEqual([]);
});

test('sessao que ja entrou com o codigo (aal2) e conta sem fator abrem direto, sem desafio', async ({page, context})=>{
  const erros = await abrirComFator(page, {__fatores:FATOR_ATIVO, __aal:'aal2'});
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit'));
  await expect(page.locator('#fator')).toBeHidden();
  expect(await opsMfa(page)).not.toContain('challenge');
  const p2 = await context.newPage();
  const erros2 = await abrirComFator(p2, {});
  await p2.waitForFunction(()=>!!document.querySelector('#foco .tit'));
  await expect(p2.locator('#fator')).toBeHidden();
  expect(await opsMfa(p2), 'sem fator nao lista nem desafia').toEqual(['aal']);
  expect(erros.concat(erros2)).toEqual([]);
});

test('leitura do nivel que falha fecha a porta e oferece tentar de novo; nunca abre por omissao', async ({page})=>{
  const erros = await abrirComFator(page, {__fatores:FATOR_ATIVO, __mfaErro:'aal'});
  await expect(page.locator('#fator')).toBeVisible();
  await expect(page.locator('#btFatorDeNovo')).toBeVisible();
  await expect(page.locator('#codFator')).toBeHidden();
  await expect(page.locator('#fmsg')).toContainText('fica fechada');
  await expect(page.locator('#app')).toBeHidden();
  expect(await cargas(page)).toBe(0);
  await page.evaluate(()=>{ window.__mfaErro=null; });
  await page.click('#btFatorDeNovo');
  await expect(page.locator('#codFator')).toBeVisible();
  await expect(page.locator('#btFatorDeNovo')).toBeHidden();
  await page.fill('#codFator','123456');
  await expect(page.locator('#app')).toBeVisible();
  expect(erros).toEqual([]);
});

test('a 360 px a porta do segundo fator nao tem controle abaixo de 44 px nem rolagem horizontal', async ({page})=>{
  await page.setViewportSize({width:360, height:740});
  await abrirComFator(page, {__fatores:FATOR_ATIVO});
  await expect(page.locator('#fator')).toBeVisible();
  const m = await page.evaluate(()=>{
    const pequenos=[...document.querySelectorAll('#fator button,#fator input')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.height<44||r.width<44);})
      .map(e=>(e.textContent||e.id).trim());
    return {pequenos, W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};
  });
  expect(m.pequenos).toEqual([]);
  expect(m.SW).toBe(m.W);
});

const DUBLE_INDEX_FATOR = `window.__cargas=0; window.supabase={createClient:()=>({
  from:()=>({select:()=>({eq:()=>Promise.resolve({data:[],error:null})})}),
  auth:{getSession:()=>Promise.resolve({data:{session:{user:{id:'x'}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),${MFA_DUBLE}},
  rpc:n=>{ if(n==='painel_carga')window.__cargas++; return new Promise(()=>{}); }})};`;
test('o index.html (bastidor) passa pela mesma porta: sem o codigo nao carrega, com ele abre', async ({page})=>{
  const erros=[]; page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(DUBLE_INDEX_FATOR);
  await page.addInitScript(f=>{ window.__fatores=f; }, FATOR_ATIVO);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await expect(page.locator('#fator')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  expect(await page.evaluate(()=>window.__cargas), 'painel_carga antes do codigo').toBe(0);
  await page.fill('#codFator','999999');
  await expect(page.locator('#fmsg')).toContainText('não confere');
  await page.fill('#codFator','123456');
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#fator')).toBeHidden();
  await page.waitForFunction(()=>window.__cargas>0);
  expect(await page.evaluate(()=>window.__cargas), 'uma carga depois do codigo').toBe(1);
  expect(erros).toEqual([]);
});

/* s859 05/10/2026: print do Igor 23h19 mostrou "7 sem estimativa", 5 deles pagamentos e recebimentos, e
   "Sua hora R$ 0,00, abaixo do piso" no dia 5 do mes. O banco passou a mandar minutos de fluxo pela chave
   fluxo:<id> e a hora em janela de 30 dias; a tela tem de usar os dois. */
test('s859: pagamento conta minutos pela chave fluxo e nao pega os da tarefa de mesmo numero', async ({page})=>{
  await abrir(page);
  const sit = await page.evaluate(()=>{
    D.fila=[{origem:'fluxo',ref:'9',camada_tela:'hoje',posicao:1,teto_tela:5,frente:'20-contrato-pj',titulo:'Pagar parcela de exemplo',porque_agora:'vence em 1d',valor_txt:'R$ 2.000,00',acoes:[]},
            {origem:'tarefa',ref:'9',camada_tela:'hoje',posicao:2,teto_tela:5,frente:'20-contrato-pj',titulo:'Tarefa de mesmo numero',porque_agora:'vence em 1d',acoes:[]}];
    D.exp=[]; D.min=[{id:'9',minutos_estimados:25},{id:'fluxo:9',minutos_estimados:10}]; MS.dados=null;
    render(); return document.getElementById('situacao').textContent;
  });
  expect(sit, 'nenhum passo sem estimativa').not.toContain('sem estimativa');
  expect(sit, '25 + 10 min').toContain('cerca de 0,6 h');
});


/* ---------- p4.12 (06/10/2026, s03): Mesa como ritual de fim de dia e modo demonstracao ----------
   O Igor abria o "fechamento do dia" direto no PDF, sem onde dar ciencia nem decidir, e via v01, v02 e v03 do
   mesmo dia misturadas com a vigente. Os testes cobram a classe: relatorio repetido nunca aparece duas vezes,
   o toque nunca abre PDF sem passar pela folha, o ritual so grava o que foi decidido e termina na ciencia,
   e a demonstracao nao cria cliente do banco nem carrega nome real no fonte (o repositorio e publico). */
test('Mesa p4.53: o link antigo do aviso (?ritual=1) so abre a Mesa, sem ritual, e tira o parametro da barra', async ({page})=>{
  const erros=[]; page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(DUBLE);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA+'?ritual=1');
  await expect(page.locator('#tituloAba')).toHaveText('Mesa');
  await page.waitForSelector('#ms-raiz .ms-item');
  await page.waitForTimeout(300);
  await expect(page.locator('#veu'), 'nenhuma folha de ritual abre').toBeHidden();
  expect(page.url(), 'o parametro sai da barra').not.toContain('ritual');
  expect(await page.evaluate(()=>window.__rpc.filter(c=>/^mesa_(deliberar|ciencia)/.test(c.n)).length), 'abrir nao grava').toBe(0);
  expect(erros).toEqual([]);
});

const ciencias = page=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_ciencia').map(c=>c.a));

test('Mesa p4.12: relatorio repetido aparece uma vez, na versao vigente; a anterior so dentro da folha; a folha nao pede ciencia', async ({page})=>{
  const erros = await abrirMesa(page);
  await abaFalsa(page);
  const hoje = await page.evaluate(()=>{ const m=JSON.parse(JSON.stringify(MS.dados));
    m.relatorios=[{tipo:'dia',alvo:m.hoje,versao:'01',titulo:'x v01',path:'dia/v01.pdf'},{tipo:'dia',alvo:m.hoje,versao:'03',titulo:'x v03',path:'dia/v03.pdf'},
      {tipo:'dia',alvo:m.hoje,versao:'02',titulo:'x v02',path:'dia/v02.pdf'}];
    m.fechamentos=[]; window.__mesa=m; msCarregar(); return m.hoje; });
  await expect(page.locator('#ms-raiz .ms-rel'), 'banco antigo mandava cada versao numa linha').toHaveCount(1);
  await expect(page.locator('#ms-raiz .ms-rel')).toContainText('versão 03');
  await expect(page.locator('#ms-raiz .ms-rel')).toContainText('2 versões anteriores');
  await page.click('#ms-raiz .ms-rel');
  expect(await page.evaluate(()=>window.__storage), 'o toque abre a folha, nao o PDF').toEqual([]);
  await page.click('#msRelPdf');
  await expect.poll(()=>page.evaluate(()=>window.__storage.map(x=>x.p))).toEqual(['dia/v03.pdf']);
  await page.click('#folha summary');
  await expect(page.locator('#folha .ms-versoes button')).toHaveText(['Versão 02, substituída','Versão 01, substituída']);
  await expect(page.locator('#msBtCiencia'), 'p4.53: a ciencia do dia saiu').toHaveCount(0);
  expect(hoje).toBeTruthy();
  expect(erros).toEqual([]);
});


test('Mesa p4.12: Adiar vai com a data; sem data nao grava; a peca adiada sai da conta do dia e diz quando volta', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.click('#ms-raiz .ms-item >> nth=0');
  await page.click('#msAbreAdiar');
  const amanha = await page.evaluate(()=>somaDias(1));
  await expect(page.locator('#msTxtAdiar')).toHaveValue(amanha);
  await page.fill('#msTxtAdiar','');
  await page.click('#msBtAdiar');
  await expect(page.locator('#msAvisoDec')).toContainText('Escolha a data');
  expect(await deliberacoes(page), 'sem data nao grava').toEqual([]);
  await page.fill('#msTxtAdiar', amanha);
  await page.evaluate(()=>{ window.__deliberar='OK: adiada ate 07/10'; });
  await page.click('#msBtAdiar');
  await page.evaluate(()=>enviar());
  await expect.poll(()=>deliberacoes(page)).toEqual([{p_doc:101,p_decisao:'adiar',p_nota:amanha}]);
  await expect(page.locator('#tmsg')).toContainText('Adiada até 07/10.');
  await page.evaluate(()=>{ const m=JSON.parse(JSON.stringify(MS.dados)); m.estoque[0].adiado_ate=somaDias(2); window.__mesa=m; msCarregar(); });
  await expect(page.locator('#n-mesa'), 'a adiada sai do selo').toHaveText('2');
  await expect(page.locator('#ms-raiz details.ms-adiadas summary')).toHaveText('Adiadas (1)');
  await page.click('#ms-raiz details.ms-adiadas summary');
  await expect(page.locator('#ms-raiz details.ms-adiadas .ms-item')).toContainText('volta em');
  expect(erros).toEqual([]);
});

/* A lista de nomes proibidos (pessoas, empresas, bancos, cidade e ids do projeto) vai em SHA-256: escrita em claro,
   ela mesma vazaria os nomes neste repositorio publico. Cada palavra, e cada par e trio de palavras seguidas, sem
   acento e em minuscula, e comparada com a lista. Nome novo: gerar o hash do mesmo jeito. Vale para o fonte do
   bloco de demonstracao e, desde o t3627, para o texto que a demonstracao poe na tela. */
const PROIBIDOS = new Set(['6ab84705e5d695ef','f1fca769f672a482','eb8b7bef229ddb38','4cb8b3c18423fdf7','57ddbe120c2a5254','4c006c647316bd2e','b748ad66d73dd832',
  '1fa4c9eed0c8dab6','ff30d1531a8d9f49','fe7870a244a2000b','3a476a05128038e1','a39fdca4bf85865d','b599675130c2a485','e606e9794651b68d','b4fba2288e6a880a',
  'd86dc6e60b0632e3','91d1699885940621','064d1e677b995c1f','b684e5a7d5767cce','6035dd9902419a84','b8d8a9b672985b1d','b90f4994c4675589','44c2fc7b06e5b214',
  '948ed6a2a21964d6','80efd4dd27606356','4d9639d39ff3c9aa','c2c64c35e75eda0f','5fbc1daee9d1fa06','4135aa9dc1b842a6','ff06535ac1029cca','8dd28c9b66f34782',
  'ec0aa35a6ea6b190','7ded2c90172ea13a','7fac0d0407d16331','a0d66abfb6c54bfb',
  /* t3627: organizacao do banco, contrapartes do lancamento, registro profissional, usuario e dominio */
  '8f5bc9be9b21fee3','93bfaea430f53d51','ccc084be9e6614bc','bd74b05721c494d9','0c9f8eebe02257cc','c5565caf9cce0da9','fb1b817620f43dd9']);
const hashDe = t=>require('crypto').createHash('sha256').update(t).digest('hex').slice(0,16);
function nomesProibidos(texto){
  const pal = texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), achados = [];
  for (let k=0; k<pal.length; k++) for (let n=1; n<=3 && k+n<=pal.length; n++) { const t=pal.slice(k,k+n).join(' '); if(PROIBIDOS.has(hashDe(t))) achados.push(t); }
  return achados;
}

/* a demonstracao entra pelo mesmo arquivo; o duble do supabase continua no lugar, para provar que ninguem o chama */
async function abrirDemo(page, largura, perfil){
  const erros=[], rede=[];
  page.on('pageerror',e=>erros.push(String(e)));
  page.on('request',r=>{ const u=r.url(); if(!/^(file|data|blob|about):/.test(u)&&!/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u))rede.push(u); });
  if(largura)await page.setViewportSize({width:largura, height:820});
  await page.addInitScript(DUBLE);
  await page.addInitScript(p=>{ try{sessionStorage.setItem('cerebro.demo','1'); if(p)sessionStorage.setItem('cerebro.demo.perfil',String(p));}catch(e){}
    const c=window.supabase.createClient; window.supabase.createClient=(...a)=>{ window.__criou=(window.__criou||0)+1; return c(...a); }; }, perfil||null);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA);
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit') && !!document.querySelector('#kanban .item'));
  return {erros, rede};
}

/* t3627: o mesmo roteiro vale para os dois perfis; os ids das pecas (701, 705) sao os mesmos de proposito */
for (const perfil of [1,2]) test(`Demonstracao (perfil ${perfil}): nenhum cliente do banco nasce, nada sai para a rede, a marca e neutra e tudo se clica`, async ({page})=>{
  const {erros, rede} = await abrirDemo(page, 360, perfil);
  await expect(page.locator('#demoAviso')).toBeVisible();
  await abaFalsa(page);
  for (const aba of ['hoje','fila','caixa','frentes','mesa','semana']) {
    await page.evaluate(a=>ir(a), aba);
    if(aba==='mesa') await page.waitForSelector('#ms-raiz .ms-item');
    const m = await page.evaluate(()=>{
      const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';};
      const pequenos=[...document.querySelectorAll('button,input,textarea,summary,a[href]:not(.rodape a)')].filter(vis)
        .filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44;}).map(e=>(e.getAttribute('aria-label')||e.textContent||e.id).trim().slice(0,30));
      return {pequenos, W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth, txt:document.body.innerText};
    });
    expect(m.pequenos, `controles pequenos em ${aba}`).toEqual([]);
    expect(m.SW, `rolagem horizontal em ${aba}`).toBe(m.W);
    expect(m.txt, `marca real em ${aba}`).not.toMatch(/Dabli/);
  }
  await expect(page.locator('.so-real').first(), 'bastidor, seguranca e sair somem').toBeHidden();
  /* p4.58: o laco agora termina na Semana; os passos da Mesa voltam a ela */
  await page.evaluate(()=>ir('mesa'));
  /* p4.53: com dado ficticio, Ok tira a peca de leitura e "Enviei por" tira a de envio; o estado muda so na memoria */
  const antes = await page.locator('#n-mesa').innerText();
  await page.evaluate(()=>msAbrirId(705)); await page.click('#msBtAprovar'); await page.evaluate(()=>enviar());
  await page.evaluate(()=>msAbrirId(701)); await page.click('#folha [data-canal="gmail"]'); await page.click('#msBt'); await expect(page.locator('#msBt'), 'sem print o 1o toque pede o print').toHaveText('Enviei sem print'); await page.click('#msBt');
  await expect.poll(()=>page.locator('#n-mesa').innerText()).not.toBe(antes);
  await page.click('#ms-raiz .ms-rel >> nth=0'); await page.click('#msRelPdf');
  await expect(page.locator('#tmsg')).toContainText('Relatório aberto');
  await page.evaluate(()=>{ fecharFolha(); ir('hoje'); abrirFila(0); });
  await expect(page.locator('#veu')).toBeVisible();
  await page.evaluate(()=>fecharFolha());
  expect(await page.evaluate(()=>window.__criou||0), 'createClient chamado na demonstracao').toBe(0);
  expect(await page.evaluate(()=>window.__rpc.length), 'o duble do banco nao recebe nada').toBe(0);
  expect(rede, 'nada sai para a rede').toEqual([]);
  expect(erros).toEqual([]);
});

test('Demonstracao: sair pede o codigo do app antes de qualquer dado real, mesmo com sessao aal2', async ({page})=>{
  const erros=[]; page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(DUBLE);
  await page.addInitScript(()=>{ try{sessionStorage.setItem('cerebro.demo.saida','1');}catch(e){} window.__aal='aal2'; window.__fatores=[{id:'f1',status:'verified',factor_type:'totp'}]; });
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA);
  await expect(page.locator('#fator')).toBeVisible();
  await expect(page.locator('#fatorTxt')).toContainText('sair da demonstração');
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length), 'nada carrega antes do codigo').toBe(0);
  await page.fill('#codFator','123456');
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit'));
  expect(await page.evaluate(()=>sessionStorage.getItem('cerebro.demo.saida')), 'a marca de saida some depois do codigo').toBeNull();
  expect(erros).toEqual([]);
});

test('Demonstracao: conta sem segundo fator sai da sessao ao deixar a demonstracao', async ({page})=>{
  await page.addInitScript(DUBLE);
  await page.addInitScript(()=>{ try{sessionStorage.setItem('cerebro.demo.saida','1');}catch(e){} window.__aal='aal1'; window.__fatores=[]; });
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA);
  await expect(page.locator('#login')).toBeVisible();
  await expect(page.locator('#lmsg')).toContainText('saiu da demonstração');
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length)).toBe(0);
});

test('Demonstracao: o bloco do modo nao carrega nome real nem endereco do banco (repositorio publico)', ()=>{
  const fonte = require('fs').readFileSync(path.resolve(__dirname,'..','presidente.html'),'utf8');
  const i = fonte.indexOf('/* modulo:demo'), f = fonte.indexOf('/* fim modulo:demo */');
  expect(i, 'bloco de demonstracao existe').toBeGreaterThan(0);
  const bloco = fonte.slice(fonte.indexOf('*/', i)+2, f);
  expect(bloco.length).toBeGreaterThan(3000);
  expect(bloco, 'endereco do banco no bloco').not.toMatch(/supabase\.co|@gmail|createClient\(URL_/);

  /* dono:"igor" e valor_igor sao contrato da tela (colunaDe, aCobrar), nao dado: saem antes da varredura */
  expect(nomesProibidos(bloco.replace(/dono:"igor"|valor_igor/g,' ')), 'nome real no bloco de demonstracao').toEqual([]);
  /* o detector detecta: um nome proibido conhecido, posto num texto, tem de ser achado */
  expect(PROIBIDOS.has(hashDe('kssvzrnjiqfgtvoifboj')), 'a lista de hashes confere com o id do projeto').toBe(true);
  expect(nomesProibidos('painel do projeto kssvzrnjiqfgtvoifboj'), 'o detector acha o id num texto').toEqual(['kssvzrnjiqfgtvoifboj']);
});

/* ---------- t3627 (17/10/2026): demonstracao pelo endereco, sem sessao, para o lancamento ----------
   O cerebro vai ao celular de convidados. Mostrar o painel real cruza o muro (LC-01); a demonstracao abre por
   presidente.html?demo=1 ou ?demo=2 sem login, como a conta de exemplo do Notion ou do Monday. A trava: o cliente do
   banco nem nasce (createClient arma uma bomba), nenhum pedido vai a um endereco do Supabase, nenhum websocket abre,
   e o texto de cada aba, nos dois perfis, passa pela mesma lista de nomes proibidos do fonte. */
const SUPABASE_RE = /supabase\.(co|in|io)|kssvzrnjiqfgtvoifboj/;
async function abrirDemoUrl(page, perfil){
  const erros=[], rede=[], ws=[];
  page.on('pageerror',e=>erros.push(String(e)));
  page.on('request',r=>{ const u=r.url(); if(!/^(file|data|blob|about):/.test(u))rede.push(u); });
  page.on('websocket',w=>ws.push(w.url()));
  await page.setViewportSize({width:390, height:844});
  /* sem duble de sessao: se a pagina chamar o cliente real, a bomba estoura e o teste conta */
  await page.addInitScript(()=>{ window.__criou=0; window.supabase={createClient:()=>{ window.__criou++; throw new Error('a demonstracao criou cliente do banco'); }}; });
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA+'?demo='+perfil);
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit') && !!document.querySelector('#kanban .item'));
  return {erros, rede, ws};
}

for (const perfil of [1,2]) test(`t3627 demo pelo endereco (perfil ${perfil}): sem sessao, nenhum pedido ao Supabase e nenhum nome real em aba nenhuma`, async ({page})=>{
  const {erros, rede, ws} = await abrirDemoUrl(page, perfil);
  await expect(page.locator('#demoAviso'), 'a demonstracao se anuncia').toBeVisible();
  await expect(page.locator('#demoAviso')).toContainText('Dados fictícios');
  await expect(page.locator(`#demoAviso [data-acao=demoPerfil][data-p="${perfil}"]`)).toHaveAttribute('aria-pressed','true');
  expect(await page.title(), 'a aba do navegador diz demonstracao').toMatch(/^Demonstração/);
  await expect(page.locator('#login'), 'nenhum login pedido').toBeHidden();
  const textos = [];
  for (const aba of ['hoje','fila','caixa','frentes','mesa','semana']) {
    await page.evaluate(a=>ir(a), aba);
    if(aba==='mesa') await page.waitForSelector('#ms-raiz .ms-item');
    await page.waitForTimeout(150);
    textos.push([aba, await page.evaluate(()=>document.body.innerText)]);
  }
  /* o card aberto tambem: a recomendacao so aparece inteira ali */
  await page.evaluate(()=>{ ir('hoje'); abrirFila(0); });
  await expect(page.locator('#veu')).toBeVisible();
  textos.push(['card', await page.evaluate(()=>document.body.innerText)]);
  await page.evaluate(()=>fecharFolha());
  for (const [aba, txt] of textos) {
    expect(nomesProibidos(txt), `nome real na tela, aba ${aba}`).toEqual([]);
    expect(txt, `marca ou endereco real na aba ${aba}`).not.toMatch(/Dabli|supabase|@gmail/i);
  }
  /* coerencia entre abas: o folego da Semana e o do Caixa sao a mesma conta */
  const c = await page.evaluate(()=>({rw:D.rw[0].dias_sobrevida_pior, sem:(D.semana.find(x=>x.ref==='caixa.sobrevida_dias')||{}).valor}));
  expect(c.sem, 'Semana e Caixa dizem o mesmo folego').toBe(c.rw);
  expect(await page.evaluate(()=>sessionStorage.getItem('cerebro.demo')), 'a marca fica na aba: tirar o ?demo nao abre o painel real').toBe('1');
  expect(await page.evaluate(()=>window.__criou), 'createClient chamado na demonstracao').toBe(0);
  expect(rede.filter(u=>SUPABASE_RE.test(u)&&!/cdn\.jsdelivr\.net/.test(u)), 'pedido ao Supabase').toEqual([]);
  expect(rede.filter(u=>!/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u)), 'nada sai para a rede').toEqual([]);
  expect(ws, 'nenhum websocket (Realtime) abre').toEqual([]);
  expect(erros).toEqual([]);
});

test('t3627 demo: os dois perfis tem dados proprios, e o detector de rede pega um pedido ao Supabase', async ({page})=>{
  const {rede} = await abrirDemoUrl(page, 1);
  const t1 = await page.evaluate(()=>document.body.innerText);
  /* a sonda: um pedido de verdade a um endereco do Supabase, feito pelo teste, tem de cair no filtro */
  await page.evaluate(()=>fetch('https://exemplo.supabase.co/rest/v1/sonda').catch(()=>{}));
  await expect.poll(()=>rede.filter(u=>SUPABASE_RE.test(u)).length, 'o filtro de rede enxerga o Supabase').toBe(1);
  await page.click('#demoAviso [data-acao=demoPerfil][data-p="2"]');
  await page.waitForURL(/\?demo=2$/);
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit'));
  const t2 = await page.evaluate(()=>document.body.innerText);
  await expect(page.locator('#demoAviso [data-acao=demoPerfil][data-p="2"]'), 'o seletor marca o perfil 2').toHaveAttribute('aria-pressed','true');
  const fila = await page.evaluate(()=>D.fila.map(x=>x.titulo));
  expect(fila.filter(x=>t1.includes(x)), 'o perfil 2 nao repete os cards do perfil 1').toEqual([]);
  expect(t2).not.toEqual(t1);
});

test('t3627 demo: sair da demonstracao aberta pelo endereco tira o ?demo e pede o codigo antes de dado real', async ({page})=>{
  const erros=[]; page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(DUBLE);
  await page.addInitScript(()=>{ window.__aal='aal2'; window.__fatores=[{id:'f1',status:'verified',factor_type:'totp'}];
    const c=window.supabase.createClient; window.supabase.createClient=(...a)=>{ window.__criou=(window.__criou||0)+1; return c(...a); }; });
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA+'?demo=2');
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit'));
  expect(await page.evaluate(()=>window.__criou||0), 'na demonstracao o cliente nao nasce').toBe(0);
  await page.click('#demoAviso [data-acao=demoSair]');
  await page.waitForURL(u=>!String(u).includes('demo='));
  await expect(page.locator('#fator')).toBeVisible();
  await expect(page.locator('#fatorTxt')).toContainText('sair da demonstração');
  await expect(page.locator('#demoAviso')).toBeHidden();
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length), 'nada real carrega antes do codigo').toBe(0);
  expect(erros).toEqual([]);
});

/* ---------- p4.14 (06/10/2026, s03): Hoje e Mesa numa fila so ----------
   Duas listas pediam o mesmo dono e a mesma acao aparecia nas duas (medido: 5 a 6 de 48 pecas eram o trabalho de um
   card aberto). A classe que se cobra: o mesmo trabalho nunca aparece duas vezes em Hoje, so entram as pecas da regra
   (novas + 3 de maior valor, adiada nunca), o tempo delas entra na conta do dia e a baixa que conclui o card avisa. */
const pecasNaHoje = page=>page.evaluate(()=>[...document.querySelectorAll('#ordem .peca-hoje .l2')].map(e=>e.textContent));

test('Hoje p4.14: entram as pecas novas e as 3 de maior valor; adiada e o resto ficam no estoque; o tempo delas soma no dia', async ({page})=>{
  const erros = await abrir(page);
  await expect.poll(()=>pecasNaHoje(page)).toEqual(['Laudo de exemplo','Medicao 7 de exemplo']);
  const r = await page.evaluate(()=>({sit:document.getElementById('situacao').textContent, selo:document.getElementById('n-hoje').textContent, n:hojeLista().length}));
  expect(r.sit).toContain('2 peças da Mesa');
  expect(r.selo, 'o selo de Hoje conta cards e pecas').toBe(String(r.n+2));
  await page.evaluate(()=>{ const m=JSON.parse(JSON.stringify(MS.dados)), h=m.hoje;
    const p=(id,rs,o)=>Object.assign({id,frente:'20-contrato-pj',titulo:'Peca '+id,ato:'enviar',dest:'Alguem',canal:'gmail',rs,dias:3,motivo:'x',copia:null,novo:false,peca:'pecas/'+id+'/peca_exemplo.pdf'},o||{});
    m.estoque=[p(201,900),p(202,800),p(203,700),p(204,600),p(205,99999,{adiado_ate:'2999-01-01'}),p(206,null)];
    window.__mesa=m; msCarregar(); });
  await expect.poll(()=>pecasNaHoje(page), 'top 3 por valor; adiada e sem valor fora').toEqual(['Peca 201','Peca 202','Peca 203']);
  const mins = await page.evaluate(()=>document.getElementById('situacao').textContent);
  expect(mins).toContain('3 peças da Mesa');
  await page.click('#ordem .peca-hoje >> nth=0');
  await expect(page.locator('#folhaTit'), 'a peca de Hoje abre a folha da Mesa').toHaveText('Peca 201');
  await expect(page.locator('#msBaixaBloco'), 'p4.53: peca de envio abre no Enviei por').toBeVisible();
  /* tempo: 3 pecas de envio = 45 min a mais que so os cards */
  const dif = await page.evaluate(()=>{ fecharFolha(); const so=MS.dados; const txt1=document.getElementById('situacao').textContent;
    MS.dados=null; renderHoje(); const txt0=document.getElementById('situacao').textContent; MS.dados=so; renderHoje();
    const h=t=>+((t.match(/cerca de ([\d,]+) h/)||[])[1]||'0').replace(',','.'); return Math.round((h(txt1)-h(txt0))*60); });
  expect(Math.abs(dif-45), 'tres envios somam 45 min (arredondado a 6 min)').toBeLessThanOrEqual(6);
  expect(erros).toEqual([]);
});

test('Hoje p4.15: peca sem ato (ainda nao triada) nao entra em Hoje, mesmo nova', async ({page})=>{
  const erros = await abrir(page);
  await expect.poll(()=>pecasNaHoje(page)).toHaveLength(2);
  await page.evaluate(()=>{ const m=JSON.parse(JSON.stringify(MS.dados));
    const p=(id,o)=>Object.assign({id,frente:'20-contrato-pj',titulo:'Entrada '+id,ato:null,dest:null,canal:null,rs:null,dias:0,motivo:null,copia:null,novo:true,peca:null},o||{});
    m.estoque=[p(301),p(302),p(303,{rs:50000,novo:false}),p(304,{ato:'ler',titulo:'Triada 304'})]; window.__mesa=m; msCarregar(); });
  await expect.poll(()=>pecasNaHoje(page), 'so a triada entra').toEqual(['Triada 304']);
  expect(erros).toEqual([]);
});

test('Hoje p4.14: card e peca ligados aparecem uma vez; a folha do card abre a peca; a baixa que conclui o card avisa e recarrega', async ({page})=>{
  const erros = await abrir(page);
  await expect.poll(()=>pecasNaHoje(page)).toHaveLength(2);
  await page.evaluate(()=>{ const m=JSON.parse(JSON.stringify(MS.dados));
    m.estoque=m.estoque.map(p=>p.id===102?Object.assign(p,{tarefa:2,fecha_tarefa:true}):p); window.__mesa=m; msCarregar(); });
  await expect.poll(()=>pecasNaHoje(page), 'a peca ligada ao card de Hoje nao repete').toEqual(['Medicao 7 de exemplo']);
  await expect(page.locator('#foco')).toContainText('com peça da Mesa');
  await page.evaluate(()=>abrirFila(0));
  await expect(page.locator('#folha')).toContainText('Peça da Mesa ligada a este card');
  await expect(page.locator('#folha')).toContainText('conclui este card');
  await page.click('#folha .ms-ligada');
  await expect(page.locator('#folhaTit')).toHaveText('Laudo de exemplo');
  const montar0 = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_snapshot_montar').length);
  await page.evaluate(()=>{ window.__baixa='OK: baixa gravada (envio 7); card 2 concluido junto'; });
  await page.click('#folha [data-canal="whatsapp"]');
  await page.click('#msBt'); await expect(page.locator('#msBt'), 'sem print o 1o toque pede o print').toHaveText('Enviei sem print'); await page.click('#msBt');
  await expect(page.locator('#tmsg')).toContainText('O card ligado foi concluído junto.');
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_snapshot_montar').length), 'a fila recarrega do banco').toBeGreaterThan(montar0);
  /* o mesmo trabalho nunca duas vezes: nenhuma peca de Hoje aponta para card que esta em Hoje */
  const dup = await page.evaluate(()=>{ const cards=new Set(hojeLista().filter(f=>f.origem==='tarefa').map(f=>String(f.ref)));
    return pecasHoje().filter(p=>p.tarefa!=null&&cards.has(String(p.tarefa))).map(p=>p.id); });
  expect(dup).toEqual([]);
  expect(erros).toEqual([]);
});

/* p4.16 (06/10/2026, pedido do Igor): a prova do card tambem vai como print ou PDF, anexado ou colado (Ctrl+V).
   O arquivo so sobe quando o ato vai ao banco (depois dos 8 s de desfazer), para o bucket privado mesa-provas,
   e o caminho entra no texto da prova. O codigo p4.15 nao tinha campo de arquivo: estes testes reprovam nele. */
test('Card p4.16: print anexado sobe para mesa-provas so no envio e o caminho entra na prova', async ({page})=>{
  const erros = await abrir(page);
  await page.click('#foco .pri');
  await page.setInputFiles('#cvArq', {name:'print.PNG', mimeType:'image/png', buffer:Buffer.from('png')});
  await expect(page.locator('#cvArqNome')).toContainText('print.PNG');
  await page.fill('#cv','enviado ao fiscal');
  await page.click('#campo .pri');
  await expect(page.locator('#tmsg')).toContainText('Concluído com anexo');
  let up = await page.evaluate(()=>window.__storage.filter(c=>c.op==='upload'));
  expect(up, 'dentro dos 8 s nada sobe').toEqual([]);
  await page.evaluate(()=>enviar());
  up = await page.evaluate(()=>window.__storage.filter(c=>c.op==='upload'));
  expect(up).toHaveLength(1);
  expect(up[0]).toMatchObject({b:'mesa-provas',op:'upload',tipo:'image/png'});
  expect(up[0].p).toMatch(/^\d{4}-\d{2}\/card_tarefa_2_\d+\.png$/);
  const agir = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').map(c=>c.a));
  expect(agir).toEqual([{p_origem:'tarefa',p_ref:'2',p_verbo:'feita',p_valor:'enviado ao fiscal · anexo mesa-provas/'+up[0].p}]);
  expect(erros).toEqual([]);
});

test('Card p4.16: print colado no campo basta como prova, sem texto', async ({page})=>{
  const erros = await abrir(page);
  await page.click('#foco .pri');
  await page.evaluate(()=>{ const dt=new DataTransfer(); dt.items.add(new File(['x'],'image.png',{type:'image/png'}));
    document.getElementById('cv').dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true})); });
  await expect(page.locator('#cvArqNome')).toContainText('print-colado.png');
  await expect(page.locator('#cv'), 'o print nao vira texto no campo').toHaveValue('');
  await page.click('#campo .pri');
  await page.evaluate(()=>enviar());
  const r = await page.evaluate(()=>({up:window.__storage.filter(c=>c.op==='upload'), agir:window.__rpc.filter(c=>c.n==='agir').map(c=>c.a.p_valor)}));
  expect(r.up).toHaveLength(1);
  expect(r.agir).toEqual(['anexo mesa-provas/'+r.up[0].p]);
  expect(erros).toEqual([]);
});

test('Card p4.16: desfazer nao sobe o print; upload que falha nao conclui o card', async ({page})=>{
  const erros = await abrir(page);
  await page.click('#foco .pri');
  await page.setInputFiles('#cvArq', {name:'comprovante.pdf', mimeType:'application/pdf', buffer:Buffer.from('%PDF')});
  await page.click('#campo .pri');
  await page.click('#tbtn');
  await page.waitForTimeout(100);
  let r = await page.evaluate(()=>({up:window.__storage.filter(c=>c.op==='upload'), agir:window.__rpc.filter(c=>c.n==='agir')}));
  expect(r, 'desfeito: nada sobe e nada grava').toEqual({up:[], agir:[]});
  await page.evaluate(()=>{ sb.storage.from=()=>({upload:()=>Promise.resolve({data:null,error:{message:'sem rede'}})}); abrirFila(0); escolher('feita'); });
  await page.setInputFiles('#cvArq', {name:'comprovante.pdf', mimeType:'application/pdf', buffer:Buffer.from('%PDF')});
  await page.click('#campo .pri');
  await page.evaluate(()=>enviar());
  await expect(page.locator('#tmsg')).toContainText('O print não subiu (sem rede). O card não foi concluído.');
  r = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir'));
  expect(r, 'sem o arquivo, o ato nao vai ao banco').toEqual([]);
  expect(erros).toEqual([]);
});

test('Mesa p4.16: ordena por data e filtra por frente, com a contagem certa', async ({page})=>{
  const erros = await abrirMesa(page);
  const ids = ()=>page.evaluate(()=>[...document.querySelectorAll('#ms-raiz .pilha .ms-item')].map(b=>+b.dataset.a1));
  expect(await ids(), 'padrao: a ordem do banco').toEqual([101,102,103]);
  await expect(page.locator('#msOrdem')).toHaveValue('valor');
  await page.selectOption('#msOrdem','recentes');
  expect(await ids()).toEqual([103,102,101]);
  await page.selectOption('#msOrdem','antigas');
  expect(await ids()).toEqual([101,102,103]);
  await expect(page.locator('#msFrente option')).toHaveText(['Todas (3)','Contrato PJ (1)','Renda Alternativa (1)','Sem frente (1)']);
  await page.selectOption('#msFrente','11-renda-alt');
  expect(await ids()).toEqual([102]);
  await expect(page.locator('#ms-raiz .ms-filtro-n')).toHaveText('Mostrando 1 de 3: só Renda Alternativa.');
  await expect(page.locator('#ms-raiz .ms-dia'), 'o topo continua contando a mesa inteira').toContainText('3 peças esperam');
  await page.selectOption('#msFrente','');
  expect(await ids()).toHaveLength(3);
  await expect(page.locator('#ms-raiz .ms-filtro-n')).toHaveCount(0);
  const salvo = await page.evaluate(()=>{ try{ return [localStorage.getItem('mesa.ordem'),localStorage.getItem('mesa.frente')]; }catch(e){ return null; } });
  if(salvo)expect(salvo, 'a escolha fica no aparelho').toEqual(['antigas','']);
  expect(erros).toEqual([]);
});

test('Mesa p4.16: o filtro cabe a 360 px sem rolagem lateral e com alvo de toque de 44 px', async ({page})=>{
  await page.setViewportSize({width:360, height:820});
  const erros = await abrirMesa(page);
  const r = await page.evaluate(()=>({larg:document.documentElement.scrollWidth,
    alt:[...document.querySelectorAll('#msOrdem,#msFrente')].map(s=>Math.round(s.getBoundingClientRect().height)),
    dentro:[...document.querySelectorAll('#msOrdem,#msFrente')].every(s=>s.getBoundingClientRect().right<=360)}));
  expect(r.alt, "os dois controles existem").toHaveLength(2);
  expect(r.larg).toBeLessThanOrEqual(360);
  expect(Math.min(...r.alt)).toBeGreaterThanOrEqual(44);
  expect(r.dentro).toBe(true);
  expect(erros).toEqual([]);
});

/* p4.17 (06/10/2026): o Igor aprovou 3 pecas de envio de um cliente e achou que nada tinha acontecido: a folha fechava
   e a peca voltava igual, com o botao Aprovar. Agora a aprovada mostra "aprovada, falta enviar", a folha fica aberta
   e desce ate "Ja enviei". O p4.16 reprova aqui. */
test('Mesa p4.53: aprovada vem do campo aprovada_em do banco, nunca do texto do motivo', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.evaluate(()=>{ MS.dados.estoque[1].aprovada_em=new Date().toISOString(); MS.dados.estoque[2].motivo='aprovado por voce em 06/10 16:11; falta assinar'; msRender(); });
  await expect(page.locator('#ms-raiz .ms-item >> nth=1')).toContainText('aprovada, falta enviar');
  await expect(page.locator('#ms-raiz .ms-item >> nth=2'), 'texto parecido no motivo nao vira estado').not.toContainText('aprovada, falta');
  await page.click('#ms-raiz .ms-item >> nth=1');
  await expect(page.locator('#msAprovada')).toContainText('Aprovada por você em');
  await expect(page.locator('#msBaixaBloco')).toBeVisible();
  expect(erros).toEqual([]);
});


/* p4.19 (06/10/2026, plano 84): a decisao da Mesa era o unico toque do painel sem volta: aprovar, ajustar, adiar e
   largar gravavam na hora. Agora esperam 6 s com desfazer, como os atos da folha. O p4.18 reprova aqui: o toque
   gravava antes do prazo e o desfazer nao existia. */
test('Mesa p4.19: decisão espera 8 s com desfazer; desfazer devolve a peça com a nota', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.clock.install();
  await page.click('#ms-raiz .ms-item >> nth=1');
  await page.click('#msAbreAjustar');
  await page.fill('#msTxtAjustar','Trocar a data da capa');
  await page.click('#msBtAjustar');
  await expect(page.locator('#veu'), 'a folha sai na hora').toBeHidden();
  await expect(page.locator('#tbtn'), 'com desfazer').toBeVisible();
  await expect(page.locator('#tmsg')).toContainText('Ajuste pedido: Laudo de exemplo');
  await page.clock.fastForward(5500);
  expect(await deliberacoes(page), 'nada vai antes dos 8 s').toEqual([]);
  await page.click('#tbtn');
  await expect(page.locator('#veu'), 'desfazer devolve a peça').toBeVisible();
  await expect(page.locator('#folhaTit')).toHaveText('Laudo de exemplo');
  await expect(page.locator('#msTxtAjustar'), 'com a nota escrita').toHaveValue('Trocar a data da capa');
  await expect(page.locator('#tmsg')).toHaveText('Desfeito. Nada foi gravado.');
  await page.clock.fastForward(7000);
  expect(await deliberacoes(page), 'o desfeito nao grava nunca').toEqual([]);
  /* sem desfazer, grava depois do prazo */
  await page.click('#msBtAjustar');
  await page.clock.fastForward(6100);
  await expect.poll(()=>deliberacoes(page)).toEqual([{p_doc:102,p_decisao:'ajustar',p_nota:'Trocar a data da capa'}]);
  await expect(page.locator('#tmsg')).toContainText('Pedido de ajuste gravado.');
  expect(erros).toEqual([]);
});

test('Mesa p4.19: recusa do banco depois do prazo devolve a peça com o aviso; a baixa grava antes a decisão que espera', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.clock.install();
  await page.evaluate(()=>{ window.__deliberar='RECUSADO: doc 101 ja saiu da mesa'; });
  await page.click('#ms-raiz .ms-item >> nth=0');
  await page.click('#msBtAprovar');
  await expect(page.locator('#veu')).toBeHidden();
  await page.clock.fastForward(6100);
  await expect(page.locator('#veu'), 'a peca volta').toBeVisible();
  await expect(page.locator('#msAvisoDec')).toContainText('Não gravou: doc 101 ja saiu da mesa');
  await expect(page.locator('#toast')).toHaveClass(/bad/);
  /* Ok numa peca e "Enviei por" noutra dentro dos 8 s: o Ok vai primeiro */
  await page.evaluate(()=>{ fecharFolha(); window.__deliberar='OK: aprovado'; });
  await page.click('#ms-raiz .ms-item >> nth=0');
  await page.click('#msBtAprovar');
  await page.click('#ms-raiz .ms-item >> nth=1');
  await page.click('#folha .ms-canal >> nth=0');
  await page.fill('#msDest','Cliente de exemplo');
  await page.click('#msBt'); await expect(page.locator('#msBt'), 'sem print o 1o toque pede o print').toHaveText('Enviei sem print'); await page.click('#msBt');
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>/^mesa_(deliberar|baixa_painel)$/.test(c.n)).map(c=>c.n+':'+(c.a.p_doc)))).toEqual(['mesa_deliberar:101','mesa_deliberar:101','mesa_baixa_painel:102']);
  expect(erros).toEqual([]);
});

/* t2308 (s3056, 12/10/2026; onda 2 da auditoria da Mesa, doc 4005, decisao 2 do Igor): dois caminhos por tipo de peca.
   A p4.51 reprova aqui: "Aprovar" num envio deixava a peca na mesa sem baixa, a folha de leitura trazia "Ja enviei", e
   a Mesa tinha ciencia do dia, lote, Lidos, Arquivo, ritual e regua da hora. */
test('t2308: peca de envio so sai da Mesa pelo "Enviei por", que aprova e da a baixa', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.click('#ms-raiz .ms-item >> nth=1');
  await expect(page.locator('#msBaixaBloco')).toBeVisible();
  await expect(page.locator('#msBtAprovar'), 'nenhum botao aprova envio sem baixa').toHaveCount(0);
  await expect(page.locator('#folha .ms-decisoes button')).toHaveText(['Ajustar','Adiar','Descartar']);
  await page.evaluate(()=>msDecidir('aprovado'));
  await expect(page.locator('#msAvisoDec')).toContainText('Enviei por');
  await page.waitForTimeout(150); await page.evaluate(()=>{ if(PEND)enviar(); });
  expect(await deliberacoes(page), 'aprovar envio pela tela nao vai ao banco').toEqual([]);
  await expect(page.locator('#msBt')).toHaveText('Enviei por…');
  await page.click('#folha [data-canal="whatsapp"]');
  await expect(page.locator('#msBt')).toHaveText('Enviei por WhatsApp');
  await page.click('#msBt'); await expect(page.locator('#msBt'), 'sem print o 1o toque pede o print').toHaveText('Enviei sem print'); await page.click('#msBt');
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_baixa_painel').map(c=>c.a.p_doc))).toEqual([102]);
  await expect(page.locator('#veu')).toBeHidden();
  expect(erros).toEqual([]);
});
test('t2308: peca de leitura ou decisao nao mostra o bloco de envio', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.click('#ms-raiz .ms-item >> nth=0');
  await expect(page.locator('#msBaixaBloco'), 'sem Ja enviei em peca de leitura').toHaveCount(0);
  await expect(page.locator('#folha .ms-canal')).toHaveCount(0);
  await expect(page.locator('#msDest')).toHaveCount(0);
  await expect(page.locator('#folha .ms-decisoes button')).toHaveText(['Aprovar','Ajustar','Adiar','Descartar']);
  const folha = await page.locator('#folha').innerText();
  expect(folha).not.toMatch(/Já enviei|Dar baixa|Para quem/);
  expect(erros).toEqual([]);
});
test('t2308: a Mesa nao tem ciencia do dia, lote, Lidos, Arquivo, ritual nem regua da hora', async ({page})=>{
  const erros = await abrirMesa(page);
  for (const sel of ['#msBtEncerrar','#msBtLote','#msLidos','#msArquivo','.ms-hora','.ms-fecho']) await expect(page.locator('#ms-raiz '+sel), sel).toHaveCount(0);
  const txt = await page.locator('#p-mesa').innerText();
  expect(txt).not.toMatch(/ciência|Encerrar o dia|Sua hora|Neste mês|piso R\$/i);
  await page.click('#ms-raiz .ms-rel >> nth=0');
  await expect(page.locator('#msBtCiencia')).toHaveCount(0);
  await expect(page.locator('#folha')).not.toContainText('ciência');
  const fonte = require('fs').readFileSync(path.resolve(__dirname,'..','presidente.html'),'utf8');
  expect(fonte, 'o painel nao chama mais a ciencia').not.toMatch(/rpc\("mesa_ciencia/);
  expect(fonte, 'o estado aprovada nao se le do texto do motivo').not.toMatch(/aprovado por voce em \(/);
  expect(erros).toEqual([]);
});
test('t2308: na demonstracao a 390 px cada peca da Mesa se resolve numa visita so', async ({page})=>{
  const {erros} = await abrirDemo(page, 390);
  await page.evaluate(()=>ir('mesa'));
  await page.waitForSelector('#ms-raiz .ms-item');
  const n0 = await page.evaluate(()=>msPend(MS.dados).length);
  expect(n0, 'a demonstracao tem pecas de leitura e de envio').toBeGreaterThan(3);
  let visitas = 0;
  for (let i = 0; i < n0; i++) {
    const antes = await page.evaluate(()=>msPend(MS.dados).length);
    await page.click('#ms-raiz > .pilha .ms-item >> nth=0'); visitas++;
    const m = await page.evaluate(()=>({W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth}));
    expect(m.SW, 'folha sem rolagem lateral a 390 px').toBe(m.W);
    if (await page.locator('#msBtAprovar').count()) { await page.click('#msBtAprovar'); await page.evaluate(()=>{ if(PEND)enviar(); }); }
    else { await page.click('#folha .ms-canal >> nth=0'); if(!(await page.inputValue('#msDest')).trim()) await page.fill('#msDest','Cliente ficticio'); await page.click('#msBt'); await expect(page.locator('#msBt'), 'sem print o 1o toque pede o print').toHaveText('Enviei sem print'); await page.click('#msBt'); }
    await expect.poll(()=>page.evaluate(()=>msPend(MS.dados).length), 'a peca sai da mesa na primeira visita').toBe(antes-1);
  }
  expect(visitas, 'uma visita por peca').toBe(n0);
  await expect(page.locator('#ms-raiz')).toContainText('Nenhuma peça espera você');
  expect(erros).toEqual([]);
});

/* p4.20 (06/10/2026, plano 85): a conferencia de versao baixava o presidente.html inteiro (186 KB) a cada carga, e
   a carga roda depois de todo ato. Agora le o version.json so na abertura e quando a aba volta. O p4.19 reprova
   aqui: o ato refazia o GET da pagina. */
test('p4.20: um ato nao baixa a pagina de novo; a versao vem do version.json na abertura e ao voltar a aba', async ({page})=>{
  await page.addInitScript(()=>{ window.__get=[]; const f=window.fetch.bind(window);
    window.fetch=(u,...a)=>{ window.__get.push(String(u)); return f(u,...a); }; });
  await abrir(page);
  const gets = re=>page.evaluate(r=>window.__get.filter(u=>new RegExp(r).test(u)).length, re);
  await expect.poll(()=>gets('version\\.json'), 'a abertura confere uma vez').toBe(1);
  const cargas0 = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length);
  await page.click('#foco .pri');
  await page.fill('#cv','e-mail do fiscal 08/10');
  await page.click('#campo .pri');
  await page.evaluate(()=>enviar());
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length), 'o ato recarrega').toBeGreaterThan(cargas0);
  await page.waitForTimeout(200);
  expect(await gets('presidente\\.html'), 'nunca baixa a pagina para conferir versao').toBe(0);
  expect(await gets('version\\.json'), 'o ato nao confere a versao').toBe(1);
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await expect.poll(()=>gets('version\\.json'), 'a aba que volta confere de novo').toBe(2);
});

test('p4.20: version.json acompanha o VERP do presidente.html', ()=>{
  const fs = require('fs'), raiz = path.resolve(__dirname,'..');
  const v = JSON.parse(fs.readFileSync(path.join(raiz,'version.json'),'utf8'));
  const verp = fs.readFileSync(path.join(raiz,'presidente.html'),'utf8').match(/const VERP="([^"]+)"/)[1];
  expect(v.presidente, 'VERP novo sem o version.json faz a pagina oferecer a versao velha').toBe(verp);
});

/* p4.21 (06/10/2026, plano 86): o topo da folha mostrava "t2" num chip e o aviso do ato dizia "Concluí · t2". Codigo
   interno nao e lingua do Igor: sai do topo e do aviso e fica so no Historico, onde ele o procura para falar com o
   atendente. O p4.20 reprova aqui. */
test('p4.21: codigo interno so no Historico; chip e aviso do ato falam pelo titulo', async ({page})=>{
  const erros = await abrir(page);
  await page.click('#foco .pri');
  await expect(page.locator('#folhaTit')).toHaveText('Card de exemplo');
  const topo = await page.locator('#folha .chips').innerText();
  expect(topo, 'sem codigo no topo').not.toMatch(/\bt\s?2\b|\btarefa\s?2\b/);
  await expect(page.locator('#folha .cod-interno'), 'o codigo mora no Historico').toHaveText('Código interno: t2');
  await page.fill('#cv','e-mail do fiscal 08/10');
  await page.click('#campo .pri');
  const aviso = await page.locator('#tmsg').innerText();
  expect(aviso, 'aviso pelo titulo').toContain('Card de exemplo');
  expect(aviso, 'sem codigo no aviso').not.toMatch(/\bt2\b/);
  expect(erros).toEqual([]);
});

/* p4.22 (06/10/2026, plano 83): 16 tamanhos de letra soltos no presidente e 28 no bastidor; 17 de 45 textos da aba
   Hoje tinham 12 ou 13 px. Agora sao 5 degraus em token (12/14/16/20/28), com piso de 14 px na tela do Igor e de
   12 px no bastidor. O p4.21 reprova aqui. */
test('p4.22: todo tamanho de letra sai da escala de 5 degraus; presidente e seguranca sem o degrau de 12 px', ()=>{
  const fs = require('fs'), raiz = path.resolve(__dirname,'..');
  /* p4.23: a escala mora no tokens.css, que as tres paginas ligam (teste de carimbo acima) */
  const tok = fs.readFileSync(path.join(raiz,'tokens.css'),'utf8');
  const raiz_ = tok.match(/--fs-1:(\d+)px; --fs-2:(\d+)px; --fs-3:(\d+)px; --fs-4:(\d+)px; --fs-5:(\d+)px;/);
  expect(raiz_ && raiz_.slice(1).map(Number), 'escala no tokens.css').toEqual([12,14,16,20,28]);
  for (const [arq, piso] of [['presidente.html',2],['seguranca.html',2],['index.html',1]]) {
    const src = fs.readFileSync(path.join(raiz,arq),'utf8');
    const usos = [...src.matchAll(/font-size:\s*([^;}"']+)/g)].map(m=>m[1].trim());
    const soltos = usos.filter(v=>!/^var\(--fs-[1-5]\)$/.test(v) && v!=='inherit' && !/^[\d.]+em$/.test(v));
    expect(soltos, arq+': tamanho fora da escala').toEqual([]);
    const abaixo = usos.filter(v=>{ const m=v.match(/^var\(--fs-(\d)\)$/); return m && +m[1]<piso; });
    expect(abaixo, arq+': degrau abaixo do piso').toEqual([]);
  }
});

test('p4.22: nenhum texto abaixo de 14 px nas cinco abas e na folha do presidente', async ({page})=>{
  const erros = await abrir(page);
  const medir = ()=>page.evaluate(()=>{
    const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';};
    const out=[]; let n=0;
    for (const e of document.querySelectorAll('body *')) {
      if (!vis(e)) continue;
      const temTexto=[...e.childNodes].some(c=>c.nodeType===3&&c.textContent.trim());
      if (!temTexto) continue;
      n++;
      const fs=parseFloat(getComputedStyle(e).fontSize);
      if (fs<14) out.push(fs+'px '+e.tagName+'.'+e.className+' '+e.textContent.trim().slice(0,30));
    }
    return {n,out};
  });
  for (const aba of ['hoje','fila','caixa','frentes','mesa','semana']) {
    await page.evaluate(a=>ir(a), aba);
    if (aba==='mesa') await page.waitForSelector('#ms-raiz .ms-item');
    const r = await medir();
    expect(r.n, 'a aba '+aba+' tem texto medido').toBeGreaterThan(5);
    expect(r.out, 'texto abaixo de 14 px em '+aba).toEqual([]);
  }
  await page.evaluate(()=>{ ir('hoje'); abrirFila(0); });
  const f = await medir();
  expect(f.out, 'texto abaixo de 14 px na folha').toEqual([]);
  expect(erros).toEqual([]);
});
/* p4.24 (plano 82b, 07/10/2026): aba e coluna atuais se leem por aria-current e aria-selected,
   que ja existiam ao lado da classe .on. Dois donos do mesmo estado: sobrou so o atributo. */
test('82b: aba e coluna atuais se leem por atributo ARIA, sem classe .on', async ({page})=>{
  await abrir(page);
  const r = await page.evaluate(()=>{
    ir('fila');
    const nav = [...document.querySelectorAll('[data-aba]')];
    const seg = [...document.querySelectorAll('#seg button')];
    const sel = seg.filter(b=>b.getAttribute('aria-selected')==='true');
    return {
      atual: [...new Set(nav.filter(b=>b.getAttribute('aria-current')==='page').map(b=>b.dataset.aba))],
      comClasse: document.querySelectorAll('[data-aba].on,#seg button.on').length,
      nSeg: seg.length, nSel: sel.length,
      fundoSel: sel[0] && getComputedStyle(sel[0]).backgroundColor,
      fundoOutro: getComputedStyle(seg.find(b=>b!==sel[0])).backgroundColor
    };
  });
  expect(r.atual).toEqual(['fila']);
  expect(r.comClasse, 'nenhum estado de selecao por classe').toBe(0);
  expect(r.nSeg, 'a fila desenhou as colunas').toBeGreaterThan(1);
  expect(r.nSel).toBe(1);
  expect(r.fundoSel, 'a coluna atual pinta --acc pelo aria-selected').toBe('rgb(47, 128, 255)');
  expect(r.fundoOutro).not.toBe(r.fundoSel);
});

/* v82 / p4.25 (plano 87a, 07/10/2026): esc, escAttr, urlSegura e rs moram num bloco comum:escapa,
   igual byte a byte nas duas paginas, e em nenhum outro lugar. O rs do index mostrava "R$ NaN" para
   valor que nao e numero; o do presidente ja dava "—". Dois donos do mesmo formato: sobrou um. */
test('87a: escape e reais num bloco comum so, e rs nao mostra NaN', async ({page})=>{
  const fs = require('fs');
  const ler = a=>fs.readFileSync(path.resolve(__dirname,'..',a),'utf8');
  const bloco = s=>(s.match(/\/\* comum:escapa [^\n]*\*\/\r?\n([\s\S]*?)\/\* fim comum:escapa \*\//)||[])[1];
  const fora = s=>s.replace(/\/\* comum:escapa [\s\S]*?\/\* fim comum:escapa \*\//,'');
  for (const a of ['index.html','presidente.html']) {
    const s = ler(a), b = bloco(s);
    expect(b, a+' tem o bloco comum:escapa').toBeTruthy();
    for (const f of ['esc','escAttr','urlSegura','rs'])
      expect(b, a+': '+f+' no bloco').toMatch(new RegExp('^const '+f+'=', 'm'));
    expect(fora(s).match(/^\s*const (esc|escAttr|urlSegura|rs)\s*=\s*[a-z]\s*=>/gm), a+': definicao fora do bloco').toBeNull();
  }
  expect(bloco(ler('index.html'))).toBe(bloco(ler('presidente.html')));
  await abrir(page);
  const r = await page.evaluate(()=>[rs(NaN), rs('abc'), rs(null), rs(undefined), rs(12345.6), rs(-1234.4), rs('900')]);
  expect(r).toEqual(['—','—','—','—','R$ 12.346','-R$ 1.234','R$ 900']);
});

/* p4.26 (plano 87b, 07/10/2026): nenhum handler inline no presidente. A acao mora em data-acao e
   afins, o argumento em data-a1..a3 (escapado por esc), e o registro ACOES e a lista fechada do que a
   tela faz. Sem JS dentro de atributo, a aspa hostil nao tem onde fechar argumento, e o unsafe-inline
   pode sair do script-src no fecho do plano 87. */
test('87b: nenhum handler inline no presidente; toda acao da tela esta no registro e o clique anda', async ({page})=>{
  const fs = require('fs');
  const fonte = fs.readFileSync(path.resolve(__dirname,'..','presidente.html'),'utf8');
  expect(fonte.match(/\son[a-z]+\s*=\s*["']/gi), 'on*= no fonte').toBeNull();
  const erros = await abrir(page);
  const r = await page.evaluate(()=>{
    const inline = new Set(), sem = new Set(); let n = 0;
    const varrer = ()=>{ for (const el of document.querySelectorAll('*')) {
      for (const a of el.attributes) if (/^on/i.test(a.name)) inline.add(el.tagName+' '+a.name);
      for (const k of ['acao','aoDigitar','aoMudar','aoTecla','aoColar']) { const v = el.dataset[k];
        if (v !== undefined) { n++; if (!Object.prototype.hasOwnProperty.call(ACOES, v)) sem.add(v); } } } };
    for (const aba of ['hoje','fila','caixa','frentes','mesa','semana']) { ir(aba); varrer(); }
    abrirFila(0); varrer(); fecharFolha();
    ir('hoje');
    document.querySelector('[data-acao="ir"][data-a1="fila"]').click();
    const aberta = document.querySelector('[data-aba="fila"]').getAttribute('aria-current');
    const seg = [...document.querySelectorAll('#seg button')], alvo = seg[seg.length-1];
    alvo.click();  /* o clique redesenha a fila: o botao certo se le de novo */
    const depois = [...document.querySelectorAll('#seg button')];
    return {inline:[...inline], sem:[...sem], n, aberta, coluna:depois[depois.length-1].getAttribute('aria-selected')};
  });
  expect(r.inline, 'atributo on* no DOM desenhado').toEqual([]);
  expect(r.sem, 'acao sem registro').toEqual([]);
  expect(r.n, 'varreu as acoes das cinco abas e da folha').toBeGreaterThan(20);
  expect(r.aberta, 'o clique delegado troca a aba').toBe('page');
  expect(r.coluna, 'o clique delegado troca a coluna da fila').toBe('true');
  expect(erros).toEqual([]);
});

/* p4.27 (plano 89, 07/10/2026): numero com contexto, no molde do painel da Stripe. O folego da frase do Hoje e do
   topo do Caixa diz quanto andou contra a semana anterior (v_painel_variacao_7d, chave var7) e o toque abre a lista
   que o compoe; o saldo da pior semana tambem. A classe que se cobra: numero sem a lista que o explica e numero cuja
   lista nao fecha com ele. A p4.26 reprova: o numero era <b>, sem toque e sem variacao. */
test('p4.27: folego e pior semana com variacao de 7 dias; o toque abre a lista que fecha com o numero', async ({page})=>{
  await page.addInitScript(()=>{
    const p=n=>String(n).padStart(2,'0'), dd=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());};
    const it=(id,natureza,dia,semana,valor_igor,descricao,status,peso)=>({id,natureza,data_venc:dd(dia),vencido:dia<0,semana,valor_igor,descricao,frente_slug:'20-contrato-pj',status:status||'confirmado',peso:peso==null?1:peso});
    const c13i=[it(41,'receber',-1,1,1400,'Laudo L1'),it(42,'receber',9,2,10000,'Proposta incerta','incerto',0.5),it(43,'receber',52,8,5000,'Entrada fora da pior semana'),
      it(51,'pagar',3,1,30000,'Folha de exemplo'),it(52,'pagar',-2,1,1500,'Fornecedor incerto','incerto'),it(53,'pagar',10,2,8311.19,'Aluguel de exemplo'),it(54,'pagar',45,7,2000,'Seguro fora dos 30 dias')];
    let acum=36271; const c13=[1,2,3,4,5,6,7].map(k=>{ const w=c13i.filter(x=>x.semana===k);
      acum+=w.reduce((t,x)=>t+(x.natureza==='receber'?x.valor_igor*(x.status==='incerto'?x.peso:1):-x.valor_igor),0)-2800;
      return {semana:k,inicio:dd(7*(k-1)),saldo_base:Math.round(acum*100)/100,sai_firme:500,caixa_hoje:36271,custo_vida:2800}; });
    window.__dados={c13,c13i,rw:[{dias_sobrevida_pior:13,caixa_hoje:36271,saida_firme_30d:38311.19,saida_incerta_30d:1500,custo_vida_pf:12000}],
      var7:[{metrica:'caixa.sobrevida_dias',agora:13,ha_7d:8,data_base:'2026-09-30'},{metrica:'caixa.menor_saldo_13s',agora:null,ha_7d:null,data_base:null}]};
  });
  const erros = await abrir(page);
  const sit = page.locator('#situacao');
  await expect(sit, 'a frase diz quanto o folego andou').toContainText('13 dias no pior cenário, +5 dias desde 30/09');
  await sit.locator('button[data-acao="abrirFolego"]').click();
  const folha = page.locator('#folha');
  await expect(folha.locator('#folhaTit')).toHaveText('O caixa aguenta 13 dias no pior cenário');
  await expect(folha, 'a variacao vai junto na folha').toContainText('+5 dias desde 30/09');
  await expect(folha, 'so os pagamentos dos 30 dias, com a soma da conta').toContainText('3 pagamentos até');
  await expect(folha).toContainText('R$ 39.811');
  await expect(folha).not.toContainText('Seguro fora dos 30 dias');
  await expect(folha.locator('.aviso'), 'lista e conta fecham').toHaveCount(0);
  await page.evaluate(()=>{ fecharFolha(); ir('caixa'); });
  const topo = page.locator('#caixaTopo');
  await expect(topo.locator('button[data-acao="abrirFolego"]')).toHaveText('13 dias');
  await expect(topo, 'menor saldo sem base de 7 dias diz que nao ha base').toContainText('sem leitura de 7 dias atrás');
  await topo.locator('button[data-acao="abrirPiorSemana"]').click();
  await expect(folha.locator('#folhaTit')).toContainText('-R$ 18.740');
  await expect(folha, 'a conta da pior semana fecha no saldo').toContainText('menos o custo de vida de 7 semanas');
  await expect(folha.locator('.aviso')).toHaveCount(0);
  await expect(folha).toContainText('2 entradas');
  await expect(folha).toContainText('4 saídas');
  await expect(folha, 'item depois da pior semana fica fora').not.toContainText('Entrada fora da pior semana');
  await expect(folha, 'incerta mostra o peso').toContainText('incerta, conta 50%');
  /* a guarda: conta e lista que nao fecham sao ditas, nunca caladas */
  const avisos = await page.evaluate(()=>{ fecharFolha(); D.rw[0].saida_firme_30d=40000; abrirFolego(); const a=document.querySelectorAll('#folha .aviso').length;
    fecharFolha(); D.c13[6].saldo_base=-20000; abrirPiorSemana(); return [a, document.querySelectorAll('#folha .aviso').length]; });
  expect(avisos, 'lista que nao fecha com o numero acusa').toEqual([1,1]);
  expect(erros).toEqual([]);
});

/* 87 fecho (s1183, 07/10/2026): o presidente roda sem 'unsafe-inline' em script-src. A CSP autoriza so o hash do
   unico script inline; mexeu no script, rode `node scripts/csp-hash.mjs`. O hash sai do texto em LF, como o
   navegador calcula depois de normalizar o CRLF do working tree. A p4.27 reprova aqui. */
test('87 fecho: CSP do presidente sem unsafe-inline e com o hash do script que roda', async ({page})=>{
  const fs = require('fs'), crypto = require('crypto');
  const s = fs.readFileSync(path.resolve(__dirname,'..','presidente.html'),'utf8').replace(/\r\n?/g,'\n');
  const csp = (s.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/)||[])[1];
  expect(csp, 'achou a CSP (teste sem alvo passa vazio)').toBeTruthy();
  const scriptSrc = (csp.match(/script-src ([^;]*)/)||[])[1];
  expect(scriptSrc, 'achou o script-src').toBeTruthy();
  expect(scriptSrc, 'sem unsafe-inline').not.toContain("'unsafe-inline'");
  const inl = [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  expect(inl.length, 'um script inline so').toBe(1);
  expect(inl[0][1].length, 'o script inline tem corpo').toBeGreaterThan(100000);
  const h = crypto.createHash('sha256').update(inl[0][1],'utf8').digest('base64');
  expect(scriptSrc, 'hash do script atual: rode node scripts/csp-hash.mjs').toContain(`'sha256-${h}'`);
  const erros = await abrir(page);
  expect(await page.evaluate(()=>typeof VERP), 'o script rodou sob a CSP').toBe('string');
  expect(erros).toEqual([]);
});

/* p4.29 (plano 95, s1226 08/10/2026): card com opcoes gravadas e uma recomendada mostra Recomendo, Ratifico e
   Retifico. Ratifico grava a recomendada pela escolher(); Retifico mostra as outras e grava a tocada; os dois
   esperam os 8 s de desfazer. Antes a tela filtrava o verbo escolher: 7 cards com opcoes nao andavam por aqui. */
const CARD_DECISAO = {id:8,frente:'20-contrato-pj',dono:'igor',status:'pendente',prazo:null,parado_dias:2,titulo:'Card com opcoes',
  acoes:[{verbo:'deliberar',rotulo:'deliberar',arg:'texto'}],escolha:null,
  opcoes:[{label:'Assinar agora',recomendada:true,consequencia:'Fecha hoje; custo zero.'},
    {label:'Adiar uma semana',consequencia:'Mais 7 dias parado.'},{label:'Largar',consequencia:'Sai do plano.'}]};

test('95 decisao: Ratifico grava a opcao recomendada pela escolher, so depois do prazo de desfazer', async ({page})=>{
  await page.setViewportSize({width:360, height:800});
  await abrir(page);
  await page.evaluate(c=>{INV.push(c);abrirInv(8);}, CARD_DECISAO);
  const bloco = page.locator('#folha #decide');
  await expect(bloco).toContainText('Recomendo');
  await expect(bloco).toContainText('Assinar agora');
  for (const nome of ['Ratifico','Retifico']) {
    const h = await bloco.locator(`button:has-text("${nome}")`).evaluate(b=>b.getBoundingClientRect().height);
    expect(h, nome+' abaixo de 44 px').toBeGreaterThanOrEqual(44);
  }
  await bloco.locator('button:has-text("Ratifico")').click();
  /* p4.54 (p157): decisao com toque duplo; o 1o toque so arma */
  await page.evaluate(()=>enviar());
  let esc = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='escolher'));
  expect(esc, 'um toque so nao grava a decisao').toEqual([]);
  await bloco.locator('button:has-text("Ratifico")').click();
  esc = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='escolher'));
  expect(esc, 'nada grava antes do desfazer').toEqual([]);
  await page.evaluate(()=>enviar());
  esc = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='escolher').map(c=>c.a));
  expect(esc).toEqual([{p_ref:'8',p_opcao:'Assinar agora'}]);
});

test('95 decisao: Retifico mostra as outras opcoes e grava a tocada; sem recomendada ou ja escolhido, nao ha bloco', async ({page})=>{
  await abrir(page);
  await page.evaluate(c=>{INV.push(c);abrirInv(8);}, CARD_DECISAO);
  await page.locator('#folha #decide button:has-text("Retifico")').click();
  const ops = page.locator('#campo .opcoes button');
  await expect(ops).toHaveCount(2);
  await expect(page.locator('#campo')).toContainText('Nenhuma serve');
  await ops.nth(0).click(); await ops.nth(0).click(); /* p4.54 (p157): toque duplo */
  await page.evaluate(()=>enviar());
  const esc = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='escolher').map(c=>c.a));
  expect(esc).toEqual([{p_ref:'8',p_opcao:'Adiar uma semana'}]);
  await page.evaluate(c=>{INV.push({...c,id:9,escolha:'Largar'});INV.push({...c,id:10,opcoes:c.opcoes.map(o=>({...o,recomendada:false}))});}, CARD_DECISAO);
  for (const id of [9,10]) {
    await page.evaluate(i=>abrirInv(i), id);
    await expect(page.locator('#folha #decide'), 'card '+id).toHaveCount(0);
  }
});

test('95 rotulo: nota de card de ato diz "Próximo passo"; so card de decisao diz "O executor recomenda"', async ({page})=>{
  await abrir(page);
  await page.evaluate(()=>{D.fila.forEach(f=>f.tipo_card='ato');abrirFila(0);});
  await expect(page.locator('#folha')).toContainText('Próximo passo');
  await expect(page.locator('#folha')).not.toContainText('O executor recomenda');
  await page.evaluate(()=>{fecharFolha();D.fila.forEach(f=>f.tipo_card='decisao');abrirFila(0);});
  await expect(page.locator('#folha')).toContainText('O executor recomenda');
});

/* p4.30 (plano 96, s1226 08/10/2026): "Quero uma recomendacao" chamava deliberar, que o banco grava como POSICAO
   do Igor e o atendente executa: o pedido virava ordem. Agora "Pedir análise" vai pela pedir_analise() e volta
   como opcoes ratificaveis; "Dar minha posição" e o deliberar de verdade. Com opcoes na folha, os dois saem e a
   posicao fica no "Nenhuma serve" do Retifico. */
test('96 Pedir análise vai pela pedir_analise, nunca pelo agir; so depois do prazo de desfazer', async ({page})=>{
  await abrir(page);
  await page.evaluate(()=>abrirFila(0));
  await page.click('#folha [data-verbo="deliberar"]');
  await expect(page.locator('#campo label')).toHaveText('Pedir análise');
  await page.fill('#cv','Vale assinar agora ou esperar o saldo?');
  await page.click('#campo .pri');
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='pedir_analise'||c.n==='agir')), 'nada antes do desfazer').toEqual([]);
  await page.evaluate(()=>enviar());
  const r = await page.evaluate(()=>({pa:window.__rpc.filter(c=>c.n==='pedir_analise').map(c=>c.a), agir:window.__rpc.filter(c=>c.n==='agir')}));
  expect(r.pa).toEqual([{p_origem:'tarefa',p_ref:'2',p_texto:'Vale assinar agora ou esperar o saldo?'}]);
  expect(r.agir, 'pedido de analise nao e posicao').toEqual([]);
});

test('96 Dar minha posição grava deliberar pelo agir; com opcoes na folha, a posicao sai do Retifico', async ({page})=>{
  await abrir(page);
  await page.evaluate(()=>abrirFila(0));
  await page.click('#folha button:has-text("Dar minha posição")');
  await page.fill('#cv','Assina so com o saldo do dia');
  await page.click('#campo .pri');
  await page.evaluate(()=>enviar());
  let agir = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').map(c=>c.a));
  expect(agir).toEqual([{p_origem:'tarefa',p_ref:'2',p_verbo:'deliberar',p_valor:'Assina so com o saldo do dia'}]);
  await page.evaluate(c=>{INV.push(c);abrirInv(8);}, CARD_DECISAO);
  await expect(page.locator('#folha [data-verbo="deliberar"]'), 'com opcoes, Pedir análise sai').toHaveCount(0);
  await expect(page.locator('#folha [data-acao="posicao"]'), 'so o Retifico leva a posicao').toHaveCount(0);
  await page.locator('#folha #decide button:has-text("Retifico")').click();
  await page.click('#campo button:has-text("Nenhuma serve")');
  await expect(page.locator('#campo label')).toContainText('vale como ordem');
  await page.fill('#cv','Nenhuma: renegociar o prazo');
  await page.click('#campo .pri');
  await page.evaluate(()=>enviar());
  agir = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').map(c=>c.a));
  expect(agir[1]).toEqual({p_origem:'tarefa',p_ref:'8',p_verbo:'deliberar',p_valor:'Nenhuma: renegociar o prazo'});
});

/* p4.31 (plano 112 = A2 do plano 101, s1274 08/10/2026): grupo Cobrar no Hoje, no molde da lista Aguardando do GTD. O card
   que espera terceiro com o retorno vencido so aparecia na coluna Esperando, em outra aba (medido em 08/10: 6 de 9). A classe
   que se cobra: cobranca que ninguem ve e cobranca que sai sem o Igor. Copiar nao chama o banco; Cobrei agora grava o verbo
   cobrar so depois dos 8 s de desfazer; card que ja esta em Hoje nao repete; sem a chave cob3 o grupo some, sem erro.
   A p4.30 reprova: nao ha #cob3Box nem a chave cob3 na carga. */
const COB3 = [
  {origem:'tarefa',ref:'5',titulo:'Nao deve repetir: ja esta em Hoje',terceiro:'Alguem',retorno_esperado:'2026-10-01',dias:7,rascunho:'nao'},
  {origem:'tarefa',ref:'7',titulo:'Cobrar resposta de exemplo',terceiro:'Terceiro de exemplo',retorno_esperado:'2026-10-05',dias:3,rascunho:'Bom dia! Rascunho de exemplo.'},
  {origem:'tarefa',ref:'8',titulo:'Segundo pedido de exemplo',terceiro:null,retorno_esperado:'2026-10-08',dias:0,rascunho:'Outro rascunho.'}];
test('p4.31 cobrar: grupo no Hoje sem repetir card; copiar nao grava; Cobrei agora grava cobrar so depois do desfazer', async ({page})=>{
  await page.addInitScript(c=>{ window.__dados={cob3:c}; }, COB3);
  const erros = await abrir(page);
  const carga = await page.evaluate(()=>window.__rpc.find(c=>c.n==='painel_carga'));
  expect(carga.a.p_chaves, 'a carga pede a chave cob3').toContain('cob3');
  const box = page.locator('#cob3Box'), linhas = box.locator('.cob3');
  await expect(box).toBeVisible();
  await expect(linhas, 'o card 5 ja esta em Hoje e nao repete').toHaveCount(2);
  await expect(box).not.toContainText('Nao deve repetir');
  await expect(linhas.nth(0)).toContainText('Terceiro de exemplo · cobrar · 3 d');
  await expect(linhas.nth(1)).toContainText('sem nome de quem responde · cobrar · vence hoje');
  for (const b of await box.locator('button').all())
    expect(await b.evaluate(x=>x.getBoundingClientRect().height), 'botao abaixo de 44 px').toBeGreaterThanOrEqual(44);
  /* a 1a versao herdou ".ordem button" e o "Cobrei agora" ficou ilegivel: o contraste se mede no que a tela pinta */
  const ruins = (await page.evaluate(contrasteDos, '#cob3Box *')).filter(m=>m.razao<4.5);
  expect(ruins, 'texto do grupo abaixo de 4,5:1').toEqual([]);
  const pri = await box.locator('button[data-acao="cobreiAgora"]').first().evaluate(b=>getComputedStyle(b).backgroundColor);
  const sec = await box.locator('button[data-acao="copiarCobranca"]').first().evaluate(b=>getComputedStyle(b).backgroundColor);
  expect(pri, 'Cobrei agora tem o fundo do botao principal, nao o da lista').not.toBe(sec);
  await linhas.nth(0).locator('button[data-acao="copiarCobranca"]').click();
  await expect(page.locator('#tmsg'), 'copiar responde pela tela').toContainText(/ascunho/);
  const atos = ()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir'||c.n==='inbox').map(c=>c.a));
  expect(await atos(), 'copiar nao chama o banco').toEqual([]);
  await linhas.nth(0).locator('button[data-acao="cobreiAgora"]').click();
  await expect(linhas, 'o card cobrado sai do grupo na hora').toHaveCount(1);
  expect(await atos(), 'nada grava antes do desfazer').toEqual([]);
  await page.locator('#tbtn').click();
  await expect(linhas, 'desfazer devolve o card').toHaveCount(2);
  expect(await atos()).toEqual([]);
  await linhas.nth(0).locator('button[data-acao="cobreiAgora"]').click();
  await page.evaluate(()=>enviar());
  expect(await atos()).toEqual([{p_origem:'tarefa',p_ref:'7',p_verbo:'cobrar',p_valor:null}]);
  expect(erros).toEqual([]);
});

test('p4.31 cobrar: snapshot sem a chave cob3 esconde o grupo e diz que a parte nao chegou, sem erro', async ({page})=>{
  await page.addInitScript(()=>{ window.__sem=['cob3']; });
  const erros = await abrir(page);
  await expect(page.locator('#falha'), 'chave faltando vira aviso, nunca silencio').toContainText('cob3');
  await expect(page.locator('#cob3Box')).toBeHidden();
  await expect(page.locator('#cob3Lista .cob3')).toHaveCount(0);
  expect(erros).toEqual([]);
});

/* p4.31: a primeira versao do grupo Cobrar usou id="cobrarBox", que a aba Caixa ja tinha. Com dois ids iguais, a Caixa
   escreveu por cima do Hoje e a tela inteira parou de desenhar, sem aviso de build. A classe morre aqui: depois de passar
   pelas cinco abas e pela folha, nenhum id se repete no DOM vivo. */
test('p4.31 nenhum id repetido no DOM vivo depois das cinco abas e da folha', async ({page})=>{
  await page.addInitScript(c=>{ window.__dados={cob3:c}; }, COB3);
  const erros = await abrir(page);
  const rep = await page.evaluate(()=>{
    const dup = new Set(), ver = ()=>{ const vistos = new Set();
      for (const el of document.querySelectorAll('[id]')) { if (vistos.has(el.id)) dup.add(el.id); vistos.add(el.id); } };
    for (const a of ['hoje','fila','caixa','frentes','mesa','semana']) { ir(a); ver(); }
    ir('hoje'); abrirFila(0); ver(); fecharFolha();
    return [...dup];
  });
  expect(rep, 'id repetido no DOM').toEqual([]);
  expect(erros).toEqual([]);
});

/* p4.32 (plano 113 = B2 do plano 101, s1274 08/10/2026): o teto de estrutura a vista. Medido em 08/10: 68% das sessoes
   humanas de 7 dias foram na frente do proprio sistema, contra o teto de 25%. A linha dessa frente dizia "sem receita" e
   escondia o custo; agora diz a fatia de sessoes e acende acima do teto. A frente vem da chave est (o banco diz qual e),
   nunca de um slug escrito no HTML. A p4.31 reprova: a linha seguia "sem receita". */
test('p4.32 frentes: a frente do sistema mostra a fatia de sessoes de 7 d e acende acima do teto; a folha diz a conta', async ({page})=>{
  const erros = await abrir(page);
  await page.evaluate(()=>{ ARV.push({nivel:1,no:'00-memoria',rotulo:'Sistema',margem_30d:0,margem_total:0});
    D.est=[{sessoes_7d:85,mem_7d:58,pct:68.2,teto:25,acima:true,frente:'00-memoria'}]; ir('frentes'); renderFrentes(); });
  const linha = page.locator('#frentesLista button.frente', {hasText:'Sistema'});
  await expect(linha, 'a frente do sistema aparece mesmo sem card').toHaveCount(1);
  await expect(linha.locator('.r')).toHaveText('68% das sessões em 7 d');
  await expect(linha.locator('.r'), 'acima do teto acende').toHaveClass(/\bw\b/);
  await expect(page.locator('#frentesLista .r', {hasText:'das sessões'}), 'so a frente do sistema mostra sessoes; as outras seguem com margem').toHaveCount(1);
  await linha.click();
  await expect(page.locator('#folha .chips'), 'a folha diz a conta e o teto').toContainText('58 de 85 sessões em 7 d · teto 25%');
  await page.evaluate(()=>{ fecharFolha(); D.est=[{sessoes_7d:85,mem_7d:10,pct:11.8,teto:25,acima:false,frente:'00-memoria'}]; renderFrentes(); });
  await expect(linha.locator('.r'), 'abaixo do teto nao acende').not.toHaveClass(/\bw\b/);
  const pc = await page.evaluate(()=>window.__rpc.find(c=>c.n==='painel_carga').a.p_chaves);
  expect(pc, 'a carga pede a chave est').toContain('est');
  expect(erros).toEqual([]);
});

/* p4.33 (plano 114 = A5 do plano 101, s1274 08/10/2026): saude por fonte (Andon) e ritmo de 7 dias. O selo unico dizia
   "sistema ok" ou "degradado" e escondia qual fonte envelheceu. Agora o selo e o carimbo sao um botao so (duas linhas, 44 px
   sem crescer o topo) que abre a lista de fontes com a hora do ultimo dado; a fonte atrasada vem primeiro e acesa. O carimbo
   diz quantos cards o Igor fechou em 7 dias contra a semana anterior. A p4.32 reprova: o selo nao abre nada. */
test('p4.33 saude por fonte: o selo abre a lista com hora por fonte, a atrasada primeiro e acesa; ritmo de 7 d no carimbo', async ({page})=>{
  await page.setViewportSize({width:390, height:800});
  await page.addInitScript(()=>{ const h=new Date(Date.now()-2*36e5).toISOString();
    window.__dados={rit:[{fechados_7d:72,fechados_7d_ant:64}],
      mo:[{nome:'backup-cerebro',estado:'no ponto',janela_horas:26,ultimo_ponto:h},{nome:'mesa-orfaos',estado:'atrasada',janela_horas:24,ultimo_ponto:'2026-10-01T09:00:00-04:00'},
          {nome:'estrutura',estado:'manual',janela_horas:0,ultimo_ponto:null},{nome:'ciclo-caixa-fechar',estado:'nunca',janela_horas:170,ultimo_ponto:null}]}; });
  const erros = await abrir(page);
  /* a 390 o ritmo quebraria o carimbo em duas linhas (medido: topo de 106 para 131 px): no celular ele fica na folha */
  await expect(page.locator('#fresco .ritmo'), 'no celular o ritmo nao aparece no carimbo').toBeHidden();
  const bt = page.locator('button.estado');
  expect(await page.locator('#fresco').evaluate(e=>Math.round(e.getBoundingClientRect().height/parseFloat(getComputedStyle(e).lineHeight))), 'carimbo em uma linha').toBe(1);
  expect(await bt.evaluate(b=>b.getBoundingClientRect().height), 'selo abaixo de 44 px').toBeGreaterThanOrEqual(44);
  await bt.click();
  await expect(page.locator('#folhaTit')).toHaveText('Saúde por fonte');
  const linhas = page.locator('#folha .fonte');
  await expect(linhas.nth(0), 'atrasada primeiro, sem hifen de maquina').toContainText('mesa orfaos');
  await expect(linhas.nth(0)).toHaveClass(/\bw\b/);
  await expect(linhas.nth(0)).toContainText('último dado 01/10');
  await expect(linhas.nth(1), 'a que nunca rodou tambem acende').toContainText('nunca rodou');
  await expect(page.locator('#folha'), 'rotina manual nao tem hora e fica fora').not.toContainText('estrutura');
  await expect(page.locator('#folha .fonte', {hasText:'backup cerebro'}), 'a fonte em dia nao acende').not.toHaveClass(/\bw\b/);
  await expect(page.locator('#folha .chips')).toContainText('2 fontes acesas');
  await expect(page.locator('#folha .chips')).toContainText('72 cards seus fechados em 7 d64 na semana anterior');
  await page.evaluate(()=>fecharFolha());
  await page.setViewportSize({width:1280, height:800});
  await expect(page.locator('#fresco .ritmo'), 'em tela larga o ritmo fica ao lado do carimbo').toBeVisible();
  await expect(page.locator('#fresco')).toContainText('72 fechados em 7 d (+8)');
  expect(erros).toEqual([]);
});

/* p4.34 (plano 115 = A3 do plano 101, s1274 08/10/2026): concluir em um toque com prova provavel. Medido em 07/10: 19% dos
   fechamentos do Igor passaram pelo painel; o atrito era escrever a prova. Tres provas prontas concluem num toque, com os
   8 s de desfazer. A classe que se cobra (LC-14): prova que fala da saida em vez da volta, prova sem data e prova curta
   demais para a guarda do banco. A p4.33 reprova: a folha de concluir so tinha o campo de texto. */
test('p4.34 concluir: tres provas provaveis falam da volta, com a data de hoje; um toque grava feita so depois do desfazer', async ({page})=>{
  await page.setViewportSize({width:390, height:800});
  const erros = await abrir(page);
  await page.click('#foco .pri');
  const chips = page.locator('#campo .provas button');
  await expect(chips).toHaveCount(3);
  const hoje = await page.evaluate(()=>ddmm(somaDias(0)));
  const textos = await chips.allTextContents();
  for (const t of textos) {
    expect(t, 'prova com a data de hoje').toContain(hoje);
    expect(t.length, 'prova passa do minimo do banco').toBeGreaterThanOrEqual(8);
    expect(t, 'prova fala da volta, nao da saida (LC-14)').toMatch(/Resposta|Confirmação|conferido/);
    expect(t, 'nunca so "enviei"').not.toMatch(/^Enviei/i);
  }
  for (const b of await chips.all())
    expect(await b.evaluate(x=>x.getBoundingClientRect().height), 'chip abaixo de 44 px').toBeGreaterThanOrEqual(44);
  await expect(page.locator('#cv'), 'o campo livre segue para outra prova').toBeVisible();
  await chips.nth(0).click();
  let agir = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir'));
  expect(agir, 'nada grava antes do desfazer').toEqual([]);
  await page.evaluate(()=>enviar());
  agir = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').map(c=>c.a));
  expect(agir).toEqual([{p_origem:'tarefa',p_ref:'2',p_verbo:'feita',p_valor:textos[0]}]);
  expect(erros).toEqual([]);
});

test('p4.34 concluir: card cujo criterio pede ato externo nao ganha prova pronta; segue o campo e o print', async ({page})=>{
  const erros = await abrir(page);
  await page.evaluate(()=>{ const t=INV.find(x=>String(x.id)==='2'); t.criterio_pronto='Boleto pago e comprovante no banco'; abrirFila(0); escolher('feita'); });
  await expect(page.locator('#campo .provas button'), 'pagar pede comprovante, nao prova pronta').toHaveCount(0);
  await expect(page.locator('#campo')).toContainText('pede ato externo');
  await expect(page.locator('#cv')).toBeVisible();
  await expect(page.locator('#cvArq')).toBeAttached();
  expect(erros).toEqual([]);
});

/* p4.35 (plano 68, s1275 09/10/2026): grupo Vence amanha no Hoje. A pergunta da vespera (aviso_vespera, decisao do Igor na
   s880) nascia na bandeja, que so o index.html le; a casa nunca a mostrou. Medido em 09/10: as perguntas de 08/10 e 09/10
   passaram do dia sem resposta e 16 cards estavam vencidos. A classe que se cobra: vespera muda (pergunta aberta que a tela
   nao mostra), data nova que grava sem desfazer e "Mantenho" que nao responde a pergunta do banco. A p4.34 reprova: nao ha
   #vespBox nem a chave vesp na carga. */
const VESP = [
  {origem:'tarefa',ref:'41',frente:'11-renda-alt',titulo:'Card que vence amanha',prazo:'2026-10-10',vesp_id:'90'},
  {origem:'tarefa',ref:'42',frente:'20-contrato-pj',titulo:'Outro card de amanha',prazo:'2026-10-10',vesp_id:'90'}];
test('p4.35 vespera: uma linha no Hoje; nova data na folha grava repactuar so depois do desfazer; Mantenho responde a pergunta', async ({page})=>{
  await page.setViewportSize({width:390, height:800});
  await page.addInitScript(v=>{ window.__dados={vesp:v}; }, VESP);
  const erros = await abrir(page);
  const pc = await page.evaluate(()=>window.__rpc.find(c=>c.n==='painel_carga').a.p_chaves);
  expect(pc, 'a carga pede a chave vesp').toContain('vesp');
  const box = page.locator('#vespBox');
  await expect(box).toBeVisible();
  await expect(box.locator('.cob3'), 'no Hoje e uma linha so, para nao inchar a tela (teste 106)').toHaveCount(1);
  await expect(box).toContainText('2 cards vencem amanhã, ');
  await expect(box).toContainText('10/10');
  await expect(box).toContainText('Card que vence amanha · Outro card de amanha');
  for (const b of await box.locator('button').all())
    expect(await b.evaluate(x=>x.getBoundingClientRect().height), 'botao abaixo de 44 px').toBeGreaterThanOrEqual(44);
  const ruins = (await page.evaluate(contrasteDos, '#vespBox *')).filter(m=>m.razao<4.5);
  expect(ruins, 'texto do grupo abaixo de 4,5:1').toEqual([]);
  const atos = ()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir'||c.n==='escolher').map(c=>({n:c.n,a:c.a})));
  await box.locator('button:has-text("Mudar datas")').click();
  await expect(page.locator('#folhaTit')).toContainText('Vence amanhã');
  const linhas = page.locator('#folha .fonte.vesp');
  await expect(linhas).toHaveCount(2);
  for (const b of await page.locator('#folha button').all())
    expect(await b.evaluate(x=>x.getBoundingClientRect().height), 'botao da folha abaixo de 44 px').toBeGreaterThanOrEqual(44);
  const sw = await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(sw, 'sem rolagem horizontal a 390').toBeLessThanOrEqual(390);
  /* nenhuma data oferecida e amanha ou antes: repactuar para o mesmo dia nao decide nada */
  const datas = await page.locator('#folha [data-acao="vespData"]').evaluateAll(bs=>bs.map(b=>b.dataset.a2));
  const amanha = await page.evaluate(()=>somaDias(1));
  for (const d of datas) expect(d > amanha, 'data oferecida depois de amanha').toBe(true);
  const d3 = await page.evaluate(()=>somaDias(3));
  await expect(linhas.nth(0).locator('[data-acao="vespData"]').first(), 'o primeiro botao e +3 dias, com o dia escrito').toHaveText(await page.evaluate(()=>diaCurto(somaDias(3))));
  await linhas.nth(0).locator('[data-acao="vespData"]').first().click();
  await expect(linhas, 'a folha volta com o card que falta').toHaveCount(1);
  await expect(box).toContainText('1 card vence amanhã');
  expect(await atos(), 'nada grava antes do desfazer').toEqual([]);
  await page.locator('#tbtn').click();
  await expect(linhas, 'desfazer devolve o card a folha').toHaveCount(2);
  await expect(box).toContainText('2 cards vencem amanhã');
  await linhas.nth(0).locator('[data-acao="vespData"]').first().click();
  await page.evaluate(()=>enviar());
  expect(await atos()).toEqual([{n:'agir',a:{p_origem:'tarefa',p_ref:'41',p_verbo:'repactuar',p_valor:d3}}]);
  /* a carga de volta ainda traz o 41 (o duble nao muda): o FEITOS segura ate o banco confirmar */
  await page.evaluate(()=>fecharFolha());
  await box.locator('button:has-text("Mantenho as datas")').click();
  await expect(box, 'Mantenho fecha o grupo na hora').toBeHidden();
  await page.evaluate(()=>enviar());
  const esc = (await atos()).filter(x=>x.n==='escolher');
  expect(esc, 'Mantenho responde a pergunta da vespera pela escolher()').toEqual([{n:'escolher',a:{p_ref:'90',p_opcao:'Mantenho as datas'}}]);
  expect(erros).toEqual([]);
});

test('p4.35 vespera: snapshot sem a chave vesp esconde o grupo e diz que a parte nao chegou; linha sem pergunta nao aparece', async ({page})=>{
  await page.addInitScript(()=>{ window.__sem=['vesp']; });
  const erros = await abrir(page);
  await expect(page.locator('#falha'), 'chave faltando vira aviso, nunca silencio').toContainText('vesp');
  await expect(page.locator('#vespBox')).toBeHidden();
  await page.evaluate(()=>{ D.vesp=[{origem:'tarefa',ref:'41',titulo:'Sem pergunta aberta',prazo:'2026-10-10',vesp_id:null}]; renderVespera(); });
  await expect(page.locator('#vespBox'), 'sem pergunta aberta nao ha o que manter').toBeHidden();
  expect(erros).toEqual([]);
});

/* p4.36 (planos 88 e 116 fundidos, s1275 09/10/2026): barra de comandos (Linear Cmd+K) e captura em uma linha (GTD). A
   busca so abria o card e card novo so nascia por sessao de chat ou pela inbox. A classe que se cobra: tecla que dispara
   dentro de campo de texto, verbo que grava sem passar pela folha do card, card criado sem desfazer, titulo fora do padrao
   do banco e dia lotado oferecido como prazo. A p4.35 reprova: nao ha / nem N nem a porta painel_nova_tarefa. */
test('p4.36 barra: / e Ctrl+K abrem a busca; os 3 primeiros achados trazem os verbos com a tecla; Enter abre o primeiro; sem achado, Enter cria', async ({page})=>{
  const erros = await abrir(page);
  await page.keyboard.press('/');
  await expect(page.locator('#busca')).toBeVisible();
  await expect(page.locator('#q')).toBeFocused();
  await page.keyboard.type('Item');
  await expect(page.locator('#q'), 'a tecla / nao entra no texto').toHaveValue('Item');
  const verbos = page.locator('#qres .qverbos');
  await expect(verbos, 'verbos so nos 3 primeiros achados').toHaveCount(3);
  await expect(verbos.nth(0).locator('button', {hasText:'Nova data'}).locator('kbd'), 'p4.54: S virou Adiar; Nova data abre direto, sem tecla').toHaveCount(0);
  await expect(verbos.nth(0).locator('button', {hasText:'Concluir'}), 'sem verbo de concluir no card, sem botao').toHaveCount(0);
  for (const b of await page.locator('#qres button').all())
    expect(await b.evaluate(x=>x.getBoundingClientRect().height), 'botao abaixo de 44 px').toBeGreaterThanOrEqual(44);
  await verbos.nth(1).locator('button', {hasText:'Nova data'}).click();
  await expect(page.locator('#folhaTit'), 'o verbo abre a folha do proprio card').toHaveText('Item para decidir');
  await expect(page.locator('#campo .datas button').first(), 'e ja no campo da nova data').toBeVisible();
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').length), 'abrir o verbo nao grava').toBe(0);
  await page.keyboard.press('Escape');
  await page.locator('#q').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#folhaTit'), 'Enter abre o primeiro achado').toHaveText('Item esperando');
  await page.keyboard.press('Escape');
  await page.locator('#q').fill(''); await page.locator('#q').type('Pedir orcamento ao vidraceiro');
  await expect(page.locator('#qres .item.nova')).toContainText('Criar card');
  await page.keyboard.press('Enter');
  await expect(page.locator('#folhaTit')).toHaveText('Nova pendência');
  await expect(page.locator('#novaTit')).toHaveValue('Pedir orcamento ao vidraceiro');
  await page.keyboard.press('Escape');
  await page.locator('#q').press('Escape');
  await expect(page.locator('#busca'), 'Esc fecha a busca').toBeHidden();
  await page.locator('body').click({position:{x:5,y:5}});
  await page.keyboard.press('Control+k');
  await expect(page.locator('#q'), 'Ctrl+K tambem abre').toBeFocused();
  expect(erros).toEqual([]);
});

test('p4.36 nova: N abre a folha; titulo fora do padrao nao sai; dia cheio nao e oferecido; cria so depois do desfazer; recusa reabre com o texto', async ({page})=>{
  await page.setViewportSize({width:360, height:760});
  const erros = await abrir(page);
  /* lota amanha com 8 cards do Igor: o chip do dia sai desabilitado e a sugestao pula para o proximo com vaga */
  await page.evaluate(()=>{ const d=somaDias(1); for(let i=0;i<8;i++)INV.push({id:900+i,frente:'20-contrato-pj',dono:'igor',status:'pendente',prazo:d,parado_dias:0,titulo:'Lotar o dia '+i,acoes:[]}); });
  await page.keyboard.press('n');
  await expect(page.locator('#folhaTit')).toHaveText('Nova pendência');
  await expect(page.locator('#novaTit'), 'a tecla N nao entra no texto').toHaveValue('');
  const amanha = page.locator('#novaOpc button[data-acao="novaPrazo"]', {hasText:'amanhã'});
  await expect(amanha).toBeDisabled();
  await expect(amanha).toContainText('cheio');
  const sug = await page.locator('#novaOpc button[data-acao="novaPrazo"][aria-pressed="true"]').getAttribute('data-a1');
  expect(sug > await page.evaluate(()=>somaDias(1)), 'sugere o primeiro dia com vaga depois de amanha').toBe(true);
  await page.locator('#novaTit').fill('reuniao com o fiscal');
  await page.locator('#folha button', {hasText:'Criar card'}).click();
  await expect(page.locator('#novaErro')).toContainText('verbo');
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_nova_tarefa').length), 'fora do padrao nao chama o banco').toBe(0);
  await page.locator('#novaTit').fill('');
  await page.locator('#novaTit').type('ligar para o fiscal sobre a medicao');
  await expect(page.locator('#novaCont')).toHaveText('35/70');
  const fr = page.locator('#novaOpc button[data-acao="novaFrente"][aria-pressed="true"]');
  await expect(fr, 'uma frente sugerida e marcada').toHaveCount(1);
  for (const b of await page.locator('#folha button:visible, #folha input, #folha select').all())
    expect(await b.evaluate(x=>x.getBoundingClientRect().height), 'controle da folha abaixo de 44 px').toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth), 'sem rolagem horizontal a 360').toBeLessThanOrEqual(360);
  await page.locator('#novaOpc button[data-acao="novaFrente"]', {hasText:'Contrato PJ'}).click();
  await page.locator('#novaTit').press('Enter');
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_nova_tarefa').length), 'nada grava antes do desfazer').toBe(0);
  await page.locator('#tbtn').click();
  await expect(page.locator('#novaTit'), 'desfazer devolve a folha com o texto').toHaveValue('Ligar para o fiscal sobre a medicao');
  await page.locator('#folha button', {hasText:'Criar card'}).click();
  await page.evaluate(()=>{ window.__nova='RECUSADO: tarefa gemea da t5 ja aberta na frente 20-contrato-pj'; enviar(); });
  await expect(page.locator('#tmsg')).toContainText('Não criou: tarefa gemea');
  await expect(page.locator('#novaTit'), 'recusa reabre a folha com o texto guardado').toHaveValue('Ligar para o fiscal sobre a medicao');
  const nova = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_nova_tarefa').map(c=>c.a));
  expect(nova).toEqual([{p_titulo:'Ligar para o fiscal sobre a medicao',p_frente:'20-contrato-pj',p_prazo:sug}]);
  await page.evaluate(()=>{ window.__nova=null; });
  await page.locator('#folha button', {hasText:'Criar card'}).click();
  await page.evaluate(()=>enviar());
  await expect(page.locator('#tmsg')).toContainText('Card criado: t99');
  expect(erros).toEqual([]);
});

/* p4.37 (s1275 09/10/2026): rotina que rodou e falhou depois do ultimo ponto bom acende, com o motivo. A Saude por fonte so
   olhava o ultimo ponto bom: a vigia-testes falhou 07 e 08/10 e aparecia como "ultimo dado 06/10", igual a parada, e a
   sensor-dabli falhou em 08/10 sem acender nada (estado "nova"). A classe que se cobra: falha que a tela nao mostra, e
   falha antiga (ja superada por ponto bom) que acende a toa. A p4.36 reprova: o selo dizia "sistema ok". */
test('p4.37 saude: rotina que falhou depois do ultimo ponto bom acende com o motivo; falha ja superada nao acende', async ({page})=>{
  await page.addInitScript(()=>{ const h=n=>new Date(Date.now()-n*36e5).toISOString();
    window.__dados={mo:[
      {nome:'backup-cerebro',estado:'no ponto',janela_horas:26,ultimo_ponto:h(3),ultima_tentativa:h(3),ultima_ok:true},
      {nome:'sensor-dabli',estado:'nova',janela_horas:24,ultimo_ponto:h(40),ultima_tentativa:h(12),ultima_ok:false,ultima_falha:'ADIAR SO COM O IGOR: card 1917 e do Igor'},
      {nome:'vigia-testes',estado:'no ponto',janela_horas:26,ultimo_ponto:h(2),ultima_tentativa:h(30),ultima_ok:false,ultima_falha:'falha velha, ja superada'}]}; });
  const erros = await abrir(page);
  await expect(page.locator('#saude'), 'o selo nao diz ok com rotina falhando').toContainText('1 rotina falhando');
  await page.locator('button.estado').click();
  const l = page.locator('#folha .fonte');
  await expect(l.nth(0), 'a que falhou vem primeiro, acesa').toHaveClass(/\bw\b/);
  await expect(l.nth(0)).toContainText('sensor dabli');
  await expect(l.nth(0)).toContainText('falhou ');
  await expect(l.nth(0), 'o motivo aparece na linha').toContainText('ADIAR SO COM O IGOR');
  await expect(l.nth(0)).toContainText('último dado bom');
  await expect(l.nth(0).locator('.r')).toHaveText('falhou');
  const vt = page.locator('#folha .fonte', {hasText:'vigia testes'});
  await expect(vt, 'falha anterior ao ultimo ponto bom nao acende').not.toHaveClass(/\bw\b/);
  await expect(vt).not.toContainText('falha velha');
  expect(erros).toEqual([]);
});

/* p4.38 (card 1562, s1322, 09/10/2026; desenho do Igor de 02/10) criou os quatro blocos de presidente so para a frente do socio,
   lidos de v_dabli_presidente. p4.66 (pi 179, s6857, 17/10/2026): a ficha vale para TODA frente, com os blocos A a E lidos de
   v_frente_ficha (chave ficha do painel_carga), sem caso especial. A classe que se cobra: bloco que some quando vem vazio,
   ficha so de uma frente, lista generica que volta junto, detalhe que quebra em varias linhas e rolagem horizontal no celular.
   Teste de layout sem o elemento passa vazio: exige 5 blocos e 4 linhas. A p4.65 reprova aqui (nao le a chave ficha). */
const LINHAS_4B = `(()=>{ const d=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};
  const F='20-contrato-pj';
  window.__dados={ficha:[
    {frente_slug:F,ordem:1,bloco:'A · EXEMPLO',ref:'D9',item:'Decidir o preco do plano de exemplo',detalhe:'Detalhe de exemplo '+'bem comprido '.repeat(30),prazo:null,dias_parado:9,recomendacao:'decisao aberta na frente: ratifique ou retifique'},
    {frente_slug:F,ordem:1,bloco:'A · EXEMPLO',ref:'t91',item:'Assinar o termo de exemplo',detalhe:'ato do Igor',prazo:d(-2),dias_parado:2,recomendacao:'VENCIDO ha 2 dia(s): repactue ou feche'},
    {frente_slug:F,ordem:2,bloco:'B · EXEMPLO',ref:'t92',item:'Receber a minuta do terceiro de exemplo',detalhe:'Terceiro de exemplo',prazo:d(4),dias_parado:-4,recomendacao:'quem deve a proxima resposta: o terceiro'},
    {frente_slug:F,ordem:4,bloco:'D · EXEMPLO',ref:'receber',item:'Mensalidade de exemplo',detalhe:'R$ 1.000,00 (fatia de exemplo) · status previsto',prazo:d(6),dias_parado:-6,recomendacao:'confira no extrato'},
    {frente_slug:'11-renda-alt',ordem:1,bloco:'A · EXEMPLO',ref:'t99',item:'Item de outra frente',detalhe:'ato do Igor',prazo:null,dias_parado:0,recomendacao:'decida na data'}]}; })();`;

test('p4.66 pi 179: a ficha de qualquer frente abre os blocos A a E de v_frente_ficha, vazio diz "nada aqui", sem rolagem a 360, 390 e 1280', async ({page})=>{
  await page.addInitScript(LINHAS_4B);
  const erros = await abrir(page);
  await page.evaluate(()=>{ ir('frentes'); abrirFrente('20-contrato-pj'); });
  const b = page.locator('#folha section.d4');
  await expect(b, 'cinco blocos, o vazio inclusive').toHaveCount(5);
  await expect(page.locator('#folha section.d4 .d4i'), 'uma linha por item da ficha desta frente (o item de outra frente fica fora)').toHaveCount(4);
  expect(await b.locator('.rot').allTextContents(), 'ordem da view, titulo curto e contagem').toEqual(
    ['Só o presidente decide2','Terceiro esperando ou me devendo1','Entregue, espera sua palavra0','Dinheiro da frente1','Números0']);
  await expect(b.nth(2).locator('.d4i')).toHaveCount(0);
  await expect(b.nth(2).locator('.d4v')).toHaveText('nada aqui');
  await expect(b.nth(4).locator('.d4v'), 'o bloco E vazio tambem diz').toHaveText('nada aqui');
  await expect(page.locator('#folha .item:visible'), 'a lista de cards fica recolhida, nao soma ao lado dos blocos').toHaveCount(0);
  const l = b.nth(0).locator('.d4i');
  await expect(l.nth(0)).toContainText('Decidir o preco do plano de exemplo');
  await expect(l.nth(0).locator('.d4m')).toHaveText('parado há 9 d');
  await expect(l.nth(0).locator('.d4r')).toHaveText('decisao aberta na frente: ratifique ou retifique');
  await expect(l.nth(1).locator('.d4m')).toContainText('venceu ');
  await expect(b.nth(1).locator('.d4m'), 'prazo futuro sem "parado"').toHaveText(/^até \d\d\/\d\d$/);
  /* o detalhe e uma linha so, com reticencias */
  const det = await l.nth(0).locator('.d4d').evaluate(e=>({ws:getComputedStyle(e).whiteSpace, to:getComputedStyle(e).textOverflow,
    corta:e.scrollWidth>e.clientWidth, alto:e.getBoundingClientRect().height, lh:parseFloat(getComputedStyle(e).lineHeight)||20}));
  expect(det.ws).toBe('nowrap'); expect(det.to).toBe('ellipsis'); expect(det.corta, 'o detalhe longo e cortado').toBe(true);
  expect(det.alto, 'detalhe em uma linha').toBeLessThan(det.lh*1.6);
  for (const w of [360, 390, 1280]) {
    await page.setViewportSize({width:w, height:820});
    const m = await page.evaluate(()=>{ document.body.style.letterSpacing='1.5px'; const f=document.getElementById('folha');
      return {W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth, FW:f.clientWidth, FSW:f.scrollWidth, n:f.querySelectorAll('section.d4').length}; });
    expect(m.n, `blocos a ${w}`).toBe(5);
    expect(m.SW, `rolagem horizontal da pagina a ${w}`).toBe(m.W);
    expect(m.FSW, `rolagem horizontal da folha a ${w}`).toBe(m.FW);
  }
  /* os cards seus seguem a um toque, recolhidos */
  expect(await page.$$eval('#folha .fi-cards .item .t', e=>e.map(x=>x.textContent))).toEqual(['Item esperando','Item depois']);
  await page.locator('#folha .fi-cards summary').click();
  await expect(page.locator('#folha .fi-cards .item:visible')).toHaveCount(2);
  /* outra frente, sem linha na ficha: os cinco blocos dizem "nada aqui" em vez de sumir; o item dela nao vaza para esta */
  await page.evaluate(()=>{ fecharFolha(); abrirFrente('04-obra-residencial'); });
  await expect(page.locator('#folha section.d4')).toHaveCount(5);
  await expect(page.locator('#folha section.d4 .d4v')).toHaveCount(5);
  await expect(page.locator('#folha section.d4 .d4i')).toHaveCount(0);
  await expect(page.locator('#folha button:has-text("Check-in de segunda")'), 'o check-in vale para toda frente').toHaveCount(1);
  expect(erros).toEqual([]);
});

test('p4.66 pi 179: bloco E mostra rotulo e valor em uma linha e nao tem teto; sem a chave ficha a folha declara', async ({page})=>{
  await page.addInitScript(()=>{ window.__dados={ficha:[
    {frente_slug:'20-contrato-pj',ordem:5,bloco:'E · NUMEROS',ref:'margem_30d',item:'Margem em 30 dias',detalhe:'R$ 1.000,00',prazo:null,dias_parado:null,recomendacao:null},
    {frente_slug:'20-contrato-pj',ordem:5,bloco:'E · NUMEROS',ref:'cards_abertos',item:'Cards abertos',detalhe:'3',prazo:null,dias_parado:null,recomendacao:null},
    {frente_slug:'20-contrato-pj',ordem:5,bloco:'E · NUMEROS',ref:'cards_vencidos',item:'Cards vencidos',detalhe:'0',prazo:null,dias_parado:null,recomendacao:null}]}; });
  const erros = await abrir(page);
  await page.evaluate(()=>abrirFrente('20-contrato-pj'));
  const e = page.locator('#folha section.d4').nth(4);
  await expect(e.locator('.rot')).toHaveText('Números3');
  await expect(e.locator('.d4e')).toHaveCount(3);
  await expect(e.locator('.d4e').nth(0)).toContainText('Margem em 30 dias');
  await expect(e.locator('.d4e b').nth(0)).toHaveText('R$ 1.000,00');
  await expect(e.locator('.d4v'), 'bloco com linha nao diz "nada aqui"').toHaveCount(0);
  /* a chave some do snapshot: nada de bloco vazio fingindo que esta tudo certo */
  await page.evaluate(()=>{ delete D.ficha; abrirFrente('20-contrato-pj'); });
  await expect(page.locator('#d4')).toContainText('A ficha não chegou nesta carga');
  await expect(page.locator('#folha section.d4')).toHaveCount(0);
  expect(erros).toEqual([]);
});

/* p4.64 (card 1562, s5706, 16/10/2026): o bloco A chegou a 43 itens e virou a lista generica de novo. A classe que se cobra:
   bloco A sem teto. Mostra 7, na ordem da view, e o resto atras de "ver todos"; os outros blocos nao tem teto. A p4.63 reprova. */
test('p4.64 ficha: bloco A mostra 7 itens e o resto atras de "ver todos", sem rolagem a 360', async ({page})=>{
  await page.addInitScript(()=>{
    const a=Array.from({length:12},(_,i)=>({frente_slug:'20-contrato-pj',ordem:1,bloco:'A · EXEMPLO',ref:'t'+(100+i),item:'Item de exemplo '+(i+1),detalhe:'ato do Igor',prazo:null,dias_parado:0,recomendacao:'decida na data'}));
    const b=Array.from({length:9},(_,i)=>({frente_slug:'20-contrato-pj',ordem:2,bloco:'B · EXEMPLO',ref:'t'+(200+i),item:'Terceiro de exemplo '+(i+1),detalhe:'Terceiro',prazo:null,dias_parado:0,recomendacao:'quem deve a proxima resposta: o terceiro'}));
    window.__dados={ficha:a.concat(b)}; });
  const erros = await abrir(page);
  await page.setViewportSize({width:360, height:820});
  await page.evaluate(()=>{ ir('frentes'); abrirFrente('20-contrato-pj'); });
  const b = page.locator('#folha section.d4');
  await expect(b).toHaveCount(5);
  expect(await b.nth(0).locator('.rot').textContent(), 'a contagem segue sendo o total').toBe('Só o presidente decide12');
  const visiveis = b.nth(0).locator('.d4i:visible');
  await expect(visiveis, 'bloco A com 7 visiveis').toHaveCount(7);
  expect(await visiveis.locator('.t').allTextContents(), 'os 7 primeiros, na ordem da view').toEqual(
    [1,2,3,4,5,6,7].map(i=>'Item de exemplo '+i));
  await expect(b.nth(1).locator('.d4i:visible'), 'bloco B sem teto').toHaveCount(9);
  await expect(b.nth(1).locator('.d4mais')).toHaveCount(0);
  const btn = b.nth(0).locator('.d4mais');
  await expect(btn).toHaveText('ver todos (mais 5)');
  await expect(btn).toHaveAttribute('aria-expanded','false');
  const m = await page.evaluate(()=>({W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth}));
  expect(m.SW, 'rolagem horizontal a 360').toBe(m.W);
  await btn.click();
  await expect(b.nth(0).locator('.d4i:visible'), 'ver todos abre os 12').toHaveCount(12);
  await expect(btn).toHaveText('ver menos');
  await expect(btn).toHaveAttribute('aria-expanded','true');
  await btn.click();
  await expect(b.nth(0).locator('.d4i:visible')).toHaveCount(7);
  await expect(btn).toHaveText('ver todos (mais 5)');
  expect(erros).toEqual([]);
});

test('p4.66 pi 179: demonstracao: a ficha de exemplo da startup abre A a E inventados, sem rede e sem marca real', async ({page})=>{
  const {erros, rede} = await abrirDemo(page, 390);
  await page.evaluate(()=>ir('frentes'));
  await page.locator('#frentesLista .frente', {hasText:'Startup de tecnologia'}).click();
  await expect(page.locator('#folha section.d4')).toHaveCount(5);
  await expect(page.locator('#folha section.d4 .d4i'), 'linhas dos blocos A, B e D').toHaveCount(5);
  await expect(page.locator('#folha section.d4').nth(2).locator('.d4v')).toHaveText('nada aqui');
  await expect(page.locator('#folha section.d4').nth(4).locator('.d4e'), 'bloco E com os tres numeros').toHaveCount(3);
  /* nenhuma frente de exemplo fica sem ficha: a da consultoria tambem abre com numeros */
  await page.evaluate(()=>{ fecharFolha(); abrirFrente('11-consultoria'); });
  await expect(page.locator('#folha section.d4').nth(4).locator('.d4e')).toHaveCount(3);
  expect(await page.locator('#folha').innerText(), 'marca real na folha').not.toMatch(/Dabli/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
  expect(await page.evaluate(()=>window.__rpc.length), 'o duble do banco nao recebe nada').toBe(0);
  expect(rede).toEqual([]);
  expect(erros).toEqual([]);
});

/* ---------- plano 122 · Onda 1, "a tela nunca mente" (p4.39, s1446, 10/10/2026) ----------
   Google SRE: falhar alto, nunca vazio calado. Cada teste abaixo reprova a p4.38 (prova no PR).
   DUBLE_122 entra DEPOIS do DUBLE e embrulha o cliente: window.__falha = {nome: 'rede' | 401 | {message}}
   faz a RPC cair (rede: a promessa rejeita, como o fetch sem rede), voltar 401 (JWT vencido) ou {error};
   window.__errosCarga poe erros por chave no retorno de painel_carga, como o snapshot faz quando uma fonte cai;
   window.__authCb e o callback do onAuthStateChange, para o teste disparar SIGNED_OUT e SIGNED_IN. */
const DUBLE_122 = `(()=>{ const orig=window.supabase.createClient;
  window.supabase.createClient=(...x)=>{ const c=orig(...x), rpc=c.rpc;
    c.rpc=(n,a)=>{ const f=(window.__falha||{})[n];
      if(f){ window.__rpc.push({n,a});
        if(f==='rede') return Promise.reject(new TypeError('Failed to fetch'));
        if(f===401) return Promise.resolve({data:null,error:{message:'JWT expired',code:'PGRST301'},status:401});
        return Promise.resolve({data:null,error:f,status:400}); }
      const r=rpc(n,a);
      return n==='painel_carga'&&window.__errosCarga?r.then(x=>({...x,data:{...x.data,erros:window.__errosCarga}})):r; };
    c.auth.onAuthStateChange=cb=>{ window.__authCb=cb; return {data:{subscription:{unsubscribe(){}}}}; };
    c.auth.signOut=()=>Promise.resolve({error:null});
    return c; }; })();`;
async function abrir122(page){
  const erros=[];
  page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(DUBLE);
  await page.addInitScript(DUBLE_122);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA);
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit') && !!document.querySelector('#kanban .item'));
  return erros;
}
const nRpc = (page,n)=>page.evaluate(n=>window.__rpc.filter(x=>x.n===n).length, n);

test('122 carga: erro por chave de painel_carga e remontagem que falha aparecem, nunca calados', async ({page})=>{
  const erros = await abrir122(page);
  await expect(page.locator('#falha')).toBeHidden();
  await page.evaluate(async()=>{ window.__errosCarga={c13:'canceling statement due to statement timeout'}; await carregar(); });
  await expect(page.locator('#falha'), 'data.erros de painel_carga aparece').toBeVisible();
  await expect(page.locator('#falha')).toContainText('c13');
  await expect(page.locator('#falha')).toContainText('statement timeout');
  await page.evaluate(async()=>{ window.__errosCarga=null; window.__falha={painel_snapshot_montar:{message:'permission denied for function painel_snapshot_montar'}}; await carregar(true); });
  await expect(page.locator('#falha'), 'remontagem com {error} aparece').toContainText('painel_snapshot_montar');
  await expect(page.locator('#falha')).toContainText('permission denied');
  await page.evaluate(async()=>{ window.__falha={painel_snapshot_montar:'rede'}; await carregar(true); });
  await expect(page.locator('#falha'), 'remontagem sem rede aparece').toContainText('Failed to fetch');
  await page.evaluate(async()=>{ window.__falha={painel_carga:'rede'}; await carregar(); });
  await expect(page.locator('#falha'), 'carga sem rede aparece').toContainText('Failed to fetch');
  await expect(page.locator('#foco .tit'), 'o que estava na tela fica').toBeVisible();
  await page.evaluate(async()=>{ window.__falha={}; await carregar(); });
  await expect(page.locator('#falha'), 'carga boa apaga o aviso').toBeHidden();
  expect(erros).toEqual([]);
});

test('122 sessao: SIGNED_OUT e 401 levam ao login com aviso, e entrar de novo reabre o painel', async ({page})=>{
  const erros = await abrir122(page);
  await page.evaluate(()=>window.__authCb('SIGNED_OUT',null));
  await expect(page.locator('#login'), 'SIGNED_OUT mostra o login').toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  await expect(page.locator('#lmsg')).toContainText('sessão');
  const n0 = await nRpc(page,'painel_carga');
  await page.evaluate(()=>window.__authCb('SIGNED_IN',{user:{id:'x'}}));
  await expect(page.locator('#app'), 'entrar de novo reabre').toBeVisible();
  await expect.poll(()=>nRpc(page,'painel_carga'), 'e le o banco de novo').toBe(n0+1);
  await page.evaluate(async()=>{ window.__falha={painel_carga:401}; await carregar(); });
  await expect(page.locator('#login'), '401 na carga mostra o login').toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  await expect(page.locator('#lmsg')).toContainText('sessão');
  expect(erros).toEqual([]);
});

test('122 volta do segundo plano: o presidente rele depois de um minuto ou de carga falha, nunca com a folha aberta', async ({page})=>{
  const erros = await abrir122(page);
  const volta = ()=>page.evaluate(()=>{ document.dispatchEvent(new Event('visibilitychange')); return new Promise(r=>setTimeout(r,250)); });
  const n0 = await nRpc(page,'painel_carga');
  await volta();
  expect(await nRpc(page,'painel_carga'), 'voltar logo nao rele').toBe(n0);
  await page.evaluate(()=>{ CARGA_EM=Date.now()-61000; });
  await volta();
  expect(await nRpc(page,'painel_carga'), 'voltar depois de um minuto rele').toBe(n0+1);
  await page.evaluate(()=>{ CARGA_EM=Date.now()-61000; abrirFila(0); });
  await volta();
  expect(await nRpc(page,'painel_carga'), 'com a folha aberta nao redesenha por baixo').toBe(n0+1);
  await page.evaluate(async()=>{ fecharFolha(); window.__falha={painel_carga:{message:'statement timeout'}}; await carregar(); window.__falha={}; });
  await volta();
  expect(await nRpc(page,'painel_carga'), 'a ultima carga falhou: voltar rele na hora').toBe(n0+3);
  await expect(page.locator('#falha')).toBeHidden();
  expect(erros).toEqual([]);
});

test('122 ato sem resposta: com o ato em voo nao reenvia, e o retry confere o banco antes de repetir', async ({page})=>{
  const erros = await abrir122(page);
  await page.clock.install();
  const lim = await page.evaluate(()=>LIMITE_ACAO);
  const ATO = {origem:'tarefa',ref:'2',verbo:'repactuar',valor:'2026-10-20'};
  const manda = ()=>page.evaluate(a=>{ PEND={...a,t:0}; enviar(); }, ATO);
  await page.evaluate(()=>{ window.__pendura=['agir']; });
  await manda();
  await expect(page.locator('#tmsg')).toHaveText('gravando…');
  await manda();
  expect(await nRpc(page,'agir'), 'em voo: o segundo toque nao vai ao banco').toBe(1);
  await expect(page.locator('#tmsg')).toContainText('já está sendo gravado');
  await page.clock.fastForward(lim+100);
  await expect(page.locator('#tmsg'), 'o teto continua dizendo que pode ter gravado').toContainText('Nada foi confirmado');
  /* o banco tinha gravado: o acao mostra o ato depois do envio, e o retry nao repete */
  await page.evaluate(()=>{ window.__pendura=[]; window.__tab={acao:[{verbo:'repactuar',valor:'2026-10-20',agido_em:new Date().toISOString()}]}; });
  await manda();
  await expect(page.locator('#tmsg')).toContainText('já tinha gravado');
  expect(await nRpc(page,'agir'), 'o retry conferiu o acao e nao repetiu').toBe(1);
  /* o banco nao tinha gravado: o retry vai, com o mesmo id de ato */
  await page.evaluate(()=>{ window.__pendura=['agir']; window.__tab={acao:[]}; });
  await manda();
  await page.clock.fastForward(lim+100);
  await expect(page.locator('#tmsg')).toContainText('Nada foi confirmado');
  const a1 = await page.evaluate(()=>[...ATOS.values()].map(a=>a.id+':'+a.estado));
  expect(a1.length, 'um ato incerto').toBe(1);
  expect(a1[0]).toMatch(/:incerto$/);
  await manda();
  await expect.poll(()=>nRpc(page,'agir'), 'sem registro no acao, o retry vai ao banco').toBe(3);
  const a2 = await page.evaluate(()=>[...ATOS.values()].map(a=>a.id+':'+a.estado));
  expect(a2, 'o retry reaproveita o id do ato').toEqual([a1[0].replace(/:incerto$/,':voo')]);
  expect(erros).toEqual([]);
});

/* p4.40 (t2044, s1522): o painel apita no celular por Web Push. O link do rodape pede a permissao num toque,
   assina com a chave publica que vem do banco e grava a assinatura por push_assinar. O service worker e o
   PushManager sao dublados: o que se cobra e o caminho da tela ate o banco, nunca o servico de push real. */
const PUSH_DUBLE = ()=>{
  window.__push=[];
  const sub={endpoint:'https://web.push.apple.com/teste',toJSON(){return {endpoint:this.endpoint,keys:{p256dh:'B'+'A'.repeat(86),auth:'a'.repeat(22)}};}};
  const reg={pushManager:{getSubscription:()=>Promise.resolve(window.__pushSub||null),
    subscribe:o=>{window.__push.push({op:'subscribe',userVisibleOnly:o.userVisibleOnly,chave:o.applicationServerKey.length});window.__pushSub=sub;return Promise.resolve(sub);}}};
  Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{register:u=>{window.__push.push({op:'register',u});return Promise.resolve(reg);},ready:Promise.resolve(reg)}});
  window.PushManager=function(){};
  window.Notification={permission:'default',requestPermission:()=>{window.Notification.permission='granted';return Promise.resolve('granted');}};
};
test('p4.40 apito: o link do rodape pede a permissao, assina com a chave do banco e grava a assinatura', async ({page})=>{
  await page.addInitScript(PUSH_DUBLE);
  const erros = await abrir(page);
  await page.evaluate(()=>{ const r=sb.rpc; sb.rpc=(n,a)=>n==='push_chave_publica'?(window.__rpc.push({n,a}),Promise.resolve({data:'B'+'A'.repeat(86),error:null})):r(n,a); });
  expect(await page.evaluate(()=>window.__push.filter(p=>p.op==='register').map(p=>p.u)), 'registra o sw.js').toEqual(['sw.js']);
  await page.locator('#avisoLink').click();
  await expect(page.locator('#avisoLink'), 'o link passa a dizer que o aparelho recebe').toHaveText('Avisos ativos neste aparelho');
  const sub = await page.evaluate(()=>window.__push.find(p=>p.op==='subscribe'));
  expect(sub, 'assina so com aviso visivel e com a chave de 65 bytes').toEqual({op:'subscribe',userVisibleOnly:true,chave:65});
  const gravou = await page.evaluate(()=>window.__rpc.find(r=>r.n==='push_assinar'));
  expect(gravou && gravou.a.p_endpoint).toBe('https://web.push.apple.com/teste');
  expect(gravou && gravou.a.p_p256dh.length).toBe(87);
  expect(gravou && gravou.a.p_auth.length).toBe(22);
  expect(erros).toEqual([]);
});
test('p4.40 apito: sem suporte a push (iPhone fora da Tela de Inicio) o toque explica e nao chama o banco', async ({page})=>{
  await page.addInitScript(()=>{ delete window.PushManager; Object.defineProperty(navigator,'userAgent',{get:()=>'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'}); });
  const erros = await abrir(page);
  await page.locator('#avisoLink').click();
  await expect(page.locator('#tmsg')).toContainText('Tela de Início');
  expect(await page.evaluate(()=>window.__rpc.filter(r=>/^push_/.test(r.n)).length), 'nada vai ao banco').toBe(0);
  expect(erros).toEqual([]);
});
test('p4.40 apito: o sw.js mostra o aviso recebido e o toque abre o painel', async ()=>{
  const sw = require('fs').readFileSync(path.resolve(__dirname, '..', 'sw.js'), 'utf8');
  expect(sw).toMatch(/addEventListener\('push'/);
  expect(sw).toMatch(/showNotification\(/);
  expect(sw).toMatch(/addEventListener\('notificationclick'/);
  expect(sw).toMatch(/openWindow\(/);
  expect(sw, 'sem cache: o painel le o banco ao vivo').not.toMatch(/caches\.|addEventListener\('fetch'/);
});

/* p4.51 (s2878, 12/10/2026, p136): o Igor tocou no aviso das 7h e o app abriu na ultima tela. Com a janela ja aberta em
   segundo plano, o sw.js so fazia focus(). Agora a janela recebe o destino e vai ate ele; o aviso leva o destino no link. */
function rodarSW(janelas, url, op={}){
  const vm = require('vm');
  const sw = require('fs').readFileSync(path.resolve(__dirname, '..', 'sw.js'), 'utf8');
  const ouv = {}, abertos = [], msgs = [], focos = [], navegou = [];
  const janela = u => { const w = { url:u, focus(){ focos.push(w.url); return Promise.resolve(w); }, postMessage(m){ msgs.push({ de:u, m }); } };
    /* p4.52: o WindowClient.navigate do navegador; recusar = janela fora do controle do sw */
    if (op.navigate !== 'ausente') w.navigate = d => { if (op.navigate === 'recusa') return Promise.reject(new TypeError('nao controlada'));
      navegou.push({ de:u, para:d }); w.url = d; return Promise.resolve(w); };
    return w; };
  const self = { addEventListener:(t,f)=>{ ouv[t]=f; }, skipWaiting(){},
    registration:{ scope:'https://x.test/cerebro-painel/', showNotification:()=>Promise.resolve() },
    clients:{ claim(){}, openWindow:u=>{ abertos.push(u); return Promise.resolve(op.abreNada ? null : janela(u)); },
      matchAll:()=>Promise.resolve(janelas.map(janela)) } };
  vm.runInNewContext(sw, { self, URL });
  let espera = Promise.resolve();
  ouv.notificationclick({ notification:{ close(){}, data:url?{url}:{} }, waitUntil:p=>{ espera=p; } });
  return espera.then(()=>({ abertos, msgs: msgs.map(x=>x.m), msgsDe: msgs, focos, navegou }));
}
test('p4.51 aviso: tocar com o app aberto leva ao destino do aviso, nao a ultima tela', async ()=>{
  const destino = 'https://x.test/cerebro-painel/presidente.html?abrir=mesa';
  const aberto = await rodarSW(['https://x.test/cerebro-painel/presidente.html'], './presidente.html?abrir=mesa');
  expect(aberto.msgs, 'a janela aberta recebe o destino').toEqual([{ tipo:'abrir', url:destino }]);
  expect(aberto.focos.length, 'e vem para a frente').toBe(1);
  expect(aberto.abertos, 'sem abrir janela nova').toEqual([]);
  const fechado = await rodarSW([], './presidente.html?abrir=mesa');
  expect(fechado.abertos, 'app fechado abre ja no destino').toEqual([destino]);
  const semUrl = await rodarSW([], null);
  expect(semUrl.abertos, 'aviso sem destino abre o Hoje').toEqual(['https://x.test/cerebro-painel/presidente.html?abrir=hoje']);
});
/* p4.52 (s3056, 12/10/2026, p136): o teste do Igor reprovou a p4.51. A janela aberta do app era o bastidor (index.html):
   o sw.js so mandava a mensagem e focava, o bastidor nao ouvia, e o toque trazia o bastidor em vez do Hoje.
   A p4.51 reprova aqui: com a janela fora da pagina do destino, o toque tem de chegar ao destino. */
test('p4.52 aviso: tocar com o bastidor aberto leva ao destino no presidente, nao ao bastidor', async ()=>{
  const destino = 'https://x.test/cerebro-painel/presidente.html?abrir=hoje';
  const idx = 'https://x.test/cerebro-painel/index.html';
  const nav = await rodarSW([idx], './presidente.html?abrir=hoje');
  expect(nav.navegou, 'a janela do bastidor navega ate o destino').toEqual([{ de:idx, para:destino }]);
  expect(nav.focos, 'e vem para a frente ja no destino').toEqual([destino]);
  expect(nav.abertos, 'sem abrir janela nova').toEqual([]);
  const recusa = await rodarSW([idx], './presidente.html?abrir=hoje', { navigate:'recusa' });
  expect(recusa.abertos, 'navegador recusou navegar: abre o destino (reserva)').toEqual([destino]);
  const semNav = await rodarSW([idx], './presidente.html?abrir=hoje', { navigate:'ausente', abreNada:true });
  expect(semNav.abertos, 'sem navigate, tenta abrir o destino').toEqual([destino]);
  expect(semNav.msgs, 'e por ultimo avisa o bastidor, que ouve').toEqual([{ tipo:'abrir', url:destino }]);
  const duas = await rodarSW([idx, 'https://x.test/cerebro-painel/presidente.html'], './presidente.html?abrir=mesa');
  expect(duas.msgsDe, 'com bastidor e presidente abertos, quem recebe e o presidente').toEqual([{ de:'https://x.test/cerebro-painel/presidente.html', m:{ tipo:'abrir', url:'https://x.test/cerebro-painel/presidente.html?abrir=mesa' } }]);
  expect(duas.navegou, 'sem recarregar ninguem').toEqual([]);
});
test('p4.51 aviso: o link ?abrir= abre a aba na partida e sai da barra', async ({page})=>{
  const erros=[]; page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(DUBLE);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA+'?abrir=caixa');
  await expect(page.locator('#tituloAba')).toHaveText('Caixa');
  expect(page.url(), 'o parametro sai da barra').not.toContain('abrir=');
  await page.goto(PAGINA+'?abrir=nao-existe');
  await expect(page.locator('#tituloAba')).toHaveText('Hoje');
  expect(erros).toEqual([]);
});
test('p4.51 aviso: com o app aberto, o toque leva a aba ou a peca e rele o banco', async ({page})=>{
  const erros = await abrirMesa(page);
  const p = await page.evaluate(()=>{ const x=msEst(MS.dados)[0]; return {id:x.id, titulo:x.titulo}; });
  await page.evaluate(()=>ir('hoje'));
  const cargas0 = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length);
  await page.evaluate(()=>aoAvisoTocado({tipo:'abrir', url:'https://x.test/cerebro-painel/presidente.html?abrir=caixa'}));
  await expect(page.locator('#tituloAba')).toHaveText('Caixa');
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_carga').length), 'rele o banco').toBeGreaterThan(cargas0);
  await page.evaluate(id=>aoAvisoTocado({tipo:'abrir', url:'./presidente.html?peca='+id}), p.id);
  await expect(page.locator('#tituloAba')).toHaveText('Mesa');
  await expect(page.locator('#folhaTit')).toHaveText(p.titulo);
  expect(erros).toEqual([]);
});

/* p4.42 (p127, s1898 11/10/2026): o bastidor deixa de decidir, entao a decisao da bandeja vem para o presidente. Card PRONTO
   mostra o que aconteceu com a peca (Feito, Enviei, Refazer, Descartar); DECISAO da bandeja mostra Recusar. Tudo vai pela
   painel_responder, so depois dos 8 s de desfazer; Refazer e Recusar levam motivo opcional. Card fora da bandeja nao ganha
   o bloco. A p4.41 reprova aqui: o presidente nao lia a chave band e nao tinha porta para a peca pronta. */
const CARD_BAND = {id:8,frente:'20-contrato-pj',dono:'igor',status:'pendente',prazo:null,parado_dias:2,titulo:'Peca da bandeja',
  acoes:[{verbo:'feita',rotulo:'feita',arg:null}]};
const responder = page=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_responder').map(c=>c.a));

test('p127: a carga pede a bandeja e o card PRONTO grava o que aconteceu pela painel_responder', async ({page})=>{
  await page.setViewportSize({width:360, height:800});
  await abrir(page);
  const chaves = await page.evaluate(()=>(window.__rpc.find(c=>c.n==='painel_carga')||{a:{}}).a.p_chaves||[]);
  expect(chaves, 'a carga pede a chave band').toContain('band');
  await page.evaluate(c=>{window.__dados={band:[{tipo:'PRONTO',item_id:8},{tipo:'DECISAO',item_id:9}]};D.band=window.__dados.band;INV.push(c);abrirInv(8);}, CARD_BAND);
  const bloco = page.locator('#folha #band');
  await expect(bloco).toContainText('O que aconteceu com a peça?');
  for (const nome of ['Concluir','Enviei','Refazer','Descartar']) {
    const h = await bloco.locator(`button:has-text("${nome}")`).evaluate(b=>b.getBoundingClientRect().height);
    expect(h, nome+' abaixo de 44 px').toBeGreaterThanOrEqual(44);
  }
  await bloco.locator('button:has-text("Enviei")').click();
  expect(await responder(page), 'nada grava antes do desfazer').toEqual([]);
  await page.evaluate(()=>enviar());
  expect(await responder(page)).toEqual([{p_tipo:'PRONTO',p_id:8,p_ato:'enviado',p_nota:null}]);

  await page.evaluate(()=>{window.__rpc=[];abrirInv(8);});
  await page.locator('#folha #band button:has-text("Refazer")').click();
  await page.locator('#campo textarea').fill('Falta a planilha anexa');
  await page.locator('#campo button:has-text("Devolver para refazer")').click();
  await page.evaluate(()=>enviar());
  expect(await responder(page)).toEqual([{p_tipo:'PRONTO',p_id:8,p_ato:'refazer',p_nota:'Falta a planilha anexa'}]);
});

test('p127: DECISAO da bandeja ganha Recusar com motivo opcional; card fora da bandeja nao ganha bloco', async ({page})=>{
  await abrir(page);
  await page.evaluate(c=>{window.__dados={band:[{tipo:'DECISAO',item_id:9}]};D.band=window.__dados.band;INV.push({...c,id:9});INV.push({...c,id:10});abrirInv(9);}, CARD_BAND);
  const bloco = page.locator('#folha #band');
  await expect(bloco.locator('button')).toHaveText(['Recusar']);
  await bloco.locator('button:has-text("Recusar")').click();
  await page.locator('#campo button:has-text("Recusar")').click();
  await page.evaluate(()=>enviar());
  expect(await responder(page)).toEqual([{p_tipo:'DECISAO',p_id:9,p_ato:'recusado',p_nota:null}]);
  await page.evaluate(()=>abrirInv(10));
  await expect(page.locator('#folha #band'), 'card 10 fora da bandeja').toHaveCount(0);
});

/* p4.44 (p168, E2.8 do WL, s2214 11/10/2026): o texto pronto sai pelo WhatsApp sem numero e sem gravar nada; o
   check-in de segunda vem do banco (painel_checkin), abre pela tecla C ou pela frente do socio, e so sai por Copiar
   ou WhatsApp, com o texto revisado. O origin/main (p4.43) reprova: nao ha "Abrir no WhatsApp" nem tecla C. */
const ABRE_JANELA = ()=>{ window.__abertos=[]; window.open=(u,t)=>{ window.__abertos.push({u,t}); return {opener:1}; }; };
test('p4.44 cobrar: Abrir no WhatsApp leva o rascunho ao wa.me sem numero e nao grava; sem rascunho nao ha o botao', async ({page})=>{
  const cob = COB3.concat([{origem:'tarefa',ref:'9',titulo:'Pedido sem rascunho de exemplo',terceiro:'Outro de exemplo',retorno_esperado:'2026-10-09',dias:1,rascunho:''}]);
  await page.addInitScript(c=>{ window.__dados={cob3:c}; }, cob);
  await page.addInitScript(ABRE_JANELA);
  const erros = await abrir(page);
  const box = page.locator('#cob3Box'), linhas = box.locator('.cob3');
  await expect(linhas).toHaveCount(3);
  await expect(box.locator('button[data-acao="whatsCobranca"]'), 'so as linhas com rascunho').toHaveCount(2);
  await expect(linhas.nth(2).locator('button[data-acao="whatsCobranca"]')).toHaveCount(0);
  for (const b of await box.locator('button').all())
    expect(await b.evaluate(x=>x.getBoundingClientRect().height), 'botao abaixo de 44 px').toBeGreaterThanOrEqual(44);
  await linhas.nth(0).locator('button[aria-label="Abrir no WhatsApp"]').click();
  const ab = await page.evaluate(()=>window.__abertos);
  expect(ab.length).toBe(1);
  expect(ab[0].u, 'wa.me com o texto e sem numero').toBe('https://wa.me/?text='+encodeURIComponent('Bom dia! Rascunho de exemplo.'));
  expect(ab[0].u).not.toMatch(/wa\.me\/\d/);
  await expect(page.locator('#tmsg')).toContainText('Escolha o contato');
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir'||c.n==='inbox').length), 'abrir o WhatsApp nao grava').toBe(0);
  for (const w of [360, 390]) {
    await page.setViewportSize({width:w, height:820});
    const m = await page.evaluate(()=>{ document.body.style.letterSpacing='1.5px'; return {W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth}; });
    expect(m.SW, `rolagem horizontal a ${w}`).toBe(m.W);
  }
  expect(erros).toEqual([]);
});

test('p4.44 check-in: C abre o texto do banco para revisar; Copiar e WhatsApp nao gravam; toda frente tem o botao (p4.66); recusa se declara', async ({page})=>{
  await page.addInitScript(ABRE_JANELA);
  const erros = await abrir(page);
  await page.locator('body').click({position:{x:2,y:2}});
  await page.keyboard.press('c');
  await expect(page.locator('#folhaTit')).toHaveText('Check-in de segunda');
  const ta = page.locator('#chkTxt');
  await expect(ta).toHaveValue(/^Check-in Exemplo · seg 13\/10\n1\. Fiz: /);
  await expect(ta).not.toHaveAttribute('readonly', /.*/);
  const ch = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_checkin').map(c=>c.a));
  expect(ch, 'o texto vem do banco, da frente do proximo passo de Hoje (p4.66: nao ha mais frente fixa)').toEqual([{p_frente:'11-renda-alt'}]);
  /* revisar antes de mandar: o WhatsApp leva o texto como ficou na folha */
  await ta.fill('Check-in revisado de exemplo');
  await page.locator('#folha button:has-text("Abrir no WhatsApp")').click();
  expect((await page.evaluate(()=>window.__abertos))[0].u).toBe('https://wa.me/?text='+encodeURIComponent('Check-in revisado de exemplo'));
  await page.locator('#folha button:has-text("Copiar")').click();
  await expect(page.locator('#tmsg')).toContainText(/opiado|copie à mão/);
  for (const b of await page.locator('#folha button').all())
    expect(await b.evaluate(x=>x.getBoundingClientRect().height), 'botao da folha abaixo de 44 px').toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(()=>window.__rpc.filter(c=>!['painel_carga','painel_checkin','painel_ping','atendente_estado','painel_snapshot_montar','painel_medir_decisao','mesa_painel','subida_painel'].includes(c.n)).map(c=>c.n)),
    'nada grava pelo check-in').toEqual([]);
  await page.evaluate(()=>fecharFolha());
  await page.evaluate(()=>{ ir('frentes'); abrirFrente('20-contrato-pj'); });
  const bt = page.locator('#folha button:has-text("Check-in de segunda")');
  await expect(bt, 'qualquer frente oferece o check-in').toHaveCount(1);
  await page.evaluate(()=>{ window.__checkin='RECUSADO: sessao sem dono autorizado.'; });
  await bt.click();
  expect((await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_checkin').map(c=>c.a))).pop(), 'o botao leva a frente da ficha').toEqual({p_frente:'20-contrato-pj'});
  await expect(page.locator('#chkErro')).toHaveText('Não montou: sessao sem dono autorizado.');
  await expect(page.locator('#chkTxt')).toHaveValue('');
  await page.locator('#folha button:has-text("Abrir no WhatsApp")').click();
  expect((await page.evaluate(()=>window.__abertos)).length, 'texto recusado nao vai ao WhatsApp').toBe(1);
  /* e outra frente tambem tem o botao */
  await page.evaluate(()=>{ fecharFolha(); abrirFrente('04-obra-residencial'); });
  await expect(page.locator('#folha button:has-text("Check-in de segunda")')).toHaveCount(1);
  expect(erros).toEqual([]);
});

test('p4.44 demonstracao: check-in ficticio sem marca real e o WhatsApp so avisa, sem sair para a rede', async ({page})=>{
  await page.addInitScript(ABRE_JANELA);
  const {erros, rede} = await abrirDemo(page, 390);
  await page.locator('body').click({position:{x:2,y:2}});
  await page.keyboard.press('c');
  const ta = page.locator('#chkTxt');
  await expect(ta).toHaveValue(/^Check-in Startup · seg \d\d\/\d\d\n1\. Fiz: /);
  expect(await ta.inputValue()).not.toMatch(/Dabli/);
  await page.locator('#folha button:has-text("Abrir no WhatsApp")').click();
  await expect(page.locator('#tmsg')).toContainText('Na demonstração o WhatsApp não abre');
  expect(await page.evaluate(()=>window.__abertos.length), 'nenhuma janela abre na demonstracao').toBe(0);
  expect(await page.evaluate(()=>window.__rpc.length), 'o duble do banco nao recebe nada').toBe(0);
  expect(rede, 'nada sai para a rede').toEqual([]);
  expect(erros).toEqual([]);
});

/* p132 (p4.45, s2468 11/10/2026): o painel tem de ser instalavel de verdade nos dois aparelhos do Igor. O manifest so
   tinha um SVG embutido: o Chrome do Android pede PNG 192 e 512, e o iPhone ignora o manifest e usa o apple-touch-icon
   (sem ele, a Tela de Inicio ganha uma foto da pagina). O p4.44 reprova: nenhum PNG no manifest, nenhum apple-touch-icon. */
test('p132: manifest com PNG 192/512 e maskable, apple-touch-icon 180 no presidente, arquivos existem no tamanho certo', ()=>{
  const raiz = path.resolve(__dirname,'..');
  const lado = arq => { const b = fs.readFileSync(path.join(raiz,arq)); // cabecalho PNG: largura e altura no IHDR
    expect(b.slice(1,4).toString(), arq+' e PNG').toBe('PNG'); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  const m = JSON.parse(fs.readFileSync(path.join(raiz,'manifest.json'),'utf8'));
  const png = m.icons.filter(i => i.type === 'image/png');
  for (const [sz, prop] of [['192x192','any'],['512x512','any'],['512x512','maskable']]) {
    const i = png.find(x => x.sizes === sz && x.purpose === prop);
    expect(i, `manifest sem PNG ${sz} ${prop}`).toBeTruthy();
    expect(lado(i.src).join('x'), i.src).toBe(sz);
  }
  const fonte = fs.readFileSync(path.join(raiz,'presidente.html'),'utf8');
  const apple = fonte.match(/<link rel="apple-touch-icon" href="([^"]+)">/);
  expect(apple, 'presidente sem apple-touch-icon: o iPhone poe uma foto da pagina').toBeTruthy();
  expect(lado(apple[1]).join('x')).toBe('180x180');
  expect(fonte).toMatch(/<meta name="apple-mobile-web-app-capable" content="yes">/);
});

/* p108 (p4.46, s2468 11/10/2026): small multiples na aba Frentes. Cada frente com serie de margem realizada de 8 semanas
   (v_frente_semanas), TODAS na mesma escala, e "piorou" so na frente cuja soma movel de 4 semanas cheias caiu. O p4.45
   reprova: nenhuma sparkline. Na demonstracao so a consultoria piorou (entrou 2.500, saiu 3.000); o contrato PJ, com
   medicao mensal de 12 mil, NAO piora so porque a semana seguinte a medicao vem zerada (a regra semana a semana acusava). */
test('p108: aba Frentes em small multiples, 8 barras por frente na mesma escala e "piorou" na frente certa', async ({page})=>{
  const {erros, rede} = await abrirDemo(page, 390);
  await page.evaluate(()=>ir('frentes'));
  const linhas = page.locator('#frentesLista button.frente');
  await expect(linhas.first().locator('svg.spark8')).toHaveCount(1);
  const n = await linhas.count();
  const sp = await page.$$eval('#frentesLista button.frente', bs=>bs.map(b=>{ const s=b.querySelector('svg.spark8');
    return {txt:b.querySelector('b').textContent, escala:s&&s.dataset.escala, barras:s?s.querySelectorAll('rect').length:0, pio:b.classList.contains('piorou')}; }));
  expect(sp.length, 'mediu todas as frentes listadas').toBe(n);
  expect(sp.every(x=>x.barras===8), 'cada frente com 8 semanas').toBe(true);
  expect(new Set(sp.map(x=>x.escala)).size, 'mesma escala em todas: comparar sem ler numero').toBe(1);
  expect(sp.filter(x=>x.pio).map(x=>x.txt.replace(/\s*piorou$/,'')).sort()).toEqual(['Consultoria de obras']);
  await expect(page.locator('#frentesLista button.frente', {hasText:'Consultoria de obras'}).locator('small')).toContainText('o mais velho tem 34 d');
  expect(rede).toEqual([]);
  expect(erros).toEqual([]);
});

/* p4.47 (p158, E1.6 do WL, s2655 11/10/2026): rotina sugere, o Igor aceita. O sensor de arquivo grava sugestao e o card so
   nasce no aceite. O grupo aparece no Hoje com Virar card e Descartar; nada grava antes dos 8 s de desfazer; o ato vai pela
   painel_responder com tipo SUGESTAO; desfazer devolve a linha; sem a chave sug o grupo some e a falta e avisada.
   O origin/main (p4.46) reprova: nao ha #sugBox nem a chave sug na carga. */
const SUG = [{id:41,fonte:'sensor-dabli',frente_slug:'20-contrato-pj',titulo:'Ler arquivos novos do socio no compartilhado',dias:1},
  {id:42,fonte:'sensor-arquivo',frente_slug:'11-renda-alt',titulo:'Conferir a planilha nova de exemplo',dias:0}];
test('p4.47 sugestoes: grupo no Hoje; Virar card e Descartar gravam pela painel_responder so depois do desfazer', async ({page})=>{
  await page.setViewportSize({width:360, height:800});
  await page.addInitScript(c=>{ window.__dados={sug:c}; }, SUG);
  const erros = await abrir(page);
  const carga = await page.evaluate(()=>window.__rpc.find(c=>c.n==='painel_carga'));
  expect(carga.a.p_chaves, 'a carga pede a chave sug').toContain('sug');
  const box = page.locator('#sugBox'), linhas = box.locator('.cob3');
  await expect(box).toBeVisible();
  await expect(linhas).toHaveCount(2);
  await expect(linhas.nth(0)).toContainText('Ler arquivos novos do socio no compartilhado');
  await expect(linhas.nth(1)).toContainText('sensor-arquivo · hoje');
  for (const b of await box.locator('button').all())
    expect(await b.evaluate(x=>x.getBoundingClientRect().height), 'botao abaixo de 44 px').toBeGreaterThanOrEqual(44);
  const ruins = (await page.evaluate(contrasteDos, '#sugBox *')).filter(m=>m.razao<4.5);
  expect(ruins, 'texto do grupo abaixo de 4,5:1').toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth), 'sem rolagem horizontal a 360').toBe(true);
  await linhas.nth(0).locator('button[data-acao="sugAceitar"]').click();
  await page.locator('button[data-acao="sugConfirmar"]').click();
  await expect(linhas, 'a sugestao aceita sai do grupo na hora').toHaveCount(1);
  expect(await responder(page), 'nada grava antes do desfazer').toEqual([]);
  await page.locator('#tbtn').click();
  await expect(linhas, 'desfazer devolve a sugestao').toHaveCount(2);
  expect(await responder(page)).toEqual([]);
  await linhas.nth(0).locator('button[data-acao="sugAceitar"]').click();
  await page.locator('button[data-acao="sugConfirmar"]').click();
  await page.evaluate(()=>enviar());
  const aceite = await responder(page);
  expect(aceite.length).toBe(1);
  expect(aceite[0]).toMatchObject({p_tipo:'SUGESTAO',p_id:41,p_ato:'aceito',p_nota:null});
  expect(aceite[0].p_prazo, 'o aceite leva a data do card').toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await page.evaluate(()=>{window.__rpc=[];});
  await box.locator('button[data-acao="sugDescartar"]').first().click();
  await page.evaluate(()=>enviar());
  expect(await responder(page)).toEqual([{p_tipo:'SUGESTAO',p_id:42,p_ato:'descartar',p_nota:null}]);
  expect(erros).toEqual([]);
});

/* p4.63 (fato 2217 item 0b, s5417 16/10/2026): Virar card pede a data antes de confirmar. Padrao: o prazo da sugestao, se houver
   e nao passou; senao hoje pelo relogio de Cuiaba (o teste roda com o navegador em Tokyo, onde a data local ja e a de amanha).
   Data no passado e recusada; Descartar nao pede data; sem a data escolhida nada grava. O origin/main (p4.62) reprova:
   Virar card gravava direto, sem folha #sugDt e sem p_prazo. */
test('p4.63 Virar card pede a data: padrao = prazo da sugestao, senao hoje de Cuiaba; vai como p_prazo', async ({browser})=>{
  const ctx = await browser.newContext({timezoneId:'Asia/Tokyo', viewport:{width:360,height:800}});
  const page = await ctx.newPage();
  const cuiaba = await page.evaluate(()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Cuiaba'}).format(new Date()));
  const futuro = new Date(Date.now()+9*864e5).toISOString().slice(0,10);
  await page.addInitScript(c=>{ window.__dados={sug:c}; },
    [{id:51,fonte:'sensor-dabli',frente_slug:'20-contrato-pj',titulo:'Sugestao com prazo',dias:1,prazo:futuro},
     {id:52,fonte:'sensor-arquivo',frente_slug:'11-renda-alt',titulo:'Sugestao sem prazo',dias:0,prazo:null}]);
  const erros = await abrir(page);
  const linhas = page.locator('#sugBox .cob3');
  await linhas.nth(0).locator('button[data-acao="sugAceitar"]').click();
  await expect(page.locator('#sugDt'), 'com prazo na sugestao, a data abre nele').toHaveValue(futuro);
  expect(await responder(page), 'abrir a folha nao grava').toEqual([]);
  await page.locator('#sugDt').fill('2020-01-01');
  await page.locator('button[data-acao="sugConfirmar"]').click();
  await expect(page.locator('#sugErro'), 'data no passado e recusada').toBeVisible();
  await expect(linhas, 'recusada, a sugestao fica').toHaveCount(2);
  await page.locator('#sugDt').fill(futuro);
  await page.locator('button[data-acao="sugConfirmar"]').click();
  await page.evaluate(()=>enviar());
  expect(await responder(page)).toEqual([{p_tipo:'SUGESTAO',p_id:51,p_ato:'aceito',p_nota:null,p_prazo:futuro}]);
  await page.evaluate(()=>{window.__rpc=[];});
  await page.locator('#sugBox .cob3').first().locator('button[data-acao="sugAceitar"]').click();
  await expect(page.locator('#sugDt'), 'sem prazo, o padrao e hoje de Cuiaba, nao o do aparelho').toHaveValue(cuiaba);
  await page.locator('button[data-acao="sugConfirmar"]').click();
  await page.evaluate(()=>enviar());
  expect(await responder(page)).toEqual([{p_tipo:'SUGESTAO',p_id:52,p_ato:'aceito',p_nota:null,p_prazo:cuiaba}]);
  expect(erros).toEqual([]);
  await ctx.close();
});

test('p4.47 sugestoes: snapshot sem a chave sug esconde o grupo e diz que a parte nao chegou, sem erro', async ({page})=>{
  await page.addInitScript(()=>{ window.__sem=['sug']; });
  const erros = await abrir(page);
  await expect(page.locator('#falha'), 'chave faltando vira aviso, nunca silencio').toContainText('sug');
  await expect(page.locator('#sugBox')).toBeHidden();
  expect(erros).toEqual([]);
});

/* p4.48 (p167 etapa 5, s2655 11/10/2026): plano mestre. O plano unico mora no banco (v_plano_mestre, chave plm do snapshot)
   e a aba Frentes abre uma folha por etapa, com dono e prazo de cada item aberto; o atrasado ganha a marca. Abrir o plano
   nao grava nada. O origin/main (p4.47) reprova: nao ha #btPlano nem a chave plm na carga. */
const PLM = [
  {id:1,etapa:'E1',etapa_nome:'Fila e aceite',titulo:'Item um de exemplo',dono:'automacao',prazo:'2026-10-20',dias_para_prazo:5,atrasado:false},
  {id:2,etapa:'E1',etapa_nome:'Fila e aceite',titulo:'Item dois de exemplo',dono:'igor',prazo:'2026-10-10',dias_para_prazo:-1,atrasado:true},
  {id:3,etapa:'avulso',etapa_nome:'Itens avulsos',titulo:'Item avulso de exemplo',dono:'claude',prazo:null,dias_para_prazo:null,atrasado:false}];
test('p4.48 plano mestre: carga pede plm; a aba Frentes abre a folha por etapa, com dono e prazo, sem gravar nada', async ({page})=>{
  await page.setViewportSize({width:360, height:800});
  await page.addInitScript(c=>{ window.__dados={plm:c}; }, PLM);
  const erros = await abrir(page);
  const carga = await page.evaluate(()=>window.__rpc.find(c=>c.n==='painel_carga'));
  expect(carga.a.p_chaves, 'a carga pede a chave plm').toContain('plm');
  await page.evaluate(()=>ir('frentes'));
  const bt = page.locator('#btPlano');
  await expect(bt).toBeVisible();
  expect(await bt.evaluate(b=>b.getBoundingClientRect().height), 'botao abaixo de 44 px').toBeGreaterThanOrEqual(44);
  const n0 = await page.evaluate(()=>window.__rpc.length);
  await bt.click();
  const folha = page.locator('#folha');
  await expect(folha.locator('#folhaTit')).toHaveText('Plano mestre');
  await expect(folha.locator('.bloco.plano .rot')).toHaveText(['Fila e aceite','Itens avulsos']);
  await expect(folha.locator('.bloco.plano .fonte')).toHaveCount(3);
  await expect(folha.locator('.bloco.plano .fonte').nth(0)).toContainText('máquina · até 20/10');
  await expect(folha.locator('.bloco.plano .fonte').nth(1)).toContainText('você · atrasado desde 10/10');
  await expect(folha.locator('.bloco.plano .fonte').nth(2)).toContainText('Claude · sem prazo');
  await expect(folha.locator('.chips')).toContainText('3 itens abertos');
  await expect(folha.locator('.chips')).toContainText('1 atrasado');
  const ruins = (await page.evaluate(contrasteDos, '#folha *')).filter(m=>m.razao<4.5);
  expect(ruins, 'texto da folha abaixo de 4,5:1').toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth), 'sem rolagem horizontal a 360').toBe(true);
  expect(await page.evaluate(()=>window.__rpc.length), 'abrir o plano nao chama o banco').toBe(n0);
  expect(erros).toEqual([]);
});

test('p4.48 plano mestre: snapshot sem a chave plm avisa a falta e a folha diz que o plano nao chegou', async ({page})=>{
  await page.addInitScript(()=>{ window.__sem=['plm']; });
  const erros = await abrir(page);
  await expect(page.locator('#falha'), 'chave faltando vira aviso, nunca silencio').toContainText('plm');
  await page.evaluate(()=>ir('frentes'));
  await page.locator('#btPlano').click();
  await expect(page.locator('#folha')).toContainText('O plano não chegou');
  expect(erros).toEqual([]);
});


/* p4.54 (p157, s3286 12/10/2026): um toque com Desfazer. A classe que se cobra: decisao gravada num toque so, adiar
   que muda o prazo real (o sensor deixava de acusar), ato sem volta depois dos segundos de desfazer e porta do painel
   que recebe texto onde bastava id e inteiro. A p4.53 reprova: S abria a nova data, um toque gravava a escolha, Z nao
   fazia nada, o desfazer durava 6 s e nao havia painel_esconder, painel_desfazer nem painel_atos_recentes. */
test('p157 adiar so esconde: S abre amanha, 3 dias e 1 semana; grava painel_esconder com id e dias, so depois de 8 s', async ({page})=>{
  const erros = await abrir(page);
  await page.clock.install();
  await page.evaluate(()=>abrirFila(0));
  await page.keyboard.press('s');
  await expect(page.locator('#campo')).toContainText('o prazo real continua valendo');
  const bts = page.locator('#campo .datas button');
  await expect(bts).toHaveCount(3);
  for (const b of await bts.all())
    expect(await b.evaluate(x=>x.getBoundingClientRect().height), 'botao abaixo de 44 px').toBeGreaterThanOrEqual(44);
  await bts.nth(1).click();
  await expect(page.locator('#tbtn'), 'o aviso traz o desfazer').toBeVisible();
  await page.clock.fastForward(7000);
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_esconder').length), 'aos 7 s ainda da para desfazer').toBe(0);
  await page.clock.fastForward(1100);
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_esconder').map(c=>c.a))).toEqual([{p_tarefa_id:2,p_dias:3}]);
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').length), 'esconder nao passa pelo agir nem mexe no prazo').toBe(0);
  expect(erros).toEqual([]);
});

test('p157 decisao com toque duplo: um toque arma e avisa; o segundo grava; tecla 2 arma e 2 de novo grava a opcao 2', async ({page})=>{
  const erros = await abrir(page);
  await page.evaluate(c=>{INV.push(c);abrirInv(8);}, CARD_DECISAO);
  const rat = page.locator('#folha #decide [data-acao="ratifico"]');
  await rat.click();
  await expect(rat, 'o 1o toque marca o botao').toHaveClass(/arma/);
  await expect(page.locator('#tmsg')).toContainText('Toque de novo em Ratifico');
  expect(await page.evaluate(()=>PEND), 'um toque nao pendura nada').toBeNull();
  await rat.click();
  expect(await page.evaluate(()=>PEND&&PEND.escolha)).toBe('Assinar agora');
  await page.evaluate(()=>desfazer());
  await page.evaluate(()=>abrirInv(8));
  await page.keyboard.press('2');
  await expect(page.locator('#tmsg')).toContainText('Aperte 2 de novo');
  expect(await page.evaluate(()=>PEND)).toBeNull();
  await page.keyboard.press('2');
  expect(await page.evaluate(()=>PEND&&PEND.escolha)).toBe('Adiar uma semana');
  await page.evaluate(()=>enviar());
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='escolher').map(c=>c.a))).toEqual([{p_ref:'8',p_opcao:'Adiar uma semana'}]);
  await page.evaluate(()=>abrirInv(8));
  await page.keyboard.press('7');
  await expect(page.locator('#folha')).toBeVisible();
  expect(erros).toEqual([]);
});

test('p157 X conclui e Z desfaz: com ato esperando, Z cancela; sem, abre os Ultimos atos; Desfazer manda so o id', async ({page})=>{
  await page.addInitScript(()=>{ window.__atos=[
    {acao_id:41,origem:'tarefa',ref:'2',verbo:'feita',titulo:'Card de exemplo',agido_em:new Date().toISOString(),pode:true,motivo:'pode desfazer'},
    {acao_id:40,origem:'tarefa',ref:'5',verbo:'repactuar',titulo:'Segundo card',agido_em:new Date().toISOString(),pode:false,motivo:'o card mudou depois do ato'}]; });
  const erros = await abrir(page);
  await page.evaluate(()=>abrirFila(0));
  await page.keyboard.press('x');
  await expect(page.locator('#campo .pri'), 'X abre a prova de concluir').toHaveText('Concluir com esta prova');
  await page.evaluate(()=>{ escolher('repactuar'); });
  await page.click('#campo .datas button >> nth=0');
  expect(await page.evaluate(()=>!!PEND)).toBe(true);
  await page.keyboard.press('Escape');
  await page.keyboard.press('z');
  expect(await page.evaluate(()=>PEND), 'Z com ato esperando desfaz').toBeNull();
  await expect(page.locator('#tmsg')).toContainText('Nada foi gravado');
  await page.keyboard.press('z');
  await expect(page.locator('#folhaTit'), 'Z sem ato esperando abre os Ultimos atos').toHaveText('Últimos atos');
  const lis = page.locator('#atos li');
  await expect(lis).toHaveCount(2);
  await expect(lis.nth(0)).toContainText('Concluído');
  await expect(lis.nth(1), 'o que nao volta diz por que').toContainText('o card mudou depois do ato');
  await expect(lis.nth(1).locator('button')).toHaveCount(0);
  const bt = lis.nth(0).locator('button', {hasText:'Desfazer'});
  expect(await bt.evaluate(b=>b.getBoundingClientRect().height), 'botao abaixo de 44 px').toBeGreaterThanOrEqual(44);
  await bt.click();
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_desfazer').map(c=>c.a))).toEqual([{p_acao_id:41}]);
  await expect(page.locator('#tmsg')).toContainText('Desfeito');
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir').length), 'nada foi ao agir').toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth), 'sem rolagem horizontal').toBe(true);
  expect(erros).toEqual([]);
});

test('p157 contrato da tela: as portas do um toque recebem so id e inteiros, e a busca oferece os Ultimos atos', async ({page})=>{
  await page.addInitScript(()=>{ window.__desfazerR='RECUSADO: passou de 1 dia.'; window.__atos=[{acao_id:'9',origem:'tarefa',ref:'2',verbo:'esconder',titulo:'x',agido_em:new Date().toISOString(),pode:true,motivo:''}]; });
  const erros = await abrir(page);
  await page.keyboard.press('/');
  await page.locator('#busca [data-acao="abrirAtos"]').click();
  await page.locator('#atos button').click();
  await expect(page.locator('#tmsg'), 'a recusa do banco aparece em portugues').toContainText('Não desfez: passou de 1 dia.');
  await page.keyboard.press('Escape');
  await page.evaluate(()=>{ abrirFila(0); adiarEsconder(); });
  await page.click('#campo .datas button >> nth=2');
  await page.evaluate(()=>enviar());
  const r = await page.evaluate(()=>window.__rpc.filter(c=>['painel_desfazer','painel_esconder','painel_atos_recentes'].includes(c.n)).map(c=>c.a||{}));
  for (const a of r) for (const [k,v] of Object.entries(a))
    expect(Number.isInteger(v), k+' tem de ir como inteiro, foi '+JSON.stringify(v)).toBe(true);
  expect(r.length).toBeGreaterThanOrEqual(3);
  expect(erros).toEqual([]);
});

/* p4.55 (p109, s3409, 12/10/2026): funil da LC-14 no Caixa. A classe que mata: peca pronta somada como dinheiro.
   Pronta > enviada > aceita > paga, cada elo com a sua margem, o numero de itens e a idade do mais velho, e o toque
   abre a lista. Uma peca pronta de 9,9 milhoes e uma linha de paga que nao veio do fluxo de caixa nao podem mexer
   no total de paga. No main de antes nao existe #funil: o teste reprova. */
test('p109: o funil do Caixa tem 4 elos, pronta nunca soma em paga e cada elo abre a lista', async ({page})=>{
  await page.addInitScript(()=>{ window.__dados={funil:[
    {elo:'pronta',origem:'mesa',ref:'1',titulo:'Peca pronta gigante',frente_slug:'11-renda-alt',margem_rs:9999999,desde:'2026-09-11',idade_d:31,detalhe:'enviar'},
    {elo:'pronta',origem:'mesa',ref:'2',titulo:'Peca pronta sem valor',frente_slug:'11-renda-alt',margem_rs:null,desde:'2026-10-10',idade_d:2,detalhe:'assinar'},
    {elo:'enviada',origem:'proposta',ref:'PC-1',titulo:'Proposta de exemplo',frente_slug:'20-contrato-pj',margem_rs:4000,desde:'2026-10-01',idade_d:11,detalhe:null},
    {elo:'aceita',origem:'fluxo',ref:'31',titulo:'Recebivel de exemplo',frente_slug:'20-contrato-pj',margem_rs:2500,desde:'2026-09-20',idade_d:22,detalhe:'confirmado'},
    {elo:'paga',origem:'fluxo',ref:'32',titulo:'Recebido de exemplo',frente_slug:'20-contrato-pj',margem_rs:1500,desde:'2026-10-05',idade_d:7,detalhe:'recebido'},
    {elo:'paga',origem:'mesa',ref:'1',titulo:'Peca que nao e dinheiro',frente_slug:'11-renda-alt',margem_rs:5000000,desde:'2026-10-05',idade_d:7,detalhe:null}]}; });
  const erros=await abrir(page);
  await page.evaluate(()=>ir('caixa'));
  const r=await page.evaluate(()=>[...document.querySelectorAll('#funil button[data-elo]')].map(b=>({elo:b.dataset.elo,t:b.textContent})));
  expect(r.map(x=>x.elo),'quatro elos na ordem da LC-14').toEqual(['pronta','enviada','aceita','paga']);
  const paga=r.find(x=>x.elo==='paga').t, pronta=r.find(x=>x.elo==='pronta').t;
  expect(paga,'paga soma so o recebido do fluxo de caixa').toContain('R$ 1,5 mil');
  expect(paga,'peca pronta nunca soma em paga (vazada daria R$ 5.001,5 mil e 2 itens)').not.toMatch(/5\.00|10\.00|2 itens/);
  expect(paga).toContain('1 item');
  expect(pronta,'pronta: itens, idade do mais velho e sem valor declarado').toMatch(/2 itens · o mais velho há 31 dias · 1 sem valor/);
  expect(pronta,'pronta: margem do elo').toContain('R$ 10.000 mil');
  await page.locator('#funil button[data-elo="paga"]').click();
  const f=await page.evaluate(()=>({tit:document.getElementById('folhaTit').textContent,n:document.querySelectorAll('#folha .pilha .linha-r').length,txt:document.getElementById('folha').textContent}));
  expect(f.tit).toContain('Paga nos últimos 30 dias');
  expect(f.n,'o elo abre a sua lista, sem a peca').toBe(1);
  expect(f.txt).not.toContain('Peca que nao e dinheiro');
  await page.evaluate(()=>{fecharFolha();abrirFunil('pronta');});
  const g=await page.evaluate(()=>({n:document.querySelectorAll('#folha .pilha .linha-r').length,txt:document.getElementById('folha').textContent}));
  expect(g.n).toBe(2);
  expect(g.txt,'detalhe em lingua de gente, nunca o verbo cru').toContain('falta enviar');
  expect(g.txt).toContain('sem valor');
  expect(erros).toEqual([]);
});

/* p4.56 (p134, s3409, 12/10/2026): Enviar pelo painel. A classe que mata: peca pronta que so sai pelo computador e
   baixa que depende de o Igor lembrar de voltar e marcar. A peca de saida abre o WhatsApp com link assinado de 7 dias
   ou compartilha o arquivo; na volta o painel pergunta "Saiu?" e o sim da a baixa pelo mesa_baixa_painel. A cobranca
   que saiu pelo WhatsApp volta com "Cobrou?". No main de antes nao ha #msBtWhats nem a pergunta: os testes reprovam. */
const SAI_E_VOLTA = page=>page.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__oculto===true});
  window.__oculto=true; document.dispatchEvent(new Event('visibilitychange'));
  window.__oculto=false; document.dispatchEvent(new Event('visibilitychange')); });
const baixasP134 = page=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_baixa_painel').map(c=>c.a));
test('p134 Mesa: WhatsApp com link abre wa.me com link assinado de 7 dias e, na volta, Saiu? da a baixa por WhatsApp', async ({page})=>{
  const erros = await abrirMesa(page);
  await abaFalsa(page);
  await page.evaluate(()=>{ window.__storageUrl=p=>'https://exemplo.supabase.co/storage/v1/object/sign/mesa/'+p+'?token=t'; msAbrirId(102); });
  await expect(page.locator('#msEnviarBloco')).toBeVisible();
  await page.click('#msBtWhats');
  await expect.poll(()=>page.evaluate(()=>(window.__abas[0]||{location:{}}).location.href)).toMatch(/^https:\/\/wa\.me\/\?text=/);
  const href = await page.evaluate(()=>window.__abas[0].location.href);
  const txt = decodeURIComponent(href.split('text=')[1]);
  expect(txt, 'o texto leva o titulo e o link assinado').toContain('Laudo de exemplo');
  expect(txt).toContain('https://exemplo.supabase.co/storage/v1/object/sign/mesa/pecas/102/laudo_exemplo_v02.pdf?token=t');
  expect(href, 'sem numero: o Igor escolhe o contato').not.toMatch(/wa\.me\/\d/);
  expect(await page.evaluate(()=>window.__storage.filter(c=>c.op==='createSignedUrl').map(c=>[c.p,c.s])), 'link de 7 dias').toEqual([['pecas/102/laudo_exemplo_v02.pdf',604800]]);
  expect(await baixasP134(page), 'abrir o WhatsApp nao grava').toEqual([]);
  await SAI_E_VOLTA(page);
  await expect(page.locator('#folhaTit')).toHaveText('Saiu?');
  await expect(page.locator('#folha .ms-canal[data-canal="whatsapp"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#msBt')).toHaveText('Enviei por WhatsApp');
  await page.click('#msBt'); await expect(page.locator('#msBt'), 'sem print o 1o toque pede o print').toHaveText('Enviei sem print'); await page.click('#msBt');
  await expect.poll(()=>baixasP134(page)).toEqual([{p_doc:102,p_canal:'whatsapp',p_dest:'Cliente de exemplo',p_prova_path:null}]);
  expect(erros).toEqual([]);
});

test('p134 Mesa: sem sair do painel nao pergunta; Nao saiu nao grava; link que falha fecha a aba e nada sai', async ({page})=>{
  const erros = await abrirMesa(page);
  await abaFalsa(page);
  await page.evaluate(()=>{ window.__storageUrl=p=>'https://exemplo.supabase.co/x/'+p; msAbrirId(102); });
  await page.click('#msBtWhats');
  await expect.poll(()=>page.evaluate(()=>window.__abas.length)).toBe(1);
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(500);
  await expect(page.locator('#folhaTit'), 'nao saiu do painel: nao pergunta').not.toHaveText('Saiu?');
  await SAI_E_VOLTA(page);
  await expect(page.locator('#folhaTit')).toHaveText('Saiu?');
  await page.click('#envioNao');
  await expect(page.locator('#tmsg')).toContainText('Nada foi gravado');
  expect(await baixasP134(page)).toEqual([]);
  await page.evaluate(()=>{ window.__storageErro=true; msAbrirId(102); });
  await page.click('#msBtWhats');
  await expect(page.locator('#tmsg')).toContainText('Não consegui gerar o link da peça');
  expect(await page.evaluate(()=>window.__abas[1].closed), 'a aba vazia fecha').toBe(true);
  await SAI_E_VOLTA(page);
  await page.waitForTimeout(500);
  await expect(page.locator('#folhaTit')).not.toHaveText('Saiu?');
  expect(await baixasP134(page)).toEqual([]);
  expect(erros).toEqual([]);
});

test('p134 Mesa: Compartilhar o arquivo leva o arquivo junto e pergunta o canal; cancelar nao pergunta', async ({page})=>{
  await page.addInitScript(()=>{ window.__shares=[]; window.__shareErro=null;
    navigator.canShare=d=>!!(d&&d.files&&d.files.length);
    navigator.share=d=>{ window.__shares.push({n:(d.files||[]).map(f=>f.name+'|'+f.size)}); if(window.__shareErro){const e=new Error('x');e.name=window.__shareErro;return Promise.reject(e);} return Promise.resolve(); }; });
  await page.route('https://arquivo.exemplo.test/**', r=>r.fulfill({status:200, contentType:'application/pdf', body:'%PDF-1.4'+String.fromCharCode(10)}));
  const erros = await abrirMesa(page);
  await page.evaluate(()=>{ window.__storageUrl=p=>'https://arquivo.exemplo.test/'+p; window.__shareErro='AbortError'; msAbrirId(102); });
  await page.click('#msBtCompart');
  await expect.poll(()=>page.evaluate(()=>window.__shares.length)).toBe(1);
  await expect(page.locator('#tmsg')).toContainText('Compartilhar cancelado');
  await expect(page.locator('#folhaTit')).not.toHaveText('Saiu?');
  await page.evaluate(()=>{ window.__shareErro=null; });
  await page.click('#msBtCompart');
  await expect(page.locator('#folhaTit')).toHaveText('Saiu?');
  expect(await page.evaluate(()=>window.__shares[1].n), 'o arquivo vai junto, com o nome da peca').toEqual(['laudo_exemplo_v02.pdf|9']);
  expect(await page.evaluate(()=>window.__storage.filter(c=>c.op==='createSignedUrl').length), 'baixou uma vez so').toBe(1);
  await page.click('#msBt');
  await expect(page.locator('#msAviso'), 'sem canal a baixa nao grava').toContainText('Escolha por onde');
  expect(await baixasP134(page)).toEqual([]);
  await page.click('#folha .ms-canal[data-canal="outro"]');
  await page.click('#msBt'); await expect(page.locator('#msBt'), 'sem print o 1o toque pede o print').toHaveText('Enviei sem print'); await page.click('#msBt');
  await expect.poll(()=>baixasP134(page)).toEqual([{p_doc:102,p_canal:'outro',p_dest:'Cliente de exemplo',p_prova_path:null}]);
  expect(erros).toEqual([]);
});

test('p134 cobranca: WhatsApp e volta perguntam Cobrou?; Sim grava cobrar pelo mesmo caminho do Cobrei agora', async ({page})=>{
  await page.addInitScript(c=>{ window.__dados={cob3:c}; }, COB3);
  await page.addInitScript(ABRE_JANELA);
  const erros = await abrir(page);
  await page.locator('#cob3Box .cob3').nth(0).locator('button[aria-label="Abrir no WhatsApp"]').click();
  await SAI_E_VOLTA(page);
  await expect(page.locator('#folhaTit')).toHaveText('Cobrou?');
  await expect(page.locator('#folha')).toContainText('Cobrar resposta de exemplo');
  await page.click('#envioSim');
  await expect.poll(()=>page.evaluate(()=>PEND&&PEND.verbo)).toBe('cobrar');
  expect(await page.evaluate(()=>PEND.ref)).toBe('7');
  expect(erros).toEqual([]);
});

/* p4.57 (p143, s3409, 12/10/2026): pedido no painel respondido em ate 2 h uteis. A classe que mata: aviso que grita
   "Atendente dormindo" sem nada esperando (ruido) e pedido sem prazo visivel. Sem pedido, a linha cala; com pedido,
   diz ate quando; fora do prazo, acende; o recibo do pedido novo traz o prazo. No main de antes a linha dizia
   "Atendente dormindo" com zero esperando: o teste reprova. */
test('p143: atendente so aparece com pedido esperando, com o prazo de 2 h uteis; fora do prazo acende; recibo traz o prazo', async ({page})=>{
  await page.addInitScript(()=>{ window.webkitSpeechRecognition=undefined; window.SpeechRecognition=undefined;
    window.__atd={despertador:'ligado',pendentes:0,sessao_viva:false,ultimo_despertar_em:'2026-10-01T00:00:00Z',http:200,atrasados:0,
      no_prazo_30d:{total:212,no_prazo:201,pct:95}}; });
  const erros = await abrir(page);
  await page.evaluate(()=>atendenteEstado());
  await expect(page.locator('#atd'), 'sem pedido esperando, nada de "dormindo"').toHaveText('');
  const prazo = new Date(Date.now()+90*60000).toISOString();
  await page.evaluate(p=>{ window.__atd={...window.__atd,pendentes:2,proximo_prazo:p,prazo_novo:p}; return atendenteEstado(); }, prazo);
  await expect(page.locator('#atd')).toContainText('Atendente dormindo · 2 esperando, resposta até');
  await expect(page.locator('#atd')).not.toHaveClass(/velho/);
  expect(await page.locator('#atd').getAttribute('title')).toContain('201 de 212 respondidos em até 2 h úteis');
  await page.setViewportSize({width:390, height:820});
  const m = await page.locator('#atd').evaluate(e=>({h:e.getBoundingClientRect().height, fs:parseFloat(getComputedStyle(e).fontSize)}));
  expect(m.h, 'cabe numa linha a 390 px').toBeLessThan(m.fs*1.8);
  await page.evaluate(()=>{ window.__atd={...window.__atd,pendentes:1,atrasados:1}; return atendenteEstado(); });
  await expect(page.locator('#atd')).toContainText('1 fora do prazo');
  await expect(page.locator('#atd')).toHaveClass(/velho/);
  const r = await page.evaluate(()=>recibo('Anotado.'));
  expect(r, 'o recibo do pedido novo diz o prazo').toMatch(/Prazo: resposta até .*\(2 h úteis\)\./);
  await page.evaluate(()=>{ window.__atd={despertador:'sem_token',pendentes:0}; return atendenteEstado(); });
  await expect(page.locator('#atd'), 'problema da maquina aparece mesmo sem pedido').toContainText('Sem despertador');
  expect(erros).toEqual([]);
});

/* p4.71 (t3627, s7285, 17/10/2026): com a rotina do atendente pausada, a linha dizia "Atendente dormindo", que
   esconde a causa. Com rotina_ativa=false ela diz "Atendente pausado"; sem a chave (banco antigo), fica como antes.
   No main de antes (p4.70) a linha dizia "dormindo" com a rotina pausada: o teste reprova. */
test('t3627: rotina_ativa=false vira "Atendente pausado"; sem a chave, segue "dormindo"', async ({page})=>{
  await page.addInitScript(()=>{ window.webkitSpeechRecognition=undefined; window.SpeechRecognition=undefined;
    window.__atd={despertador:'ligado',pendentes:3,sessao_viva:false,ultimo_despertar_em:'2026-10-01T00:00:00Z',http:200,atrasados:0,
      rotina_ativa:false}; });
  const erros = await abrir(page);
  await page.evaluate(()=>atendenteEstado());
  await expect(page.locator('#atd')).toContainText('Atendente pausado · 3 esperando');
  await expect(page.locator('#atd')).not.toContainText('dormindo');
  await page.evaluate(()=>{ window.__atd={...window.__atd,rotina_ativa:true}; return atendenteEstado(); });
  await expect(page.locator('#atd')).toContainText('Atendente dormindo · 3 esperando');
  await page.evaluate(()=>{ const a={...window.__atd}; delete a.rotina_ativa; window.__atd=a; return atendenteEstado(); });
  await expect(page.locator('#atd'), 'sem a chave, como hoje').toContainText('Atendente dormindo · 3 esperando');
  expect(erros).toEqual([]);
});

/* p4.58 (p144, s3409, 12/10/2026): revisao semanal no painel. A classe que mata: revisao que so existe no chat, sem
   numero com meta, sem o que foi decidido e sem prova de que foi feita. A aba Semana mostra os numeros do placar com
   meta e a semana anterior, as decisoes de 7 dias, o plano de 7 dias; "Fechar a revisao" grava os minutos. No main de
   antes nao ha a aba: o teste reprova. */
test('p144: aba Semana com numeros, decisoes e plano; Fechar a revisao grava os minutos e o selo some', async ({page})=>{
  const hoje=new Date().toISOString().slice(0,10);
  await page.addInitScript(h=>{ window.__dados={semana:[
    {bloco:'numero',ordem:1,titulo:'★ Folego de exemplo',ref:'caixa.sobrevida_dias',valor:41,ha_7d:37,meta:30,unidade:'dias',detalhe:'dentro',dono:'igor'},
    {bloco:'numero',ordem:2,titulo:'Fechamentos de exemplo',ref:'painel.fechamentos_pelo_painel_pct',valor:72,ha_7d:65,meta:80,unidade:'pct',detalhe:'fora',dono:'igor'},
    {bloco:'numero',ordem:3,titulo:'Saldo de exemplo',ref:'caixa.menor_saldo_13s',valor:12400,ha_7d:9800,meta:0,unidade:'num',detalhe:'dentro',dono:'igor'},
    {bloco:'numero',ordem:4,titulo:'Rotinas de exemplo',ref:'motor.rotinas_no_ponto_pct',valor:100,ha_7d:92,meta:100,unidade:'pct',detalhe:'dentro',dono:'claude'},
    {bloco:'numero',ordem:5,titulo:'Demanda de exemplo',ref:'fluxo.idade_demanda_aberta_max',valor:12,ha_7d:15,meta:21,unidade:'dias',detalhe:'dentro',dono:'claude'},
    {bloco:'decisao_total',ordem:1,titulo:'ratificacao',valor:18},{bloco:'decisao_total',ordem:2,titulo:'escolha_em_card',valor:9},
    ...Array.from({length:9},(_,i)=>({bloco:'decisao',ordem:i+1,titulo:'Decisao de exemplo '+(i+1),detalhe:'escolha_em_card',frente:'11-renda-alt',quando:h})),
    {bloco:'plano',ordem:1,titulo:'Item do plano de exemplo',dono:'automacao',quando:h},
    {bloco:'plano',ordem:2,titulo:'Item atrasado de exemplo',dono:'claude',detalhe:'atrasado',quando:'2026-10-01'},
    {bloco:'cards',ordem:1,titulo:'cards',valor:7,detalhe:'1',dono:'igor'}]}; }, hoje);
  const erros = await abrir(page);
  await page.evaluate(()=>ir('semana'));
  await expect(page.locator('#tituloAba')).toHaveText('Semana');
  await expect(page.locator('#semTopo')).toContainText('em aberto');
  await expect(page.locator('#semTopo')).toContainText('5 números, 1 fora da meta');
  const nums = page.locator('#semNumeros .linha-r');
  await expect(nums).toHaveCount(5);
  await expect(nums.nth(0)).toContainText('Folego de exemplo');
  await expect(nums.nth(0), 'sem a estrela do banco').not.toContainText('★');
  await expect(nums.nth(0)).toContainText('41 dias');
  await expect(nums.nth(0)).toContainText('meta 30 dias · melhorou · seu');
  await expect(nums.nth(1).locator('.r')).toHaveClass(/w/);
  await expect(nums.nth(2)).toContainText('R$ 12,4 mil');
  await expect(page.locator('#semDecisoes .chip')).toHaveText(['18 ratificações','9 escolhas em card']);
  await expect(page.locator('#semDecisoes .linha-r')).toHaveCount(8);
  await page.click('#semDecisoes button[data-acao="semTodas"]');
  await expect(page.locator('#folha .pilha .linha-r')).toHaveCount(9);
  await page.evaluate(()=>fecharFolha());
  await expect(page.locator('#semPlano')).toContainText('atrasado, era 01/10');
  await expect(page.locator('#semPlano button')).toContainText('7 cards seus com prazo na próxima semana');
  await expect(page.locator('#n-semana')).toHaveText('•');
  await page.evaluate(()=>{ SEM_ABERTA=Date.now()-12*60000; });
  await page.click('#semFechar');
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='semana_revisao_fechar').map(c=>c.a))).toEqual([{p_minutos:12,p_nota:null}]);
  await page.evaluate(()=>{ D.semana=D.semana.concat([{bloco:'revisao',ordem:1,valor:12,quando:new Date().toISOString()}]); render(); });
  await expect(page.locator('#semTopo')).toContainText('feita');
  await expect(page.locator('#semTopo')).toContainText('12 minutos');
  await expect(page.locator('#n-semana'), 'revisao feita apaga o selo').toHaveText('');
  expect(erros).toEqual([]);
});

/* p4.59 (p147, s3409, 12/10/2026): presidente com 1 norte e ate 14 numeros de avanco, com dono e meta; o resto no
   bastidor. A classe que mata: o norte misturado aos outros e a tela que incha um numero por versao. No main de antes
   nao ha #semNorte: o teste reprova. */
test('p147: o norte abre a Semana como manchete, fora da lista; a lista para em 14; plural certo nas decisoes', async ({page})=>{
  await page.addInitScript(()=>{ window.__dados={semana:[
    {bloco:'norte',ordem:1,titulo:'★ Norte de exemplo',ref:'painel.fechamentos_pelo_painel_pct',valor:21,ha_7d:18,meta:80,unidade:'pct',direcao:'maior_melhor',detalhe:'fora',dono:'igor'},
    ...Array.from({length:16},(_,i)=>({bloco:'numero',ordem:i+1,titulo:'Numero de exemplo '+(i+1),ref:'x.'+i,valor:i,ha_7d:i,meta:0,unidade:'num',direcao:'menor_melhor',detalhe:i?'fora':'dentro',dono:'claude'})),
    {bloco:'decisao_total',ordem:1,titulo:'deliberacao',valor:1}]}; });
  const erros = await abrir(page);
  await page.evaluate(()=>ir('semana'));
  await expect(page.locator('#semNorte')).toBeVisible();
  await expect(page.locator('#semNorte .rot')).toHaveText('Norte');
  await expect(page.locator('#semNorte')).toContainText('Norte de exemplo');
  await expect(page.locator('#semNorte')).toContainText('21%');
  await expect(page.locator('#semNorte')).toContainText('meta 80% · melhorou · seu');
  await expect(page.locator('#semNumeros'), 'o norte nao se repete na lista').not.toContainText('Norte de exemplo');
  await expect(page.locator('#semNumeros .linha-r'), 'ate 14 numeros de avanco').toHaveCount(14);
  await expect(page.locator('#semTopo')).toContainText('o norte e 14 números, 14 fora da meta');
  await expect(page.locator('#semDecisoes .chip')).toHaveText(['1 deliberação']);
  expect(erros).toEqual([]);
});

/* p4.61 (p155, s3995 12/10/2026): a guarda fn_guarda_rotina nao deixa rotina mexer em card que o Igor tocou em 7 dias
   e grava aviso_card, mas o painel nao lia a tabela: o Igor nao sabia que a rotina tinha parado no card dele. Agora a
   carga pede a chave aviso e a folha do card diz o que a rotina queria mudar, quantas vezes e por que nao mudou; card sem
   aviso nao ganha bloco. O origin/main (p4.60) reprova: a carga nao pede aviso e a folha nao tem .aviso-rotina. */
test('p155 aviso_card: carga pede aviso; a folha do card diz que a rotina nao mexeu e por que; sem aviso, nada', async ({page})=>{
  await page.setViewportSize({width:360, height:800});
  await page.addInitScript(()=>{ window.__dados={aviso:[
    {origem:'tarefa',ref:'2',dia:'2026-10-11',n:2,motivo:'card tocado pelo Igor nos ultimos 7 dias',campos:'opcoes,prazo',ultimo_em:'2026-10-11T05:55:00-04:00'},
    {origem:'tarefa',ref:'99',dia:'2026-10-11',n:1,motivo:'card tocado pelo Igor nos ultimos 7 dias',campos:'status',ultimo_em:'2026-10-11T05:55:00-04:00'}]}; });
  const erros = await abrir(page);
  const carga = await page.evaluate(()=>window.__rpc.find(c=>c.n==='painel_carga'));
  expect(carga.a.p_chaves, 'a carga pede a chave aviso').toContain('aviso');
  await page.click('#foco .pri');
  await expect(page.locator('#folhaTit')).toHaveText('Card de exemplo');
  const av = page.locator('#folha .aviso-rotina');
  await expect(av).toHaveCount(1);
  await expect(av).toContainText('A rotina não mexeu neste card');
  await expect(av).toContainText('Em 11/10 uma rotina tentou mudar as opções, o prazo (2 tentativas)');
  await expect(av).toContainText('você mexeu neste card nos últimos 7 dias');
  await expect(av, 'o aviso de outro card nao vaza').not.toContainText('situação');
  const ruins = (await page.evaluate(contrasteDos, '#folha .aviso-rotina *')).filter(m=>m.razao<4.5);
  expect(ruins, 'texto do aviso abaixo de 4,5:1').toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth), 'sem rolagem horizontal a 360').toBe(true);
  await page.evaluate(()=>{ fecharFolha(); D.aviso=[{origem:'decisao',ref:'2',dia:'2026-10-11',n:1,motivo:'decisao aberta: so o Igor altera ou fecha',campos:'status',ultimo_em:'2026-10-11T05:55:00-04:00'}]; });
  await page.click('#foco .pri');
  await expect(page.locator('#folha .aviso-rotina'), 'aviso de decisao com o mesmo numero nao entra no card de tarefa').toHaveCount(0);
  expect(erros).toEqual([]);
});

/* t2198 (12/10/2026, s2867): fila "Subir ao compartilhado" na aba Mesa (item 5 do plano de reestruturacao, four-eyes).
   Criterio do card: a fila mostra a peca, a pasta destino e o que ela substitui; so o clique aprova; o teste reprova
   subida sem clique. Carregar, abrir a folha e marcar "Vi os achados" nao podem chamar subida_decidir; peca marcada
   pelo filtro de muro (REPROVADO ou SEM_LEITURA) nao sobe sem a ciencia. O duble geral devolve null para RPC que nao
   conhece, entao o caso injeta a fila trocando sb.rpc depois da carga. Tudo ficticio. */
const SB_FILA=[
  {id:7,titulo:'Ata de exemplo v02',origem:'ata_exemplo_v02.md',md5:'0123456789abcdef0123456789abcdef',destino:'00_Fundacao/VIGENTE',
    nome:'ata_exemplo_v02.md',substitui:{nome:'ata_exemplo_v01.md',md5:'f'.repeat(32),mtime:'2026-10-01T12:00:00Z'},veredito:'APROVADO',
    achados:{},porque:'A pasta VIGENTE e da sociedade: so sobe com o seu toque.',estado:'pendente',peca:'pecas/7/ata_exemplo_v02.pdf'},
  {id:8,titulo:'Transcricao de exemplo',origem:'transcricao_exemplo.txt',md5:'abcdefabcdefabcdefabcdefabcdefab',destino:'06_Operacao/Reunioes',
    nome:'transcricao_exemplo.txt',substitui:null,veredito:'REPROVADO',porque:'Pasta da sociedade.',estado:'pendente',
    achados:{resumo:{'outra frente: 11-renda-alt':1,'segredo: senha escrita':1},
      achados:[{tipo:'outra frente',qual:'11-renda-alt',linha:3},{tipo:'segredo',qual:'senha escrita',linha:9}]}},
  {id:9,titulo:'Planilha de exemplo',origem:'planilha_exemplo.xlsx',md5:'1111222233334444aaaabbbbccccdddd',destino:'04_Financeiro/Planejamento',
    nome:'planilha_exemplo.xlsx',substitui:null,veredito:'SEM_LEITURA',porque:'Pasta da sociedade.',estado:'pendente',
    achados:{motivo:'formato .xlsx nao e texto: conferir a mao'}}];
async function abrirSubida(page,fila=SB_FILA){
  const erros=await abrir(page);
  await page.evaluate(f=>{
    const rpc=sb.rpc.bind(sb);
    sb.rpc=(n,a)=>{
      if(n==='subida_painel'){ window.__rpc.push({n,a}); return Promise.resolve(window.__subidaErro?{data:null,error:window.__subidaErro}:{data:{fila:f,recentes:[]},error:null}); }
      if(n==='subida_decidir'){ window.__rpc.push({n,a}); return Promise.resolve({data:window.__subidaResp||'OK: aprovado; o PC sobe na proxima rodada',error:null}); }
      return rpc(n,a); };
  },fila);
  await page.evaluate(()=>ir('mesa'));
  await page.waitForSelector('#sb-raiz .sb-item',{timeout:5000});
  return erros;
}
const sbDecisoes=page=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='subida_decidir'));

test('Subida (t2198): a fila mostra a peca, a pasta destino e o que ela substitui; carregar e abrir nao sobem; o clique sobe', async ({page})=>{
  const erros=await abrirSubida(page);
  const raiz=page.locator('#sb-raiz');
  await expect(raiz.locator('.sb-item')).toHaveCount(3);
  await expect(raiz).toContainText('Subir ao compartilhado (3)');
  await expect(raiz).toContainText('para 00_Fundacao/VIGENTE · substitui ata_exemplo_v01.md');
  await expect(raiz).toContainText('peça nova na pasta');
  await expect(raiz).toContainText('Filtro de muro: nada achado');
  await expect(raiz).toContainText('Filtro de muro: achou pontos');
  const txt=await raiz.innerText();
  for(const cru of ['APROVADO','REPROVADO','SEM_LEITURA','pendente','subida_'])expect(txt,`codigo cru na fila: ${cru}`).not.toContain(cru);
  /* abrir a folha mostra destino e anterior, e nao chama o banco */
  await raiz.locator('.sb-item').first().click();
  await expect(page.locator('#sbDestino')).toHaveText('00_Fundacao/VIGENTE/ata_exemplo_v02.md');
  await expect(page.locator('#sbSubstitui')).toContainText('ata_exemplo_v01.md');
  await expect(page.locator('#sbSubstitui')).toContainText('_ARQUIVO do mês');
  await page.waitForTimeout(300);
  expect(await sbDecisoes(page),'subida sem clique: carregar e abrir chamaram subida_decidir').toEqual([]);
  /* so o toque aprova, com o md5 que a tela mostrou */
  await page.locator('#sbBtSubir').click();
  await expect.poll(()=>sbDecisoes(page)).toHaveLength(1);
  const [d]=await sbDecisoes(page);
  expect(d.a).toEqual({p_id:7,p_md5:'0123456789abcdef0123456789abcdef',p_decisao:'aprovar',p_ciente:false,p_nota:null});
  await expect(page.locator('#veu')).toHaveClass(/hidden/);
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='subida_painel').length)).toBeGreaterThan(1);
  expect(erros).toEqual([]);
});

test('Subida (t2198): peca marcada pelo filtro de muro nao sobe sem "Vi os achados"; com ele vai com p_ciente', async ({page})=>{
  const erros=await abrirSubida(page);
  await page.evaluate(()=>sbAbrir(8));
  const ach=page.locator('#sbAchados');
  await expect(ach).toContainText('Assunto de outra frente: Renda Alternativa');
  await expect(ach).toContainText('linha 3');
  await expect(ach).toContainText('Senha ou chave');
  await page.locator('#sbBtSubir').click();
  await expect(page.locator('#sbAviso')).toContainText('Vi os achados');
  await page.waitForTimeout(300);
  expect(await sbDecisoes(page),'REPROVADO subiu sem a ciencia dos achados').toEqual([]);
  await page.locator('#sbCiente').click();
  await expect(page.locator('#sbCiente')).toHaveAttribute('aria-pressed','true');
  expect(await sbDecisoes(page),'marcar "Vi os achados" nao e o clique de subir').toEqual([]);
  await page.locator('#sbBtSubir').click();
  await expect.poll(()=>sbDecisoes(page)).toHaveLength(1);
  expect((await sbDecisoes(page))[0].a).toMatchObject({p_id:8,p_decisao:'aprovar',p_ciente:true});
  /* SEM_LEITURA: o mesmo portao, e a folha diz o formato sem codigo cru */
  await page.evaluate(()=>sbAbrir(9));
  await expect(page.locator('#sbAchados')).toContainText('arquivo .xlsx');
  await page.locator('#sbBtSubir').click();
  await expect(page.locator('#sbAviso')).toContainText('Vi os achados');
  expect(await sbDecisoes(page)).toHaveLength(1);
  expect(erros).toEqual([]);
});

test('Subida (t2198): "Nao subir" sem motivo nao grava; com motivo vai recusar; RECUSADO do banco fica na folha', async ({page})=>{
  const erros=await abrirSubida(page);
  await page.evaluate(()=>sbAbrir(7));
  await page.locator('#sbAbreRecusar').click();
  await expect(page.locator('#sbAbreRecusar')).toHaveAttribute('aria-expanded','true');
  await page.locator('#sbBtRecusar').click();
  await expect(page.locator('#sbAviso')).toContainText('Diga por que');
  expect(await sbDecisoes(page)).toEqual([]);
  await page.locator('#sbTxtRecusar').fill('Falta a assinatura de exemplo');
  await page.locator('#sbBtRecusar').click();
  await expect.poll(()=>sbDecisoes(page)).toHaveLength(1);
  expect((await sbDecisoes(page))[0].a).toMatchObject({p_id:7,p_decisao:'recusar',p_nota:'Falta a assinatura de exemplo'});
  /* recusa do banco (peca mudou depois da fila): a folha continua aberta e diz por que */
  await page.evaluate(()=>{window.__subidaResp='RECUSADO: a peca mudou desde que a fila foi montada; recarregue e confira de novo';sbAbrir(7);});
  await page.locator('#sbBtSubir').click();
  await expect(page.locator('#sbAviso')).toContainText('a peca mudou');
  await expect(page.locator('#veu')).not.toHaveClass(/hidden/);
  expect(erros).toEqual([]);
});

test('Subida (t2198): fila vazia ou banco sem a funcao nao poe nada na Mesa; erro de leitura vira aviso', async ({page})=>{
  const erros=await abrirSubida(page);
  await page.evaluate(async()=>{window.__subidaErro={code:'PGRST202',message:'Could not find the function public.subida_painel'};await sbCarregar();});
  await expect(page.locator('#sb-raiz')).toBeHidden();
  await page.evaluate(async()=>{window.__subidaErro={message:'falha de teste'};await sbCarregar();});
  await expect(page.locator('#sb-raiz [role=alert]')).toContainText('Não consegui ler a fila do compartilhado');
  expect(erros).toEqual([]);
});

for (const largura of [360, 1280]) {
  test(`Subida (t2198) a ${largura}px: fila e folha sem controle abaixo de 44 px e sem rolagem horizontal`, async ({page})=>{
    await page.setViewportSize({width:largura, height:820});
    const erros=await abrirSubida(page);
    const medir=sel=>page.evaluate(s=>{
      const r=[...document.querySelectorAll(s)].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.height<44||b.width<44);})
        .map(e=>(e.getAttribute('aria-label')||e.textContent||e.id).trim().slice(0,30));
      return {r, W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};
    },sel);
    const f=await medir('#sb-raiz button,#sb-raiz summary');
    expect(f.r,'controles pequenos na fila').toEqual([]);
    expect(f.SW,'rolagem horizontal com a fila').toBe(f.W);
    await page.evaluate(()=>{sbAbrir(8);sbRecusarAbre();});
    const g=await medir('#folha button,#folha textarea');
    expect(g.r,'controles pequenos na folha da subida').toEqual([]);
    expect(g.SW,'rolagem horizontal com a folha aberta').toBe(g.W);
    expect(erros).toEqual([]);
  });
}

/* ---------- p4.65 · onda 0 do canone v02 (pi 170, 171 e 172; s6127, 17/10/2026) ----------
   pi 170: o mesmo ato tinha tres nomes (Largar, Descartar, Arquivar; Concluí, Ok, Feito) e os docs diziam 6 s para desfazer
   com o codigo em 8 s. A classe que se cobra: sinonimo que volta por um botao novo, e doc que desmente o codigo. */
test('p4.65 pi 170: um rotulo por verbo do banco, sem sinonimo em botao, e docs com os 8 s do codigo', async ({page})=>{
  const erros = await abrir(page);
  const g = await page.evaluate(()=>({G:GLOSSARIO,
    rot:{feita:ROT.feita,fechar:ROT.fechar,arquivar:ROT.arquivar,descartar:ROT.descartar},
    feito:{feita:ROT_FEITO.feita,feito:ROT_FEITO.feito,largar:ROT_FEITO.largar,arquivar:ROT_FEITO.arquivar,descartar:ROT_FEITO.descartar,aprovado:ROT_FEITO.aprovado},
    mesa:{aprovado:MS_DEC.aprovado.rot,largar:MS_DEC.largar.rot}, pronto:Object.fromEntries(ATOS_PRONTO), espera:ESPERA_MS}));
  expect(g.G).toEqual({concluir:'Concluir',concluido:'Concluído',descartar:'Descartar',descartado:'Descartado',aprovar:'Aprovar',aprovado:'Aprovado',resolver:'Resolver'});
  expect(g.rot, 'botao: fechar = Concluir, desistir = Descartar').toEqual({feita:'Concluir',fechar:'Concluir',arquivar:'Descartar',descartar:'Descartar'});
  expect(g.feito, 'historico no particípio, um por ato').toEqual({feita:'Concluído',feito:'Concluído',largar:'Descartado',arquivar:'Descartado',descartar:'Descartado',aprovado:'Aprovado'});
  expect(g.mesa).toEqual({aprovado:'Aprovar',largar:'Descartar'});
  expect(g.pronto.feito).toBe('Concluir'); expect(g.pronto.descartar).toBe('Descartar');
  expect(g.espera, 'o desfazer e de 8 s').toBe(8000);
  /* o fonte nao tem sinonimo escrito em botao nem em rotulo de ato */
  const src = fs.readFileSync(path.resolve(__dirname,'..','presidente.html'),'utf8');
  const SINONIMOS = /(>\s*|"|`)(Largar|Arquivar|Ok|Feito|Concluí)(\s*<|"|`| este)/g;
  expect(src.match(SINONIMOS)||[], 'sinonimo de ato no fonte').toEqual([]);
  /* tela: o card com arquivar mostra Descartar; nenhum botao visivel diz Largar, Arquivar, Ok, Feito ou Concluí */
  await page.evaluate(()=>{ ir('fila'); abrirInv(4); });
  const bts = await page.locator('#folha button').allTextContents();
  expect(bts.map(s=>s.trim())).toContain('Descartar');
  for (const s of bts) expect(s.trim(), 'botao com sinonimo').not.toMatch(/^(Largar|Arquivar|Ok|Feito|Concluí)\b/);
  /* docs e fonte nao falam mais em 6 s de desfazer */
  const docs = fs.readdirSync(path.resolve(__dirname,'..','docs')).filter(f=>f.endsWith('.md'))
    .map(f=>[f, fs.readFileSync(path.resolve(__dirname,'..','docs',f),'utf8')]).concat([['presidente.html',src]]);
  for (const [f,t] of docs) expect(t.match(/\b6 s (de|para) desfazer|os 6 s\b|espera 6 s/g)||[], f+' fala em 6 s').toEqual([]);
  expect(erros).toEqual([]);
});

/* pi 171: bloco vazio ou com falha diz por que, nunca some calado (Google SRE: falha silenciosa e o pior alerta). */
test('p4.65 pi 171: Cobrar, Vence amanhã e Sugestões vazios dizem que estão vazios; chave ausente não finge vazio', async ({page})=>{
  const erros = await abrir(page);
  const q = page.locator('#hojeQuieto');
  await expect(q).toBeVisible();
  await expect(q).toHaveText('Cobrar: ninguém com retorno vencido · Vence amanhã: nada para decidir · Sugestões das rotinas: nenhuma nova.');
  await page.evaluate(()=>{ delete D.cob3; delete D.sug; renderCobrar(); });
  await expect(q, 'sem a chave, o aviso de parte faltando fala; aqui nao').toHaveText('Vence amanhã: nada para decidir.');
  await page.evaluate(()=>{ D.cob3=[{origem:'tarefa',ref:'90',titulo:'Cobrar retorno de exemplo',terceiro:'Fiscal de exemplo',dias:1}]; D.sug=[]; D.vesp=[]; renderCobrar(); renderSugestoes(); });
  await expect(page.locator('#cob3Box')).toBeVisible();
  await expect(q).not.toContainText('Cobrar');
  expect(erros).toEqual([]);
});
test('p4.65 pi 171: Subir ao compartilhado lida e vazia mostra o estado vazio; função ausente segue escondida', async ({page})=>{
  await abrirSubida(page);
  await page.evaluate(async()=>{ const rpc=sb.rpc; sb.rpc=(n,a)=>n==='subida_painel'?Promise.resolve({data:{fila:[],recentes:[]},error:null}):rpc(n,a); await sbCarregar(); });
  await expect(page.locator('#sb-raiz')).toBeVisible();
  await expect(page.locator('#sb-raiz')).toContainText('Subir ao compartilhado');
  await expect(page.locator('#sb-raiz .vazio')).toContainText('Nada esperando subida');
  await page.evaluate(async()=>{window.__subidaErro={code:'PGRST202',message:'Could not find the function public.subida_painel'};
    const rpc=sb.rpc; sb.rpc=(n,a)=>n==='subida_painel'?Promise.resolve({data:null,error:window.__subidaErro}):rpc(n,a); await sbCarregar();});
  await expect(page.locator('#sb-raiz')).toBeHidden();
});
test('p4.65 pi 171: ping, medição e atendente que falham acendem a saúde por fonte e apagam ao voltar', async ({page})=>{
  const erros = await abrir(page);
  await expect(page.locator('#saude')).toHaveText('sistema ok');
  await page.evaluate(async()=>{
    window.__rpcOk=sb.rpc; window.__fromOk=sb.from;
    sb.rpc=(n,a)=>n==='painel_ping'||n==='painel_medir_decisao'?Promise.resolve({data:null,error:{message:'funcao '+n+' sumiu'}})
      :n==='atendente_estado'?Promise.resolve({data:{erro:'sem permissao'},error:null}):window.__rpcOk(n,a);
    await carregar(); medirAto({origem:'tarefa',ref:'2',t0:Date.now()-500},'a'); await atendenteEstado();
  });
  await expect(page.locator('#saude')).toContainText('sistema degradado');
  await page.locator('button.estado').click();
  const acesas = page.locator('#folha .fonte.w');
  await expect(acesas).toHaveCount(3);
  for (const n of ['Registro de abertura do painel','Medição do tempo de decisão','Estado do atendente'])
    await expect(page.locator('#folha .fonte.w', {hasText:n}), n).toContainText('falhou');
  await page.evaluate(async()=>{ fecharFolha(); sb.rpc=window.__rpcOk; sb.from=window.__fromOk;
    await carregar(); medirAto({origem:'tarefa',ref:'2',t0:Date.now()-500},'a'); await atendenteEstado(); });
  await expect(page.locator('#saude'), 'tudo voltou: a saude apaga').toHaveText('sistema ok');
  expect(erros).toEqual([]);
});

/* pi 172: a marca Dabli fica e o muro (LC-01) vira obrigatorio na tela compartilhada. Prova a 390 e a 1280: nenhuma frente PF,
   nenhum caixa consolidado e nenhum R$ com numero em nenhuma aba; frente sem classificacao tambem some (fail-closed). */
const FRENTES_TELA = [{slug:'11-renda-alt',entidade:'PF'},{slug:'20-contrato-pj',entidade:'DABLI'},{slug:'04-obra-residencial',entidade:'IGV'}];
async function abrirTela(page, frentes=FRENTES_TELA){
  const erros=[];
  page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(DUBLE);
  await page.addInitScript(f=>{ window.__tab={frente:f}; }, frentes);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA+'?tela=compartilhada');
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit'));
  return erros;
}
const PF_TEXTOS = ['Renda Alternativa','Card de exemplo','Laudo de exemplo','Laudo L1','11-renda-alt','renda alt'];
for (const w of [390, 1280]) {
  test(`p4.65 pi 172 a ${w}px: ?tela=compartilhada esconde a frente PF, o caixa consolidado e todo valor em R$`, async ({page})=>{
    await page.setViewportSize({width:w, height:900});
    const erros = await abrirTela(page);
    await expect(page.locator('#telaAviso')).toBeVisible();
    await expect(page.locator('#telaAviso')).toContainText('Frentes pessoais, caixa e valores em R$ estão escondidos');
    expect(await page.evaluate(()=>window.__rpc.some(c=>c.n==='painel_carga')), 'a carga veio').toBe(true);
    for (const aba of ['hoje','fila','frentes','mesa','semana']) {
      await page.evaluate(a=>{ ir(a); if(a==='mesa') return msCarregar(); }, aba);
      await page.waitForTimeout(50);
      const txt = await page.evaluate(()=>document.body.innerText);
      for (const s of PF_TEXTOS) expect(txt, `aba ${aba} mostra "${s}"`).not.toContain(s);
      expect(txt.match(/R\$\s?-?\d/g)||[], `aba ${aba} mostra valor em R$`).toEqual([]);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth), 'rolagem horizontal').toBeLessThanOrEqual(0);
    }
    await expect(page.locator('#foco'), 'a frente Dabli segue na tela').toContainText('Segundo card');
    /* caixa consolidado: a aba some, o link ?abrir=caixa cai no Hoje, a frase do folego some */
    for (const b of await page.locator('[data-aba="caixa"]').all()) await expect(b).toBeHidden();
    await page.evaluate(()=>ir('caixa'));
    expect(await page.evaluate(()=>ABA)).toBe('hoje');
    expect(await page.evaluate(()=>({rw:D.rw.length,c13:D.c13.length,c13i:D.c13i.length}))).toEqual({rw:0,c13:0,c13i:0});
    await expect(page.locator('#situacao')).not.toContainText('caixa aguenta');
    await expect(page.locator('a[href="index.html"]').first(), 'o bastidor mostra tudo: o link some').toBeHidden();
    /* folha aberta tambem: valor de card nao vaza */
    await page.evaluate(()=>{ ir('hoje'); abrirInv(3); });
    expect((await page.locator('#folha').innerText()).match(/R\$\s?-?\d/g)||[]).toEqual([]);
    /* desligar devolve tudo, e o valor volta */
    await page.evaluate(()=>fecharFolha());
    await page.locator('#telaAviso button').click();
    await expect(page.locator('#telaAviso')).toBeHidden();
    await expect.poll(()=>page.evaluate(()=>document.body.innerText.includes('Card de exemplo'))).toBe(true);
    expect(await page.evaluate(()=>new URL(location.href).searchParams.has('tela')), 'o parametro sai da barra').toBe(false);
    expect(erros).toEqual([]);
  });
}
test('p4.65 pi 172: frente sem classificação some (fail-closed) e o botão liga pelo trilho', async ({page})=>{
  await page.setViewportSize({width:1280, height:900});
  const erros = await abrir(page);
  await expect(page.locator('#foco')).toContainText('Card de exemplo');
  await page.evaluate(()=>{ window.__tab={frente:[{slug:'20-contrato-pj',entidade:'DABLI'}]}; });
  await page.locator('#btTela').click();
  await expect(page.locator('#btTela')).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>page.evaluate(()=>document.body.innerText.includes('Card de exemplo'))).toBe(false);
  const txt = await page.evaluate(()=>document.body.innerText);
  expect(txt, 'a frente IGV sem linha em frente.entidade some').not.toContain('Item para decidir');
  expect(txt.match(/R\$\s?-?\d/g)||[]).toEqual([]);
  expect(erros).toEqual([]);
});

/* ---------- p4.66 · onda 2 do canone v02 (pi 177 a 182, s6857, 17/10/2026) ----------
   Cada teste abaixo reprova o origin/main (p4.65): a prova esta no PR. Os dados vem de window.__dados (as chaves novas do
   painel_carga: pg, cxe, rwe, uni, ficha, quest, bloq, trava) e de window.__tab.frente (frente.unidade). */
/* p4.74 (P3, s8199): os dois testes do pi 177 mediam o minigrafico por entidade (escala comum, zero, marca da PF), que saiu.
   O bloco agora le a v_caixa_entidade_resumo; o teste novo esta no fim deste arquivo (p4.74 d). */

const UNI_DADOS = `(()=>{ window.__dados={uni:[
    {slug:'u-neg',nome:'Unidade Negocio',tipo:'negocio',entidade:'DABLI',dono:'igor',ratificada_em:'2026-10-10'},
    {slug:'u-apoio',nome:'Unidade Apoio',tipo:'apoio',entidade:'DABLI',dono:'claude',ratificada_em:'2026-10-10'},
    {slug:'u-vida',nome:'Unidade Vida',tipo:'vida',entidade:'PF',dono:'igor',ratificada_em:'2026-10-10'}]}; })();`;

test('p4.66 pi 178: a unidade vem de frente.unidade e o cabecalho traz nome, dono e a margem somada dos 30 dias', async ({page})=>{
  await page.addInitScript(UNI_DADOS);
  await page.addInitScript(()=>{ window.__tab={frente:[{slug:'11-renda-alt',entidade:'PJ',unidade:'u-neg'},{slug:'20-contrato-pj',entidade:'PJ',unidade:'u-neg'}]}; });
  const erros = await abrir(page);
  await page.evaluate(()=>ir('frentes'));
  const h = page.locator('#frentesLista .un');
  await expect(h, 'so a unidade com frente aparece').toHaveCount(1);
  await expect(h).toContainText('Unidade Negocio');
  await expect(h).toContainText('dono você');
  await expect(h.locator('.r'), 'margem somada: 2.000 + 1.000').toHaveText('R$ 3 mil');
  await expect(page.locator('#frentesLista .frente')).toHaveCount(2);
  expect(erros).toEqual([]);
});

test('p4.66 pi 178: Frentes agrupa por unidade na ordem negocio, apoio, vida; sem unidade (ou unidade fora de uni) vai ao topo com aviso', async ({page})=>{
  const erros = await abrir(page);
  await page.evaluate(()=>{
    D.uni=[{slug:'u-vida',nome:'Unidade Vida',tipo:'vida',dono:'igor'},{slug:'u-apoio',nome:'Unidade Apoio',tipo:'apoio',dono:'claude'},{slug:'u-neg',nome:'Unidade Negocio',tipo:'negocio',dono:'igor'}];
    ARV=[{nivel:0,no:'CAIXA'},{nivel:1,no:'11-renda-alt',rotulo:'Renda Alt',margem_30d:2000,margem_total:2000},{nivel:1,no:'20-contrato-pj',rotulo:'Contrato PJ',margem_30d:1000,margem_total:3000},
      {nivel:1,no:'04-obra-residencial',rotulo:'Obra Vida',margem_30d:0,margem_total:0},{nivel:1,no:'08-apoio',rotulo:'Apoio X',margem_30d:0,margem_total:0},
      {nivel:1,no:'09-sem-unidade',rotulo:'Sem Un',margem_30d:500,margem_total:500},{nivel:1,no:'10-fantasma',rotulo:'Fantasma',margem_30d:200,margem_total:200}];
    INV=INV.concat([{id:91,frente:'08-apoio',dono:'igor',status:'pendente',prazo:null,parado_dias:0,titulo:'Card de apoio',acoes:[]}]);
    UNID={'11-renda-alt':'u-neg','20-contrato-pj':'u-neg','04-obra-residencial':'u-vida','08-apoio':'u-apoio','09-sem-unidade':null,'10-fantasma':'u-que-nao-existe'};
    ir('frentes'); renderFrentes(); });
  const grupos = await page.evaluate(()=>{ const g=[]; for(const e of document.getElementById('frentesLista').children){
    if(e.tagName==='H3') g.push({u:e.dataset.unidade, t:e.textContent.replace(/\s+/g,' ').trim(), f:[]});
    else if(e.classList.contains('frente')) g[g.length-1].f.push(e.querySelector('b').textContent.trim()); } return g; });
  expect(grupos.map(g=>g.u), 'pendencia no topo, depois negocio, apoio e vida').toEqual(['', 'u-neg', 'u-apoio', 'u-vida']);
  expect(grupos[0].t).toContain('Sem unidade · pendência');
  expect(grupos[0].f.sort(), 'as duas frentes sem unidade valida').toEqual(['Fantasma','Sem Un']);
  expect(grupos[1].f).toEqual(['Renda Alt','Contrato PJ']);
  expect(grupos[1].t).toContain('Unidade Negocio'); expect(grupos[1].t).toContain('dono você'); expect(grupos[1].t).toContain('R$ 3 mil');
  expect(grupos[2].t).toContain('dono Claude'); expect(grupos[2].f).toEqual(['Apoio X']);
  expect(grupos[3].f).toEqual(['Obra Vida']);
  await expect(page.locator('#frentesLista .aviso')).toContainText('2 frentes sem unidade');
  expect(erros).toEqual([]);
});

for (const w of [390, 1280]) {
  test(`p4.66 onda 2 a ${w}px: tela compartilhada esconde unidade de vida, entidade PF, grupo de pendencia e todo R$ dos blocos novos`, async ({page})=>{
    await page.setViewportSize({width:w, height:900});
    await page.addInitScript(()=>{ window.__dados={
      uni:[{slug:'u-neg',nome:'Unidade Negocio',tipo:'negocio',entidade:'DABLI',dono:'igor'},{slug:'u-vida',nome:'Unidade Vida',tipo:'vida',entidade:'IGV',dono:'igor'}],
      cxe:[{entidade:'PF',semana:1,saldo_pior:-100,saldo_base:100}], rwe:[{entidade:'PF',dias_caixa:5,dias_caixa_pior:3,financiamento:'consome R$ 500 da PF'}],
      quest:[{id:1,ordem:1,top3:true,titulo:'Questao com frente privada',de_frente:'20-contrato-pj',de_nome:'Contrato PJ',para_frente:'11-renda-alt',para_nome:'Renda Alternativa',dono:'igor',idade_dias:2},
        {id:2,ordem:2,top3:true,titulo:'Questao so de frente aberta',de_frente:'20-contrato-pj',de_nome:'Contrato PJ',para_frente:'20-contrato-pj',para_nome:'Contrato PJ',dono:'igor',idade_dias:3}],
      bloq:[{tarefa_id:5,frente_slug:'20-contrato-pj',rotulo:'bloqueado por Renda Alternativa',frentes_bloqueadoras:['11-renda-alt']},
        {tarefa_id:6,frente_slug:'20-contrato-pj',rotulo:'bloqueado por Contrato PJ',frentes_bloqueadoras:['20-contrato-pj']}],
      trava:[{frente_slug:'20-contrato-pj',n_cards_travados:1,frentes_travadas:['04-obra-residencial'],itens:[{titulo:'Card travado da vida',frente_slug:'04-obra-residencial'}]}],
      ficha:[{frente_slug:'20-contrato-pj',ordem:4,bloco:'D',ref:'pagar',item:'Pagar o fornecedor de exemplo',detalhe:'R$ 900,00 (sua parte)',prazo:null,dias_parado:0,recomendacao:null}]}; });
    const erros = await abrirTela(page, [{slug:'11-renda-alt',entidade:'PF',unidade:'u-neg'},{slug:'20-contrato-pj',entidade:'DABLI',unidade:'u-neg'},{slug:'04-obra-residencial',entidade:'IGV',unidade:'u-vida'}]);
    for (const aba of ['hoje','fila','frentes','semana']) {
      await page.evaluate(a=>{ if(a==='fila'){ COL='depois'; renderFila(); } ir(a); }, aba);
      await page.waitForTimeout(50);
      const txt = await page.evaluate(()=>document.body.innerText);
      expect(txt, `aba ${aba} mostra a unidade de vida`).not.toContain('Unidade Vida');
      expect(txt, `aba ${aba} mostra a frente de vida`).not.toContain('Item para decidir');
      expect(txt, `aba ${aba} mostra pendencia`).not.toContain('Sem unidade');
      expect(txt, `aba ${aba} mostra bloqueio por frente privada`).not.toContain('bloqueado por Renda Alternativa');
      expect(txt, `aba ${aba} mostra questao de frente privada`).not.toContain('Questao com frente privada');
      expect(txt.match(/R\$\s?-?\d/g)||[], `aba ${aba} mostra valor em R$`).toEqual([]);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth), 'rolagem horizontal').toBeLessThanOrEqual(0);
    }
    await page.evaluate(()=>ir('frentes'));
    await expect(page.locator('#frentesLista .un'), 'a unidade de negocio aparece, sem margem').toHaveCount(1);
    await expect(page.locator('#frentesLista .un')).toContainText('Unidade Negocio');
    await expect(page.locator('#frentesLista .un .r')).toHaveCount(0);
    await page.evaluate(()=>ir('semana'));
    await expect(page.locator('#semQuest')).toContainText('Questao so de frente aberta');
    await page.evaluate(()=>{ COL='depois'; renderFila(); ir('fila'); });
    await expect(page.locator('#kanban .bloq')).toContainText('bloqueado por Contrato PJ');
    await page.evaluate(()=>abrirFrente('20-contrato-pj'));
    const folha = await page.locator('#folha').innerText();
    expect(folha.match(/R\$\s?-?\d/g)||[], 'valor na ficha').toEqual([]);
    expect(folha, 'o que a frente trava nas de vida some').not.toContain('Card travado da vida');
    expect(await page.evaluate(()=>({cxe:D.cxe.length, rwe:D.rwe.length, uni:D.uni.map(u=>u.slug)})), 'caixa por entidade e unidade de vida saem na entrada do dado').toEqual({cxe:0, rwe:0, uni:['u-neg']});
    expect(erros).toEqual([]);
  });
}

const PG = `(()=>{ const l=(chave,valor)=>({chave,rotulo:chave,valor,fonte:'banco',padrao:valor,unidade:'n',dono:'igor',desde:'2026-10-01'});
  window.__dados={pg:[l('caixa.meta_dias',120),l('caixa.alerta_dias',10),l('idade.parado_dias',3),l('wip.teto_hoje',9),l('fila.teto_novos_dia',3),l('semana.teto_numeros',2)],
    semana:[1,2,3,4].map(i=>({bloco:'numero',ordem:i,titulo:'Numero '+i,ref:'x.n'+i,valor:i,ha_7d:i-1,meta:5,unidade:'num',direcao:'maior_melhor',detalhe:'dentro',dono:'igor'}))}; })();`;

test('p4.66 pi 180: os parametros de gestao vem de pg e mudam a tela; sem a chave, ou com valor que nao e numero, vale o numero do codigo', async ({page})=>{
  await page.addInitScript(PG);
  const erros = await abrir(page);
  /* com pg: meta de caixa, alerta (16 dias nao acende com alerta de 10), parado, WIP, teto de novos por dia e teto da Semana */
  await page.evaluate(()=>ir('caixa'));
  await expect(page.locator('#caixaTopo')).toContainText('Meta: 120 dias.');
  await expect(page.locator('#caixaTopo .v.numero'), 'alerta de caixa 10: 16 dias nao acende').not.toHaveClass(/\bw\b/);
  await expect(page.locator('#situacao .numero'), 'o mesmo alerta no Hoje').not.toHaveClass(/\bw\b/);
  await expect(page.locator('#wip .num'), 'teto de Hoje do banco').toHaveText('2/9');
  await page.evaluate(()=>{ INV.find(t=>t.id===2).parado_dias=4; renderFila(); });
  await expect(page.locator('#kanban .item', {hasText:'Card de exemplo'}).locator('.idade'), 'parado a partir de 3 dias').toContainText('parado 4 d');
  await page.evaluate(()=>ir('semana'));
  await expect(page.locator('#semNumeros .linha-r'), 'teto de numeros da Semana do banco').toHaveCount(2);
  await page.evaluate(()=>abrirNova('Ligar para o cliente de exemplo'));
  await expect(page.locator('#folha')).toContainText('teto de 3 cards seus por dia');
  await page.evaluate(()=>fecharFolha());
  /* sem a chave pg (ou valor que nao e numero) vale o fallback do codigo */
  await page.evaluate(()=>{ D.pg=[{chave:'caixa.meta_dias',valor:'abc'},{chave:'wip.teto_hoje',valor:null}]; render(); });
  await page.evaluate(()=>ir('caixa'));
  await expect(page.locator('#caixaTopo'), 'valor invalido: fallback 90').toContainText('Meta: 90 dias.');
  await expect(page.locator('#wip .num'), 'valor nulo: o teto da linha de Hoje (5)').toHaveText('2/5');
  await page.evaluate(()=>{ delete D.pg; render(); });
  await expect(page.locator('#caixaTopo .v.numero'), 'sem pg o alerta volta a 30: 16 dias acende').toHaveClass(/\bw\b/);
  await expect(page.locator('#kanban .item', {hasText:'Card de exemplo'}).locator('.idade'), 'sem pg parado so a partir de 7').not.toContainText('parado');
  await page.evaluate(()=>ir('semana'));
  await expect(page.locator('#semNumeros .linha-r'), 'sem pg o teto da Semana volta a 14').toHaveCount(4);
  await page.evaluate(()=>abrirNova('Ligar para o cliente de exemplo'));
  await expect(page.locator('#folha')).toContainText('teto de 8 cards seus por dia');
  expect(erros).toEqual([]);
});

const QUEST = `(()=>{ const q=(id,ordem,top3,titulo,de,para)=>({id,ordem,top3,titulo,detalhe:'Detalhe '+id,estado:'aberta',dono:'igor',prioridade:ordem,de_frente:de[0],de_nome:de[1],para_frente:para[0],para_nome:para[1],criada_em:'2026-10-10T10:00:00Z',idade_dias:id+4});
  window.__dados={quest:[q(1,1,true,'Quem fecha o preco do plano?',['20-contrato-pj','Contrato PJ'],['11-renda-alt','Renda Alt']),
    q(2,2,true,'Qual prazo da entrega?',['11-renda-alt','Renda Alt'],['20-contrato-pj','Contrato PJ']),
    q(3,3,true,'Quem paga a ART?',['20-contrato-pj','Contrato PJ'],['04-obra-residencial','Obra']),
    q(4,4,false,'Questao fora do top tres',['04-obra-residencial','Obra'],['20-contrato-pj','Contrato PJ'])]}; })();`;

test('p4.66 pi 181: a Semana mostra as 3 primeiras questoes com de, para, dono e idade; a ficha mostra as da frente; vazio explica por que', async ({page})=>{
  await page.addInitScript(QUEST);
  const erros = await abrir(page);
  await page.evaluate(()=>ir('semana'));
  const q = page.locator('#semQuest .quest');
  await expect(q, 'top 3, nao as 4').toHaveCount(3);
  await expect(q.nth(0)).toContainText('Quem fecha o preco do plano?');
  await expect(q.nth(0).locator('small')).toHaveText('Contrato PJ → Renda Alt, dono você, 5 d');
  await expect(page.locator('#semQuest')).not.toContainText('Questao fora do top tres');
  await expect(page.locator('#semQuest')).toContainText('1 outra aberta, fora do top 3');
  /* ficha: as questoes em que a frente e a destinataria (inclui a que nao esta no top 3) */
  await page.evaluate(()=>abrirFrente('20-contrato-pj'));
  const s = page.locator('#folha .fi-sec[aria-label="Questões para esta frente"]');
  await expect(s.locator('.rot')).toHaveText('Questões para esta frente2');
  await expect(s.locator('.d4i')).toHaveCount(2);
  await expect(s.locator('.d4i').nth(0)).toContainText('Qual prazo da entrega?');
  await expect(s.locator('.d4i').nth(1)).toContainText('Questao fora do top tres');
  await page.evaluate(()=>{ fecharFolha(); abrirFrente('11-renda-alt'); });
  await expect(page.locator('#folha .fi-sec[aria-label="Questões para esta frente"] .d4i')).toHaveCount(1);
  /* vazio explicado e chave ausente declarada */
  await page.evaluate(()=>{ fecharFolha(); D.quest=[]; render(); abrirFrente('20-contrato-pj'); });
  await expect(page.locator('#folha .fi-sec[aria-label="Questões para esta frente"]')).toContainText('nada aqui: nenhuma questão aberta para esta frente');
  await page.evaluate(()=>{ fecharFolha(); ir('semana'); });
  await expect(page.locator('#semQuest')).toHaveText('Nenhuma questão aberta entre frentes.');
  await page.evaluate(()=>{ delete D.quest; render(); });
  await expect(page.locator('#semQuest')).toContainText('As questões não chegaram nesta carga');
  await page.evaluate(()=>{ D.quest=[]; render(); });
  for (const w of [360, 390]) {
    await page.setViewportSize({width:w, height:820});
    expect(await page.evaluate(()=>{ document.body.style.letterSpacing='1.5px'; return document.documentElement.scrollWidth-document.documentElement.clientWidth; }), `rolagem horizontal a ${w}`).toBeLessThanOrEqual(0);
  }
  expect(erros).toEqual([]);
});

const BLOQ = `(()=>{ window.__dados={
  bloq:[{tarefa_id:2,frente_slug:'11-renda-alt',titulo:'Card de exemplo',dono:'igor',prazo:null,status:'pendente',n_bloqueios:1,rotulo:'bloqueado por Frente Exemplo',frentes_bloqueadoras:['20-contrato-pj'],entre_frentes:true,bloqueado_por:[]},
    {tarefa_id:5,frente_slug:'20-contrato-pj',titulo:'Segundo card',dono:'igor',prazo:null,status:'pendente',n_bloqueios:1,rotulo:'bloqueado por Outra Frente',frentes_bloqueadoras:['11-renda-alt'],entre_frentes:true,bloqueado_por:[]}],
  trava:[{frente_slug:'20-contrato-pj',nome:'Contrato PJ',n_cards_travados:2,n_cards_meus:1,frentes_travadas:['11-renda-alt','04-obra-residencial'],
    itens:[{tarefa_id:2,titulo:'Card travado de exemplo',frente_slug:'11-renda-alt'}]}]}; })();`;

test('p4.66 pi 182: Hoje e Fila mostram "bloqueado por <frente>" no card da tarefa bloqueada; a ficha mostra o que a frente trava; vazio explica', async ({page})=>{
  await page.addInitScript(BLOQ);
  const erros = await abrir(page);
  await expect(page.locator('#foco .chip.bloq'), 'o proximo passo (tarefa 2) vem com o selo').toHaveText('bloqueado por Frente Exemplo');
  await expect(page.locator('#ordem .bloq'), 'a lista de Hoje tambem (tarefa 5)').toHaveText('bloqueado por Outra Frente');
  await page.evaluate(()=>ir('fila'));
  await expect(page.locator('#kanban .item', {hasText:'Card de exemplo'}).locator('.bloq')).toHaveText('bloqueado por Frente Exemplo');
  await expect(page.locator('#kanban .item', {hasText:'Item esperando'}).locator('.bloq'), 'card sem bloqueio nao leva selo').toHaveCount(0);
  /* a ficha da frente que trava */
  await page.evaluate(()=>abrirFrente('20-contrato-pj'));
  const t = page.locator('#folha .fi-sec[aria-label="O que esta frente trava nas outras"]');
  await expect(t.locator('.rot')).toHaveText('O que esta frente trava nas outras2');
  await expect(t).toContainText('2 cards travados em Renda Alternativa, obra residencial');
  await expect(t).toContainText('Card travado de exemplo');
  /* frente que nao trava ninguem: o vazio diz por que */
  await page.evaluate(()=>{ fecharFolha(); abrirFrente('04-obra-residencial'); });
  await expect(page.locator('#folha .fi-sec[aria-label="O que esta frente trava nas outras"]')).toContainText('nada aqui: esta frente não segura nenhum card de outra frente');
  /* sem bloqueio no banco, nenhum selo */
  await page.evaluate(()=>{ fecharFolha(); D.bloq=[]; D.trava=[]; render(); });
  await expect(page.locator('.bloq')).toHaveCount(0);
  await page.evaluate(()=>{ delete D.trava; abrirFrente('20-contrato-pj'); });
  await expect(page.locator('#folha')).toContainText('O que a frente trava não chegou nesta carga');
  for (const w of [360, 390]) {
    await page.setViewportSize({width:w, height:820});
    expect(await page.evaluate(()=>{ document.body.style.letterSpacing='1.5px'; return document.documentElement.scrollWidth-document.documentElement.clientWidth; }), `rolagem horizontal a ${w}`).toBeLessThanOrEqual(0);
  }
  expect(erros).toEqual([]);
});

test('p4.66 onda 2: erro por chave e chave ausente acendem a saude por fonte com o motivo e apagam na carga boa', async ({page})=>{
  const erros = await abrir122(page);
  await expect(page.locator('#saude')).toHaveText('sistema ok');
  await page.evaluate(async()=>{ window.__errosCarga={ficha:'canceling statement due to statement timeout'}; window.__sem=['quest']; await carregar(); });
  await expect(page.locator('#saude')).toContainText('sistema degradado');
  await expect(page.locator('#saude')).toContainText('ficha das frentes falhou');
  await expect(page.locator('#saude')).toContainText('questões entre frentes falhou');
  await page.locator('button.estado').click();
  await expect(page.locator('#folha .fonte.w', {hasText:'Ficha das frentes'})).toContainText('statement timeout');
  await expect(page.locator('#folha .fonte.w', {hasText:'Questões entre frentes'})).toContainText('não veio na carga');
  await page.evaluate(async()=>{ fecharFolha(); window.__errosCarga=null; window.__sem=[]; await carregar(); });
  await expect(page.locator('#saude'), 'carga boa apaga').toHaveText('sistema ok');
  expect(erros).toEqual([]);
});

/* ---------- p4.67 · pi 181, a escrita das questoes (s6857, 17/10/2026) ----------
   Criterio do 181: "+ Nova cria questao; a Semana mostra as 3 primeiras; resolver vira card com dono". Na demonstracao as RPCs
   questao_criar, questao_resolver e questao_descartar mexem so na memoria da pagina. Cada teste reprova o main (p4.66). */
async function questAbrirNova(page, de, para, titulo){
  await page.evaluate(d=>{ ir('frentes'); abrirFrente(d); }, de);
  await page.locator('#folha button:has-text("+ Nova questão")').click();
  await page.locator('#qnPara').selectOption(para);
  await page.locator('#qnTit').fill(titulo);
  await page.locator('#folha button:has-text("Criar questão")').click();
}
test('p4.67 pi 181: + Nova questao na ficha cria a questao e ela aparece na Semana; repetir avisa que ja existia', async ({page})=>{
  const {erros, rede} = await abrirDemo(page, 390);
  await questAbrirNova(page, '11-consultoria', '20-contrato-pj', 'Quem aprova o aditivo?');
  await expect(page.locator('#tmsg')).toContainText('Questão criada para');
  await expect(page.locator('#folha')).toBeHidden();
  await page.evaluate(()=>ir('semana'));
  await expect(page.locator('#semQuest .quest')).toHaveCount(2);
  await expect(page.locator('#semQuest .quest').nth(1)).toContainText('Quem aprova o aditivo?');
  await expect(page.locator('#semQuest .quest').nth(1).locator('small')).toContainText('Consultoria de obras → Contrato de engenharia (PJ)');
  await questAbrirNova(page, '11-consultoria', '20-contrato-pj', 'Quem aprova o aditivo?');
  await expect(page.locator('#tmsg')).toContainText('já existia');
  await page.evaluate(()=>ir('semana'));
  await expect(page.locator('#semQuest .quest'), 'nada duplicado').toHaveCount(2);
  /* formulario incompleto nao chama o banco */
  await page.evaluate(()=>{ ir('frentes'); abrirFrente('11-consultoria'); });
  await page.locator('#folha button:has-text("+ Nova questão")').click();
  await page.locator('#folha button:has-text("Criar questão")').click();
  await expect(page.locator('#qErro')).toContainText('Escreva o título');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
  expect(rede).toEqual([]); expect(erros).toEqual([]);
});

test('p4.67 pi 181: Resolver manda criterio, prazo e classe A/S/M ao banco, valida as 3 regras antes de chamar e mostra a recusa do banco; vira card com dono', async ({page})=>{
  const {erros} = await abrirDemo(page, 390);
  await page.evaluate(()=>{ window.__qc=[]; const r=sb.rpc; sb.rpc=(n,a)=>{ if(/^questao_/.test(n))window.__qc.push({n,a}); return r(n,a); }; ir('semana'); });
  const chamadas = ()=>page.evaluate(()=>window.__qc.filter(c=>c.n==='questao_resolver').length);
  await page.locator('#semQuest .quest').first().click();
  await page.locator('#folha button:has-text("Resolver")').click();
  await expect(page.locator('#qrDt'), 'prazo padrao: hoje de Cuiaba').toHaveValue(await page.evaluate(()=>hojeCuiaba()));
  await expect(page.locator('#qrClasse'), 'classe padrao M').toHaveValue('M');
  const criar = page.locator('#folha button:has-text("Criar o card")');
  /* validacao local: nada vai ao banco */
  await criar.click(); await expect(page.locator('#qErro')).toContainText('Diga a solução');
  await page.locator('#qrSol').fill('curta'); await criar.click(); await expect(page.locator('#qErro')).toContainText('10 letras');
  await page.locator('#qrSol').fill('Fechar com 10% de desconto à vista');
  await page.locator('#qrCard').fill('Responder o preço do plano anual');
  await expect(page.locator('#qrMot'), 'motivo do M pre-preenchido com o titulo').toHaveValue('decidir: Responder o preço do plano anual');
  await criar.click(); await expect(page.locator('#qErro')).toContainText('quando o card está pronto');
  expect(await chamadas(), 'nenhuma chamada com a folha incompleta').toBe(0);
  await page.locator('#qrCrit').fill('Resposta enviada ao cliente');
  await page.locator('#qrMot').fill('so o Igor decide');
  await criar.click(); await expect(page.locator('#qErro'), 'M sem verbo no motivo').toContainText('começa pelo verbo');
  expect(await chamadas()).toBe(0);
  /* recusa do banco (titulo sem verbo) aparece no toast e na folha, que segue aberta */
  await page.locator('#qrMot').fill('decidir: so o Igor decide a solucao');
  await page.locator('#qrCard').fill('Preço do plano anual');
  await criar.click();
  await expect(page.locator('#tmsg')).toContainText('sem verbo'); await expect(page.locator('#toast')).toHaveClass(/bad/);
  await expect(page.locator('#qErro')).toContainText('sem verbo');
  await page.locator('#qrCard').fill('Responder o preço do plano anual');
  /* A: o motivo some e vai nulo */
  await page.locator('#qrClasse').selectOption('A');
  await expect(page.locator('#qrMotBox')).toBeHidden();
  await criar.click();
  await expect(page.locator('#tmsg')).toContainText(/card t\d+ criado em Consultoria de obras para você/);
  const c = await page.evaluate(()=>window.__qc.filter(c=>c.n==='questao_resolver').pop().a);
  expect(c).toEqual({p_id:1,p_solucao:'Fechar com 10% de desconto à vista',p_card_titulo:'Responder o preço do plano anual',p_criterio:'Resposta enviada ao cliente',
    p_prazo:await page.evaluate(()=>hojeCuiaba()),p_automatibilidade:'A',p_automat_motivo:null});
  await page.evaluate(()=>ir('semana'));
  await expect(page.locator('#semQuest')).toHaveText('Nenhuma questão aberta entre frentes.');
  await expect.poll(()=>page.evaluate(()=>INV.some(t=>t.titulo==='Responder o preço do plano anual'&&t.frente==='11-consultoria'&&t.dono==='igor'&&t.criterio_pronto==='Resposta enviada ao cliente'))).toBe(true);
  expect(erros).toEqual([]);
});

test('p4.67 pi 181: a RPC fictícia do Resolver aplica as recusas do banco (criterio, 10 letras, classe e motivo do M)', async ({page})=>{
  const {erros} = await abrirDemo(page, 390);
  const r = await page.evaluate(async()=>{ const ok={p_id:1,p_solucao:'Solucao com letras suficientes',p_card_titulo:'Responder o cliente',p_criterio:'Enviado',p_prazo:hojeCuiaba(),p_automatibilidade:'M',p_automat_motivo:'decidir: x'};
    const q=async o=>(await sb.rpc('questao_resolver',{...ok,...o})).error?.message||'ok';
    return {semCrit:await q({p_criterio:null}), curta:await q({p_solucao:'curta'}), semClasse:await q({p_automatibilidade:null}), mSemVerbo:await q({p_automat_motivo:'sei la'}), bom:await q({})}; });
  expect(r.semCrit).toContain('criterio de pronto'); expect(r.curta).toContain('10+ letras'); expect(r.semClasse).toContain('A/S/M'); expect(r.mSemVerbo).toContain('verbo'); expect(r.bom).toBe('ok');
  expect(erros).toEqual([]);
});

test('p4.67 pi 181: Descartar pede o motivo e tira a questao da lista; o glossario aceita Resolver', async ({page})=>{
  const {erros} = await abrirDemo(page, 390);
  await page.evaluate(()=>ir('semana'));
  await page.locator('#semQuest .quest').first().click();
  expect(await page.locator('#folha button').allTextContents()).toEqual(expect.arrayContaining(['Resolver','Descartar']));
  await page.locator('#folha button:has-text("Descartar")').click();
  await page.locator('#folha button:has-text("Descartar a questão")').click();
  await expect(page.locator('#qErro')).toContainText('Diga o motivo');
  await page.locator('#qdMot').fill('Já decidido em reunião');
  await page.locator('#folha button:has-text("Descartar a questão")').click();
  await expect(page.locator('#tmsg')).toContainText('Questão descartada');
  await page.evaluate(()=>ir('semana'));
  await expect(page.locator('#semQuest')).toHaveText('Nenhuma questão aberta entre frentes.');
  expect(await page.evaluate(()=>GLOSSARIO.resolver)).toBe('Resolver');
  expect(erros).toEqual([]);
});

test('p4.67 pi 181: na tela compartilhada o destino da nova questao nao oferece frente PF nem de vida', async ({page})=>{
  await page.addInitScript(()=>{ window.__dados={uni:[{slug:'u-vida',nome:'Vida',tipo:'vida',entidade:'IGV',dono:'igor'}]}; });
  await abrirTela(page, [{slug:'11-renda-alt',entidade:'PF',unidade:null},{slug:'20-contrato-pj',entidade:'DABLI',unidade:null},{slug:'04-obra-residencial',entidade:'IGV',unidade:'u-vida'},{slug:'09-teste',entidade:'DABLI',unidade:null}]);
  await page.evaluate(()=>{ ARV=ARV.concat([{nivel:1,no:'04-obra-residencial',rotulo:'Obra Vida'},{nivel:1,no:'09-teste',rotulo:'Frente Teste'}]).filter(a=>!privada(a.no)); questNova('20-contrato-pj'); });
  expect(await page.$$eval('#qnPara option', o=>o.map(x=>x.value))).toEqual(['09-teste']);
  expect((await page.locator('#folha').innerText()).match(/R\$\s?-?\d/g)||[]).toEqual([]);
});

/* 183 (p4.68, s6946): a prestacao do executor mora na Fila do presidente; o bastidor e so diagnostico tecnico. */
test('183 · a Fila presta contas do executor sem mandar ao bastidor', async ({page})=>{
  await abrir(page);
  await page.evaluate(()=>{ ir('fila'); });
  const rod = page.locator('#filaRodape');
  await expect(rod).toHaveAttribute('data-exec','1');
  await expect(rod).toContainText('feitos em 7 dias');
  await expect(rod).toContainText('no ponto');
  await expect(rod).toContainText('rotina exemplo');
  await expect(rod).toContainText('Conferir extrato do mês');
  expect((await rod.innerText()).toLowerCase()).not.toContain('bastidor');
  const lk = page.locator('a[href="index.html"]').first();
  await expect(lk).toHaveText('diagnóstico técnico');
});
test('183 · sem a chave exec a Fila diz que a prestacao esta sem medida', async ({page})=>{
  await page.addInitScript(()=>{ window.__sem=['exec']; });
  await abrir(page);
  await page.evaluate(()=>{ ir('fila'); });
  const rod = page.locator('#filaRodape');
  await expect(rod).not.toHaveAttribute('data-exec','1');
  await expect(rod).toContainText('sem medida nesta carga');
  expect((await rod.innerText()).toLowerCase()).not.toContain('bastidor');
});
test('183 · na tela compartilhada a prestacao do executor nao mostra card de frente PF', async ({page})=>{
  await abrirTela(page);
  await page.evaluate(()=>{ ir('fila'); });
  const rod = page.locator('#filaRodape');
  await expect(rod).toHaveAttribute('data-exec','1');
  const txt = await rod.evaluate(e=>e.textContent);
  expect(txt).not.toContain('Conferir extrato do mês');
  expect(txt).not.toContain('Renda Alternativa');
  expect(txt).toContain('Revisar a lista de pendências');
});

/* ===== p4.69 · onda 4 (s6948): pi 184 L10, 185 prioridades, 186 Folha Mes, 187 vida. Dados fictícios. ===== */
const L10_FIC = [['abertura',2,null,null,'uma boa noticia pessoal e uma do negocio'],['numeros',5,'6',2,'numeros do placar; alerta = fora da meta'],['prioridades',4,'0',0,'0 no prumo, 0 fora, 2 unidade(s) sem prioridade'],
  ['manchetes',2,'9',null,'decisoes dos ultimos 7 dias'],['afazeres',3,'7',1,'cards seus e itens do plano com prazo em 7 dias'],['ids',12,'0',null,'sem questao aberta: o vazio e o resultado'],['conclusao',2,null,1,'revisao da semana aberta: fechar grava os minutos']]
  .map(([segmento,min_alvo,valor,alerta,resumo],i)=>({ordem:i+1,segmento,min_alvo,valor,alerta,resumo}));
const MES0 = (()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01'; })();
const MES1 = (()=>{ const d=new Date(new Date().getFullYear(),new Date().getMonth()-1,1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01'; })();
const dreFic=(mes,sit)=>[{mes,unidade:'u-neg',unidade_nome:'Unidade Alfa',tipo:'negocio',entidade:'DABLI',receita:5000,custo_direto:1000,margem_dono:4000,horas:20,rs_hora:200,piso_rs_hora:63.03,teto_rs_hora:480,zona_hora:'na faixa',situacao:sit,fechado_em:null},
  {mes,unidade:'u-min',unidade_nome:'Unidade Beta',tipo:'apoio',entidade:'DABLI',receita:0,custo_direto:0,margem_dono:0,horas:0.3,rs_hora:0,piso_rs_hora:63.03,teto_rs_hora:480,zona_hora:'abaixo do piso',situacao:sit,fechado_em:null}];
const PRIO_FIC = [{unidade:'u-neg',unidade_nome:'Unidade Alfa',tipo:'negocio',entidade:'DABLI',trimestre:'2026T4',ativas:3,no_prumo:2,fora:1,feitas:0,alerta:null,revisada:false,itens:[{id:1,titulo:'Meta fictícia da Alfa',dono:'igor',marco:'2026-12-15',estado:'no_prumo'}]},
  {unidade:'u-min',unidade_nome:'Unidade Beta',tipo:'negocio',entidade:'DABLI',trimestre:'2026T4',ativas:0,no_prumo:0,fora:0,feitas:0,alerta:'sem prioridade',revisada:false,itens:[]}];
const VIDA_FIC = ['Vida Um','Vida Dois'].map((n,i)=>({frente:'0'+i+'-vida-fic',frente_nome:n,rotulo:null,unidade:null,direcao:null,meta:null,valor:null,medido_em:null,valor_anterior:null,estado:'sem numero'}));
const DRE_FIC = () => dreFic(MES0,'mes corrente').concat(dreFic(MES1,'atrasado: fechar'));
async function abrirOnda4(page, extra={}){
  await page.addInitScript(d=>{ window.__dados=Object.assign({l10:d.l10,prio:d.prio,dre:d.dre,vida:d.vida},d.extra||{}); }, {l10:L10_FIC,prio:PRIO_FIC,dre:DRE_FIC(),vida:VIDA_FIC,extra});
  return abrir(page);
}

test('184 (p4.69) · a Semana segue os 7 segmentos do L10 em 30 min, destaca o alerta e fecha gravando os minutos', async ({page})=>{
  const erros = await abrirOnda4(page);
  await page.evaluate(()=>{ ir('semana'); });
  const ordem = await page.locator('#p-semana .l10seg').evaluateAll(l=>l.map(e=>e.dataset.seg));
  expect(ordem).toEqual(['abertura','numeros','prioridades','manchetes','afazeres','ids','conclusao']);
  await expect(page.locator('#l10Total')).toContainText('30 min');
  const mins = await page.locator('#p-semana .l10seg .l10min').allInnerTexts();
  expect(mins.length).toBe(7);
  expect(mins[1]).toContain('5 min');
  const destaque = await page.locator('#p-semana .l10seg[data-alerta]').evaluateAll(l=>l.map(e=>e.dataset.seg));
  expect(destaque, 'so segmento com alerta > 0 fica em destaque').toEqual(['numeros','afazeres','conclusao']);
  await expect(page.locator('.l10seg[data-seg="numeros"] .l10al')).toContainText('2 fora da meta');
  const bt = page.locator('.l10seg[data-seg="conclusao"] #semFechar');
  await expect(bt, 'o botao de fechar mora na conclusao').toBeVisible();
  await bt.click();
  const c = await page.evaluate(()=>window.__rpc.filter(r=>r.n==='semana_revisao_fechar'));
  expect(c.length).toBe(1);
  expect(c[0].a.p_minutos).toBeGreaterThanOrEqual(1);
  expect(erros).toEqual([]);
});

test('185 (p4.69) · prioridades do trimestre por unidade: no prumo e fora', async ({page})=>{
  await abrirOnda4(page);
  await page.evaluate(()=>{ ir('semana'); });
  const a = page.locator('#semPrio .linha-r[data-unidade="u-neg"]');
  await expect(a).toContainText('Unidade Alfa');
  await expect(a).toContainText('2 no prumo');
  await expect(a).toContainText('1 fora');
  await expect(a).toContainText('Meta fictícia da Alfa');
  const b = page.locator('#semPrio .linha-r[data-unidade="u-min"]');
  await expect(b).toContainText('0 no prumo');
  await expect(b).toContainText('sem prioridade');
});
test('185 (p4.69) · sem prioridade em nenhuma unidade o painel diz por que esta zerado', async ({page})=>{
  await abrirOnda4(page, {prio:PRIO_FIC.map(x=>({...x,ativas:0,no_prumo:0,fora:0,alerta:'sem prioridade',itens:[]}))});
  await page.evaluate(()=>{ ir('semana'); });
  await expect(page.locator('#semPrio .vazio')).toContainText('Ninguém definiu prioridade de 2026T4');
});

test('186 (p4.69) · Folha Mes por unidade; fechar pede confirmacao e so entao chama dre_mes_fechar', async ({page})=>{
  await abrirOnda4(page);
  await page.evaluate(()=>{ ir('caixa'); });
  const mes = page.locator('#dreBox details.dre-mes');
  await expect(mes).toHaveCount(2);
  await expect(mes.first()).toContainText('mes corrente');
  await expect(mes.first().locator('.linha-r[data-unidade="u-neg"]')).toContainText('R$ 4.000');
  await expect(mes.first().locator('.linha-r[data-unidade="u-neg"]')).toContainText('R$ 200 por hora');
  await expect(mes.first().locator('.linha-r[data-unidade="u-min"]'), 'menos de 1 h: R$/h e ruido').toContainText('menos de 1 h');
  await expect(mes.first().locator('.dre-fechar'), 'mes corrente nao tem botao de fechar').toHaveCount(0);
  await mes.nth(1).locator('summary').click();
  await expect(mes.nth(1)).toContainText('atrasado: fechar');
  await mes.nth(1).locator('.dre-fechar').click();
  await expect(page.locator('#folha')).toContainText('Fechar');
  expect(await page.evaluate(()=>window.__rpc.filter(r=>r.n==='dre_mes_fechar').length), 'abrir a confirmacao nao grava').toBe(0);
  await page.locator('#folha button.sec[data-acao="fecharFolha"]').click();
  expect(await page.evaluate(()=>window.__rpc.filter(r=>r.n==='dre_mes_fechar').length), 'cancelar nao grava').toBe(0);
  await mes.nth(1).locator('.dre-fechar').click();
  await page.locator('#folha [data-acao="dreFecharOk"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(r=>r.n==='dre_mes_fechar').map(r=>r.a.p_mes))).toEqual([MES1]);
});

test('187 (p4.69) · um numero por frente de vida so na Semana, nunca em Hoje; vazio explicado', async ({page})=>{
  await abrirOnda4(page);
  const v = page.locator('#semVida .linha-r');
  await page.evaluate(()=>{ ir('semana'); });
  await expect(v).toHaveCount(2);
  await expect(v.first()).toContainText('sem número');
  await expect(page.locator('#semVida .vazio')).toContainText('2 frentes de vida estão sem número');
  for (const aba of ['hoje','fila','caixa','frentes']) {
    await page.evaluate(a=>{ ir(a); }, aba);
    expect(await page.locator('#p-'+aba).innerText(), 'vida so na Semana: '+aba).not.toContain('Vida Dois');
  }
});
test('187 (p4.69) · estados medida velha e dentro dizem o numero e a meta', async ({page})=>{
  await abrirOnda4(page, {vida:[{...VIDA_FIC[0],estado:'dentro',rotulo:'Dias de treino',meta:3,valor:4,unidade:'dias'},{...VIDA_FIC[1],estado:'medida velha',rotulo:'Sono',medido_em:'2026-09-01'}]});
  await page.evaluate(()=>{ ir('semana'); });
  await expect(page.locator('#semVida .linha-r').first()).toContainText('Dias de treino: 4 contra meta 3 dias');
  await expect(page.locator('#semVida .linha-r').nth(1)).toContainText('já passou do prazo');
});

test('172 (p4.69) · tela compartilhada esconde vida, PF e todo R$, inclusive a Folha Mes', async ({page})=>{
  await page.addInitScript(d=>{ window.__dados={l10:d.l10,prio:d.prio,dre:d.dre,vida:d.vida}; },
    {l10:L10_FIC,prio:PRIO_FIC.concat([{...PRIO_FIC[0],unidade:'u-pf',unidade_nome:'Renda PF fictícia',entidade:'PF',itens:[]}]),dre:DRE_FIC(),vida:VIDA_FIC});
  const erros = await abrirTela(page, [{slug:'20-contrato-pj',entidade:'DABLI'}]);
  await page.evaluate(()=>{ ir('semana'); });
  const sem = await page.locator('#p-semana').innerText();
  expect(sem).not.toContain('Vida Um');
  expect(sem).not.toContain('Renda PF fictícia');
  expect(sem).toContain('Unidade Alfa');
  expect(sem).not.toMatch(/R\$\s?\d/);
  await expect(page.locator('#semVidaBox')).toBeHidden();
  const dre = await page.evaluate(()=>({txt:document.getElementById('dreBox').textContent, oculto:document.getElementById('dreBox').hidden}));
  expect(dre.oculto).toBe(true);
  expect(dre.txt).toBe('');
  expect(await page.locator('body').innerText()).not.toMatch(/R\$\s?\d/);
  expect(erros).toEqual([]);
});

/* p4.72 (t3702, CV-02, s7950): a Fila tem a sub-aba Unica, lida da v_pendencia_convergencia toda vez que abre.
   O filtro "Pauta do bastao" casa so t, doc e env citados no handoff.proxima: f e s da pauta sao fato e sessao.
   p4.73: a pauta cita demanda e proposta pelo codigo nu "PC-AAAA-NNN"; a view as chama dPC-... e pPC-... */
test('fila única: lê a v_pendencia_convergencia ao vivo e filtra pela pauta do bastão', async ({page})=>{
  await page.setViewportSize({width:360, height:820});
  await page.addInitScript(()=>{ window.__tab={
    v_pendencia_convergencia:[
      {codigo:'t9001',frente:'20-contrato-pj',dono:'igor',etapa:'card',titulo:'Card de exemplo na pauta',prazo:'2020-01-02',em_jogo_rs:1000,status:'pendente',vencido:true,idade_dias:9,sinais:['sem_opcao']},
      {codigo:'doc77',frente:'11-renda-alt',dono:'igor',etapa:'pronta_nao_enviada',titulo:'Peca de exemplo pronta',prazo:null,em_jogo_rs:null,status:'A_AGIR',vencido:null,idade_dias:3,sinais:[]},
      {codigo:'f9002',frente:'11-renda-alt',dono:'igor',etapa:'a_pagar_sem_baixa',titulo:'Lancamento de exemplo',prazo:'2020-01-01',em_jogo_rs:50,status:'confirmado',vencido:true,idade_dias:1,sinais:[]},
      {codigo:'t9003',frente:'20-contrato-pj',dono:'claude',etapa:'card',titulo:'Card de exemplo do executor',prazo:'2099-01-01',em_jogo_rs:null,status:'pendente',vencido:false,idade_dias:1,sinais:[]},
      {codigo:'dPC-2099-901',frente:'20-contrato-pj',dono:'igor',etapa:'demanda',titulo:'Demanda de exemplo',prazo:null,em_jogo_rs:null,status:'aberto',vencido:false,idade_dias:2,sinais:[]},
      {codigo:'pPC-2099-902',frente:'11-renda-alt',dono:'igor',etapa:'proposta_sem_aceite',titulo:'Proposta de exemplo',prazo:'2099-02-01',em_jogo_rs:900,status:'enviada',vencido:false,idade_dias:2,sinais:[]},
      {codigo:'pPC-2099-903',frente:'11-renda-alt',dono:'igor',etapa:'proposta_sem_aceite',titulo:'Proposta fora da pauta',prazo:'2099-02-01',em_jogo_rs:900,status:'enviada',vencido:false,idade_dias:2,sinais:[]}],
    frente:[{slug:'20-contrato-pj',proxima:'1) 20/10: t9001 e doc77; conferir f9002 (fato) e s9003 (sessao). 2) PC-2099-901 e aceite da PC-2099-902; PC-2099-9030 nao e a 903.'},{slug:'11-renda-alt',proxima:null}]}; });
  const erros = await abrir(page);
  await page.evaluate(()=>ir('fila'));
  await expect(page.locator('#filaModo button')).toHaveCount(2);
  await expect(page.locator('#fu-raiz')).toBeHidden();
  await page.locator('#filaModo button[data-a1="unica"]').click();
  await expect(page.locator('#fu-raiz .fu-it')).toHaveCount(7);
  await expect(page.locator('#kanban')).toBeHidden();
  await expect(page.locator('#filaModo button[data-a1="unica"]')).toHaveText(/Única 7/);
  const ordem = await page.locator('#fu-raiz .fu-it').evaluateAll(l=>l.map(x=>x.dataset.cod));
  expect(ordem.slice(0,2).sort(), 'vencidos primeiro').toEqual(['f9002','t9001']);
  await page.locator('#fu-raiz button[data-a1="pauta"]').click();
  const pauta = await page.locator('#fu-raiz .fu-it').evaluateAll(l=>l.map(x=>x.dataset.cod).sort());
  expect(pauta, 'pauta casa t, doc e PC (demanda e proposta); f e s da pauta nao sao fluxo nem sugestao; PC-2099-9030 nao e 903').toEqual(['dPC-2099-901','doc77','pPC-2099-902','t9001']);
  await page.locator('#fu-raiz button[data-a1="claude"]').click();
  await expect(page.locator('#fu-raiz .fu-it')).toHaveCount(1);
  /* ao vivo: a view muda no banco, o painel le de novo ao reabrir a sub-aba, sem recarregar a pagina */
  await page.evaluate(()=>{ window.__tab.v_pendencia_convergencia=window.__tab.v_pendencia_convergencia.slice(0,1); });
  await page.locator('#filaModo button[data-a1="quadro"]').click();
  await expect(page.locator('#kanban')).toBeVisible();
  await page.locator('#filaModo button[data-a1="unica"]').click();
  await expect(page.locator('#filaModo button[data-a1="unica"]')).toHaveText(/Única 1/);
  const m = await page.evaluate(()=>({
    larga: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    baixos: [...document.querySelectorAll('#p-fila button')].filter(b=>b.offsetParent&&b.getBoundingClientRect().height<44).length}));
  expect(m.larga, 'sem rolagem horizontal a 360').toBe(0);
  expect(m.baixos, 'controle abaixo de 44 px').toBe(0);
  expect(erros).toEqual([]);
});

/* ---------- p4.74 · P3 (s8199, 20/10/2026): o card se resolve sozinho ----------
   O Igor quer resolver qualquer card sem abrir o Claude. Cinco defeitos, cada um com teste que reprova o origin/main (p4.73):
   (a) peca de saida ligada ao card nao tinha Enviar daqui nem Enviei por dentro do card; (b) folha sem X fixo;
   (c) a Fila Unica listava e nao abria nada; (d) o caixa por entidade era minigrafico sem eixo, sem R$ nem data;
   (e) a legenda do 13 semanas dizia "laranja" para a pior semana que a tela pinta de vermelho. Tudo ficticio: o repo e publico. */
const LIGA_PECA_AO_CARD = page=>page.evaluate(async()=>{
  await msCarregar(); const m=JSON.parse(JSON.stringify(MS.dados));
  m.estoque=m.estoque.map(p=>p.id===102?Object.assign(p,{tarefa:2,fecha_tarefa:true}):p); window.__mesa=m; await msCarregar(); });

test('p4.74 a: o card com peca de saida ligada traz Enviar daqui completo e a baixa sai do proprio card, com selo sem prova', async ({page})=>{
  const erros = await abrir(page);
  await LIGA_PECA_AO_CARD(page);
  await page.evaluate(()=>abrirFila(0));
  const bloco = page.locator('#folha #cardEnvio');
  await expect(bloco, 'o card traz o bloco da peca de saida').toBeVisible();
  for (const id of ['#msPeca','#msBtWhats','#msBtCompart','#msBaixaBloco','#msDest','#msArq'])
    await expect(bloco.locator(id), id+' dentro do card').toBeVisible();
  await expect(bloco.locator('.ms-canal'), 'os seis canais').toHaveCount(6);
  await expect(bloco, 'sem print a baixa e declaracao com selo').toContainText('Sem print, a baixa vai como declaração com selo «sem prova»');
  await expect(bloco.locator('#msSemProva')).toBeVisible();
  /* o handler fixa a peca pelo id do botao, nao pelo estado de quem abriu a folha */
  await page.evaluate(()=>{ MS.peca=null; MS.canal=null; });
  await page.click('#folha #cardEnvio [data-canal="whatsapp"]');
  await page.click('#folha #msBt'); await expect(page.locator('#folha #msBt'), 'sem print o 1o toque pede o print').toHaveText('Enviei sem print'); await page.click('#folha #msBt');
  await expect.poll(()=>baixasP134(page)).toEqual([{p_doc:102,p_canal:'whatsapp',p_dest:'Cliente de exemplo',p_prova_path:null}]);
  await expect(page.locator('#tmsg')).toContainText('selo sem prova');
  expect(erros).toEqual([]);
});

test('p4.74 a: com print escolhido o selo some e o arquivo sobe antes da baixa; a Mesa segue igual', async ({page})=>{
  const erros = await abrir(page);
  await LIGA_PECA_AO_CARD(page);
  await page.evaluate(()=>abrirFila(0));
  await page.click('#folha #cardEnvio [data-canal="email_corporativo"]');
  await page.setInputFiles('#folha #msArq', {name:'print.png', mimeType:'image/png', buffer:Buffer.from('x')});
  await expect(page.locator('#folha #msSemProva'), 'com arquivo escolhido o selo some').toBeHidden();
  await page.click('#folha #msBt');
  await expect.poll(()=>baixasP134(page).then(l=>l.length)).toBe(1);
  const b = (await baixasP134(page))[0];
  expect(b.p_doc).toBe(102); expect(b.p_canal).toBe('email_corporativo');
  expect(b.p_prova_path, 'caminho do print no bucket mesa-provas').toMatch(/^\d{4}-\d{2}\/102_\d+\.png$/);
  expect(await page.evaluate(()=>window.__storage.filter(c=>c.op==='upload').map(c=>c.b))).toEqual(['mesa-provas']);
  await expect(page.locator('#tmsg')).toContainText('com print');
  /* a folha da Mesa usa o mesmo componente: mesmos ids, e o selo aparece de novo */
  await page.evaluate(()=>msAbrirId(102));
  await expect(page.locator('#folha #msEnviarBloco')).toBeVisible();
  await expect(page.locator('#folha #msSemProva')).toBeVisible();
  expect(erros).toEqual([]);
});

test('p4.74 a: Saiu hoje na Mesa mostra o chip sem prova na baixa declaratoria', async ({page})=>{
  await abrir(page);
  await page.evaluate(async()=>{ await msCarregar(); const m=JSON.parse(JSON.stringify(MS.dados));
    m.saiu_hoje=[{id:90,titulo:'Saida com print',dest:'Fiscal de exemplo',prova:'documental'},{id:91,titulo:'Saida sem print',dest:'Cliente de exemplo',prova:'declaratoria'}];
    window.__mesa=m; await msCarregar(); });
  await page.evaluate(()=>ir('mesa'));
  const l = page.locator('#ms-raiz .ms-saiu');
  await expect(l).toHaveCount(2);
  await expect(l.nth(0).locator('.chip')).toHaveCount(0);
  await expect(l.nth(1).locator('.chip')).toHaveText('sem prova');
});

test('p4.74 b: toda folha tem X fixo de 44 px que fecha e fica visivel ao rolar', async ({page})=>{
  await page.setViewportSize({width:360, height:420});
  const erros = await abrir(page);
  const abridores = [()=>abrirFila(0), ()=>abrirVoz(), ()=>{ ir('mesa'); return msCarregar().then(()=>msAbrirId(102)); }];
  for (const abre of abridores) {
    await page.evaluate(abre);
    const x = page.locator('#folha .folha-x');
    await expect(x, 'X na folha').toHaveCount(1);
    await expect(x).toHaveAttribute('aria-label','Fechar');
    await expect(x).toHaveAttribute('data-acao','fecharFolha');
    const m = await page.evaluate(async()=>{
      const f=document.getElementById('folha'), x=f.querySelector('.folha-x'); const cs=getComputedStyle(x);
      f.scrollTop=f.scrollHeight; await new Promise(r=>setTimeout(r,50));
      const rx=x.getBoundingClientRect(), rf=f.getBoundingClientRect(), r0=rx;
      return {pos:cs.position, top:cs.top, w:rx.width, h:rx.height, rola:f.scrollTop>0, dentro:rx.top>=rf.top-1&&rx.top<=rf.top+24&&rx.bottom<=rf.bottom, r0:r0.top};
    });
    expect(m.pos).toBe('sticky'); expect(m.top).toBe('0px');
    expect(m.w, 'area de toque').toBeGreaterThanOrEqual(44); expect(m.h).toBeGreaterThanOrEqual(44);
    expect(m.rola, 'a folha rola neste teste').toBe(true);
    expect(m.dentro, 'o X continua no topo da folha depois de rolar ate o fim').toBe(true);
    await x.click();
    await expect(page.locator('#veu')).toBeHidden();
  }
  /* Esc segue fechando */
  await page.evaluate(()=>abrirFila(0));
  await page.keyboard.press('Escape');
  await expect(page.locator('#veu')).toBeHidden();
  expect(erros).toEqual([]);
});

const FU_P3 = [
  {codigo:'t2',frente:'11-renda-alt',dono:'igor',etapa:'card',titulo:'Card que o painel conhece',prazo:'2099-01-02',em_jogo_rs:null,status:'pendente',vencido:false,idade_dias:3,sinais:[]},
  {codigo:'t9999',frente:'20-contrato-pj',dono:'igor',etapa:'card',titulo:'Card que o inventario nao tem',prazo:'2020-01-02',em_jogo_rs:null,status:'pendente',vencido:true,idade_dias:9,sinais:['para_decidir']},
  {codigo:'doc102',frente:'11-renda-alt',dono:'igor',etapa:'pronta_nao_enviada',titulo:'Peca que a Mesa conhece',prazo:null,em_jogo_rs:null,status:'A_AGIR',vencido:null,idade_dias:2,sinais:[]},
  {codigo:'doc8888',frente:'11-renda-alt',dono:'igor',etapa:'pronta_nao_enviada',titulo:'Peca fora da Mesa',prazo:null,em_jogo_rs:null,status:'A_AGIR',vencido:null,idade_dias:2,sinais:[]},
  {codigo:'dE1',frente:'20-contrato-pj',dono:'claude',etapa:'demanda',titulo:'Demanda de exemplo E',prazo:'2099-03-01',em_jogo_rs:null,status:'amarelo',vencido:false,idade_dias:5,sinais:[]},
  {codigo:'dL1',frente:'20-contrato-pj',dono:'igor',etapa:'demanda',titulo:'Demanda de exemplo L',prazo:null,em_jogo_rs:null,status:'amarelo',vencido:null,idade_dias:5,sinais:['frente_em_encerramento']},
  {codigo:'dPC-2099-901',frente:'20-contrato-pj',dono:'igor',etapa:'demanda',titulo:'Demanda de exemplo PC',prazo:null,em_jogo_rs:null,status:'aberto',vencido:null,idade_dias:2,sinais:[]},
  {codigo:'pPC-2099-902',frente:'11-renda-alt',dono:'igor',etapa:'proposta_sem_aceite',titulo:'Proposta de exemplo',prazo:'2099-02-01',em_jogo_rs:900,status:'enviada',vencido:false,idade_dias:2,sinais:[]},
  {codigo:'env7',frente:'11-renda-alt',dono:'igor',etapa:'enviada_sem_aceite',titulo:'Envio de exemplo',prazo:null,em_jogo_rs:null,status:'whatsapp',vencido:null,idade_dias:10,sinais:[]},
  {codigo:'s9',frente:'20-contrato-pj',dono:'igor',etapa:'sugestao_sem_decisao',titulo:'Sugestao de exemplo',prazo:null,em_jogo_rs:null,status:'nova',vencido:null,idade_dias:0,sinais:[]}];

test('p4.74 c: cada item da Fila Unica abre uma folha com X; rotulos dizem de quem e a lista', async ({page})=>{
  await page.setViewportSize({width:360, height:820});
  await page.addInitScript(l=>{ window.__tab={ v_pendencia_convergencia:l, frente:[],
    v_fila_contagem:[{rotulo:'so seus (dono igor)',n:133,para_decidir:0},{rotulo:'todos os donos',n:186,para_decidir:0}] }; }, FU_P3);
  const erros = await abrir(page);
  await page.evaluate(()=>ir('fila'));
  await page.locator('#filaModo button[data-a1="unica"]').click();
  await expect(page.locator('#fu-raiz .fu-it')).toHaveCount(10);
  /* rotulos */
  await expect(page.locator('#filaModo button[data-a1="unica"]')).toHaveText('Única 10 · todos');
  await expect(page.locator('#fuCont')).toHaveText('só seus 133 · todos 186');
  await expect(page.locator('#fu-raiz button[data-a1="toda"]')).toContainText('Todos os donos');
  await expect(page.locator('#fu-raiz button[data-a1="igor"]')).toContainText('Só seus');
  await page.locator('#fu-raiz button[data-a1="decidir"]').click();
  await expect(page.locator('#fu-raiz .fu-it'), 'filtro Para decidir pelo sinal').toHaveCount(1);
  await page.locator('#fu-raiz button[data-a1="toda"]').click();
  /* todo item e um botao com acao */
  expect(await page.locator('#fu-raiz .fu-it').evaluateAll(l=>l.map(x=>x.tagName+':'+x.dataset.acao))).toEqual(Array(10).fill('BUTTON:fuAbrir'));
  const abre = async (cod, titulo)=>{
    await page.locator(`#fu-raiz .fu-it[data-cod="${cod}"]`).click();
    await expect(page.locator('#folha .folha-x'), cod+': folha com X').toHaveCount(1);
    await expect(page.locator('#folhaTit'), cod).toHaveText(titulo);
    const t = await page.locator('#folha').innerText();
    await page.locator('#folha .folha-x').click();
    await expect(page.locator('#veu')).toBeHidden();
    return t;
  };
  expect(await abre('t2','Card de exemplo'), 'card que o painel conhece abre o card completo, com acoes').toContain('Concluir');
  expect(await abre('t9999','Card que o inventario nao tem'), 'card sem inventario abre a folha minima').toContain('Sinais: para decidir');
  expect(await abre('doc102','Laudo de exemplo'), 'peca da Mesa abre a folha da peca').toMatch(/enviar daqui/i);
  await abre('doc8888','Peca fora da Mesa');
  const dE = await abre('dE1','Demanda de exemplo E');
  expect(dE).toContain('demanda'); expect(dE).toContain('com o Claude');
  await abre('dL1','Demanda de exemplo L');
  await abre('dPC-2099-901','Demanda de exemplo PC');
  const p = await abre('pPC-2099-902','Proposta de exemplo');
  expect(p).toContain('proposta sem aceite'); expect(p).toContain('R$ 900');
  await abre('env7','Envio de exemplo');
  await abre('s9','Sugestao de exemplo');
  const m = await page.evaluate(()=>({larga:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
  expect(m.larga, 'sem rolagem horizontal a 360').toBe(0);
  expect(erros).toEqual([]);
});

test('p4.74 c: com dado real (snapshot sem texto) todo item da Unica tem acao e um de cada prefixo abre folha com X', async ({page})=>{
  const linhas = require('./fila_unica_real.json');
  /* o repo e publico: o snapshot tem a forma da view e nenhum texto, terceiro ou valor reais */
  expect(linhas).toHaveLength(186);
  for (const x of linhas) {
    expect(x.titulo, 'titulo trocado').toMatch(/^item \d+$/);
    expect(x.terceiro, 'sem terceiro').toBeNull(); expect(x.em_jogo_rs, 'sem valor').toBeNull();
    expect(x.frente, 'frente generica').toMatch(/^\d{2}-frente$/);
    expect(Object.keys(x).sort(), 'so campos da forma').toEqual(['codigo','dono','em_jogo_rs','etapa','frente','idade_dias','prazo','sinais','status','terceiro','titulo','vencido']);
  }
  await page.setViewportSize({width:390, height:844});
  await page.addInitScript(l=>{ window.__tab={ v_pendencia_convergencia:l, frente:[],
    v_fila_contagem:[{rotulo:'so seus (dono igor)',n:133,para_decidir:0},{rotulo:'todos os donos',n:186,para_decidir:0}] }; }, linhas);
  const erros = await abrir(page);
  await page.evaluate(()=>ir('fila'));
  await page.locator('#filaModo button[data-a1="unica"]').click();
  await expect(page.locator('#filaModo button[data-a1="unica"]')).toHaveText('Única 186 · todos');
  await expect(page.locator('#fuCont')).toHaveText('só seus 133 · todos 186');
  while (await page.locator('#fu-raiz .fu-it').count() < 186) await page.locator('#fu-raiz button[data-acao="fuMais"]').click();
  const todos = await page.locator('#fu-raiz .fu-it').evaluateAll(l=>l.map(x=>[x.tagName, x.dataset.acao, x.dataset.a1, x.dataset.cod]));
  expect(todos).toHaveLength(186);
  expect(todos.filter(x=>x[0]!=='BUTTON'||x[1]!=='fuAbrir'||!x[2]||x[2]!==x[3]), 'item sem acao').toEqual([]);
  const prefixos = {}; for (const [,, cod] of todos) { const k = cod.match(/^(dPC-|pPC-|doc|env|dE|dL|t|s)/)[1]; (prefixos[k]=prefixos[k]||[]).push(cod); }
  expect(Object.fromEntries(Object.entries(prefixos).map(([k,v])=>[k,v.length]))).toEqual({t:119, doc:35, s:17, env:8, 'pPC-':3, 'dPC-':2, dE:1, dL:1});
  for (const cods of Object.values(prefixos)) {
    const cod = cods[0];
    await page.locator(`#fu-raiz .fu-it[data-cod="${cod}"]`).click();
    await expect(page.locator('#folha .folha-x'), cod+': X na folha').toHaveCount(1);
    await expect(page.locator('#folhaTit'), cod+': titulo').not.toHaveText('');
    await page.locator('#folha .folha-x').click();
    await expect(page.locator('#veu')).toBeHidden();
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
  expect(erros).toEqual([]);
});

test('p4.74 d: o caixa por entidade le a v_caixa_entidade_resumo e mostra R$ em 30 e 90 dias, sangra ou sustenta e a data que zera, sem minigrafico', async ({page})=>{
  await page.addInitScript(()=>{ window.__tab={ v_caixa_entidade_resumo:[
    {entidade:'EMP-A',caixa_hoje:'1000.00',liquido_pior_30d:'2500.40',liquido_pior_90d:'7500.00',liquido_base_30d:'2500.40',liquido_base_90d:'7500.00',zera_pior:null,zera_base:null,aporte_pf_pior_90d:'0.00',papel_pior:'sustenta'},
    {entidade:'EMP-B',caixa_hoje:'900.00',liquido_pior_30d:'-31234.60',liquido_pior_90d:'-81000.00',liquido_base_30d:'-31234.60',liquido_base_90d:'-81000.00',zera_pior:'2026-10-22',zera_base:'2026-10-25',aporte_pf_pior_90d:'-80000.00',papel_pior:'sangra'},
    {entidade:'EMP-C',caixa_hoje:'5000.00',liquido_pior_30d:'-4000.00',liquido_pior_90d:'-12000.00',liquido_base_30d:'-1000.00',liquido_base_90d:'-3000.00',zera_pior:'2026-12-10',zera_base:null,aporte_pf_pior_90d:'0.00',papel_pior:'sangra'}]}; });
  const erros = await abrir(page);
  await page.evaluate(()=>ir('caixa'));
  const L = page.locator('#cxEnt .cxr-l');
  await expect(L, 'uma linha por entidade').toHaveCount(3);
  await expect(page.locator('#cxEnt svg'), 'sem minigrafico sem eixo').toHaveCount(0);
  expect(await L.evaluateAll(l=>l.map(x=>x.dataset.ent)), 'quem zera primeiro vem primeiro; quem sustenta por ultimo').toEqual(['EMP-B','EMP-C','EMP-A']);
  const b = L.nth(0), c = L.nth(1), a = L.nth(2);
  await expect(b).toContainText('sangra'); await expect(b).toContainText('-R$ 31.235'); await expect(b).toContainText('-R$ 81.000');
  await expect(b).toContainText('zera em 22 out'); await expect(b).toContainText('no caso base, 25 out');
  await expect(c).toContainText('zera em 10 dez');
  await expect(a).toContainText('sustenta'); await expect(a).toContainText('R$ 2.500'); await expect(a).toContainText('R$ 7.500');
  await expect(a).toContainText('não zera em 90 d');
  await expect(b.locator('.chip')).toHaveClass(/\bw\b/); await expect(a.locator('.chip')).toHaveClass(/\bok\b/);
  for (const w of [360, 1280]) {
    await page.setViewportSize({width:w, height:820});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth), `rolagem horizontal a ${w}`).toBeLessThanOrEqual(0);
  }
  expect(erros).toEqual([]);
});

test('p4.74 d: demonstracao tem o caixa por entidade em R$ e sem rede', async ({page})=>{
  const {erros, rede} = await abrirDemo(page, 390);
  await page.evaluate(()=>ir('caixa'));
  await expect(page.locator('#cxEnt .cxr-l')).toHaveCount(3);
  await expect(page.locator('#cxEnt svg')).toHaveCount(0);
  expect(await page.locator('#cxEnt .cxr-l .chip').allTextContents()).toEqual(expect.arrayContaining(['sangra']));
  expect(rede).toEqual([]);
  expect(erros).toEqual([]);
});

test('p4.74 e: a legenda do 13 semanas diz as cores que a tela pinta', async ({page})=>{
  const erros = await abrir(page);
  await page.evaluate(()=>ir('caixa'));
  const le = ()=>page.evaluate(()=>({t:document.querySelector('#semanas > span.mut').textContent, fills:[...document.querySelectorAll('#semanas rect.sem')].map(r=>r.style.fill)}));
  /* pior semana negativa (padrao do duble): o negativo vence e a barra sai vermelha; laranja nao existe */
  let r = await le();
  expect(r.fills.length).toBe(13);
  expect(r.fills.includes('var(--warn)'), 'sem barra laranja').toBe(false);
  expect(r.fills.includes('var(--bad)')).toBe(true);
  expect(r.t, 'legenda nao promete laranja que a tela nao tem').not.toMatch(/laranja/i);
  expect(r.t).toMatch(/vermelho/i);
  expect(r.t, 'e diz que a pior semana esta entre as vermelhas').toMatch(/pior semana/i);
  /* pior semana positiva: sai laranja, e so entao a legenda fala em laranja */
  await page.evaluate(()=>{ D.c13=D.c13.map((x,i)=>({...x,saldo_base:5000+i*1000})); renderCaixa(); });
  r = await le();
  expect(r.fills.filter(f=>f==='var(--warn)').length, 'uma barra laranja').toBe(1);
  expect(r.fills.includes('var(--bad)')).toBe(false);
  expect(r.t).toMatch(/laranja: a pior semana/i);
  expect(r.t, 'sem vermelho na legenda quando nao ha negativo').not.toMatch(/vermelho/i);
  expect(erros).toEqual([]);
});


/* ---------- p4.75 (P3, s8201): verbos na Fila Unica ----------
   Antes a folha de env, p, d e s era so informativa (acoes vazias). Agora cada uma tem o verbo do banco, com 8 s para desfazer.
   Cada teste reprova o main: la nao existe botao nem a RPC agir_pendencia. Dado generico, repo publico. */
const FU_V = [
  {codigo:'env7',frente:'20-frente',dono:'igor',etapa:'enviada_sem_aceite',titulo:'Envio de exemplo',prazo:null,em_jogo_rs:null,status:'enviado',vencido:null,idade_dias:3,sinais:[],terceiro:null},
  {codigo:'pPC-2099-902',frente:'20-frente',dono:'igor',etapa:'proposta_sem_aceite',titulo:'Proposta de exemplo',prazo:null,em_jogo_rs:null,status:'enviada',vencido:null,idade_dias:3,sinais:[],terceiro:null},
  {codigo:'dE1',frente:'20-frente',dono:'claude',etapa:'demanda_aberta',titulo:'Demanda de exemplo',prazo:null,em_jogo_rs:null,status:'aberta',vencido:null,idade_dias:3,sinais:[],terceiro:null},
  {codigo:'s9',frente:'20-frente',dono:'igor',etapa:'sugestao_sem_decisao',titulo:'Sugestao de exemplo',prazo:null,em_jogo_rs:null,status:'nova',vencido:null,idade_dias:0,sinais:[],terceiro:'triagem-downloads'}];
async function abrirUnicaV(page){
  await page.addInitScript(l=>{ window.__tab={ v_pendencia_convergencia:l, frente:[], v_fila_contagem:[] }; }, FU_V);
  const erros = await abrir(page);
  await page.evaluate(()=>ir('fila'));
  await page.locator('#filaModo button[data-a1="unica"]').click();
  await expect(page.locator('#fu-raiz .fu-it')).toHaveCount(4);
  await page.clock.install();
  return erros;
}
const pendRpc = page=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir_pendencia').map(c=>c.a));
const abreV = (page,cod)=>page.locator(`#fu-raiz .fu-it[data-cod="${cod}"]`).click();

test('p4.75 a: envio sem aceite na Unica tem Dar baixa; motivo curto mostra erro sem chamar o banco; valido grava depois de 8 s', async ({page})=>{
  const erros = await abrirUnicaV(page);
  await abreV(page,'env7');
  await expect(page.locator('#folha button[data-acao="fuAto"]')).toHaveText('Dar baixa');
  await page.fill('#fuTxt','curto');
  await page.click('#folha button[data-acao="fuAto"]');
  await expect(page.locator('#fuErro')).toBeVisible();
  await expect(page.locator('#fuErro')).toHaveAttribute('role','alert');
  await page.clock.fastForward(9000);
  expect(await pendRpc(page), 'motivo curto nao chama o banco').toEqual([]);
  await page.fill('#fuTxt','aceitou em 18/10 por WhatsApp');
  await page.click('#folha button[data-acao="fuAto"]');
  await expect(page.locator('#veu')).toBeHidden();
  await expect(page.locator('#tmsg')).toContainText('Dar baixa · Envio de exemplo');
  await page.clock.fastForward(7000);
  expect(await pendRpc(page), 'antes dos 8 s nada vai').toEqual([]);
  await page.clock.fastForward(1200);
  await expect.poll(()=>pendRpc(page)).toEqual([{p_codigo:'env7',p_verbo:'baixa',p_valor:'aceitou em 18/10 por WhatsApp'}]);
  expect(erros).toEqual([]);
});

test('p4.75 b: demanda tem Fechada e Nova data; Nova data envia AAAA-MM-DD|motivo e recusa data passada', async ({page})=>{
  const erros = await abrirUnicaV(page);
  await abreV(page,'dE1');
  await expect(page.locator('#folha button[data-acao="fuAto"][data-a2="fechar"]')).toHaveText('Fechada');
  await expect(page.locator('#folha button[data-acao="fuAto"][data-a2="repactuar"]')).toHaveText('Nova data');
  await page.fill('#fuDt','2020-01-01'); await page.fill('#fuMot','motivo de exemplo');
  await page.click('#folha button[data-a2="repactuar"]');
  await expect(page.locator('#fuErro')).toContainText('data');
  await page.fill('#fuDt','2099-12-31');
  await page.click('#folha button[data-a2="repactuar"]');
  await page.clock.fastForward(8200);
  await expect.poll(()=>pendRpc(page)).toEqual([{p_codigo:'dE1',p_verbo:'repactuar',p_valor:'2099-12-31|motivo de exemplo'}]);
  expect(erros).toEqual([]);
});

test('p4.75 c: proposta tem Marcar perdida e chama agir_pendencia com o verbo perdida', async ({page})=>{
  const erros = await abrirUnicaV(page);
  await abreV(page,'pPC-2099-902');
  await expect(page.locator('#folha button[data-acao="fuAto"]')).toHaveText('Marcar perdida');
  await page.fill('#fuTxt','recusou');
  await page.click('#folha button[data-acao="fuAto"]');
  await expect(page.locator('#fuErro'), 'menos de 10 caracteres').toBeVisible();
  await page.fill('#fuTxt','Cliente A recusou o preco');
  await page.click('#folha button[data-acao="fuAto"]');
  await page.clock.fastForward(8200);
  await expect.poll(()=>pendRpc(page)).toEqual([{p_codigo:'pPC-2099-902',p_verbo:'perdida',p_valor:'Cliente A recusou o preco'}]);
  expect(erros).toEqual([]);
});

test('p4.75 d: sugestao fora de D.sug: Descartar chama painel_responder SUGESTAO/descartar com o motivo; lote avisa', async ({page})=>{
  const erros = await abrirUnicaV(page);
  await abreV(page,'s9');
  await expect(page.locator('#folha')).toContainText('É um lote do Downloads: o ato vale para o lote inteiro.');
  await page.click('#folha button[data-a2="descartar"]');
  await expect(page.locator('#fuErro'), 'motivo 5+').toBeVisible();
  await page.fill('#fuTxt','duplicada');
  await page.click('#folha button[data-a2="descartar"]');
  await expect(page.locator('#tmsg')).toContainText('Descartar · Sugestao de exemplo');
  await page.clock.fastForward(8200);
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_responder').map(c=>c.a))).toEqual([{p_tipo:'SUGESTAO',p_id:9,p_ato:'descartar',p_nota:'duplicada'}]);
  expect(erros).toEqual([]);
});

test('p4.75 e: desfazer dentro dos 8 s nao chama banco nenhum', async ({page})=>{
  const erros = await abrirUnicaV(page);
  await abreV(page,'env7');
  await page.fill('#fuTxt','encerro porque saiu do escopo');
  await page.click('#folha button[data-acao="fuAto"]');
  await page.clock.fastForward(3000);
  await page.click('#tbtn');
  await expect(page.locator('#tmsg')).toHaveText('Desfeito. Nada foi gravado.');
  await page.clock.fastForward(20000);
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='agir_pendencia'||c.n==='painel_responder').length)).toBe(0);
  expect(erros).toEqual([]);
});

test('p4.75 f: RECUSADO do banco vira toast Nao gravou', async ({page})=>{
  const erros = await abrirUnicaV(page);
  await page.evaluate(()=>{ window.__pendR='RECUSADO: envio 7 ja tem baixa'; });
  await abreV(page,'env7');
  await page.fill('#fuTxt','recusou por e-mail');
  await page.click('#folha button[data-acao="fuAto"]');
  await page.clock.fastForward(8200);
  await expect(page.locator('#tmsg')).toHaveText('Não gravou: envio 7 ja tem baixa');
  await expect(page.locator('#toast')).toHaveClass(/bad/);
  expect(erros).toEqual([]);
});

/* p4.76 (P4, s8322): Saude do sistema no topo da Semana. A classe que mata: meta de SLO vermelha que so existe no banco,
   sem o Igor ver na tela. Amostra real da v_saude_painel em testes/saude_amostra.json (7 metas, "Baixas sem prova"
   vermelha com o card t4021 aberto pelo alarme). Cor nao e o unico sinal: o status vai por extenso. */
test('p4.76 saude: sete metas no topo da Semana, a vermelha com o card, o selo da aba e nenhuma rolagem a 390 px', async ({page})=>{
  const amostra = JSON.parse(require('fs').readFileSync(path.resolve(__dirname, 'saude_amostra.json'), 'utf8'));
  await page.setViewportSize({width:390, height:820});
  await page.addInitScript(a=>{ window.__dados={saude:a}; }, amostra);
  const erros = await abrir(page);
  await page.evaluate(()=>ir('semana'));
  const linhas = page.locator('#semSaude details.sd');
  await expect(linhas, 'uma linha por meta, as sete').toHaveCount(7);
  const baixa = page.locator('#semSaude details.sd[data-chave="baixa_sem_prova"]');
  await expect(baixa, 'Baixas sem prova esta vermelha (atributo)').toHaveAttribute('data-status','vermelho');
  await expect(baixa, 'Baixas sem prova esta vermelha (classe)').toHaveClass(/sd-vermelho/);
  await expect(baixa).toContainText('Baixas sem prova');
  await expect(baixa, 'o status vai por extenso, nao so em cor').toContainText('vermelho');
  await expect(baixa, 'o card aberto pelo alarme aparece').toContainText('t4021');
  await expect(baixa).toContainText('64,6%');
  await expect(baixa).toContainText('meta ≤ 20%');
  await expect(page.locator('#semSaude details.sd[data-chave="erro_caixa"]'), 'sem dado e cinza e dito por extenso').toContainText('sem dado');
  await expect(page.locator('#semSaude details.sd[data-status="vermelho"]'), 'so uma vermelha na amostra').toHaveCount(1);
  await expect(page.locator('#semSaude details.sd[data-chave="rotina_no_horario"]'), 'meta de maior-melhor diz ≥').toContainText('meta ≥ 95%');
  /* selo: a vermelha aparece sem abrir a aba (390 px = barra de baixo) */
  await expect(page.locator('#n-semana')).toContainText('1!');
  await expect(page.locator('#n-semana')).toHaveAttribute('aria-label', /1 meta de saúde vermelha/);
  /* o toque abre o como se mede */
  await expect(baixa.locator('.sd-corpo')).toBeHidden();
  await baixa.locator('summary').click();
  await expect(baixa.locator('.sd-corpo')).toContainText('sem prova documental');
  /* layout se mede: 390 e 360, com a linha aberta e com letra larga; toda linha tocavel tem 44 px ou mais */
  for (const w of [390, 360]) {
    await page.setViewportSize({width:w, height:820});
    const m = await page.evaluate(()=>{
      document.body.style.letterSpacing='1.5px';
      const s=[...document.querySelectorAll('#semSaude summary,#semSaude button')].map(e=>e.getBoundingClientRect().height);
      const r={W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth, minH:Math.min(...s)};
      document.body.style.letterSpacing=''; return r;
    });
    expect(m.SW, `rolagem horizontal a ${w} px`).toBe(m.W);
    expect(m.minH, `linha de saude tocavel a ${w} px`).toBeGreaterThanOrEqual(44);
  }
  /* a 1280 o selo mora no trilho e soma as vermelhas ao que ja mostrava */
  await page.setViewportSize({width:1280, height:820});
  await expect(page.locator('#r-semana')).toContainText('1 vermelha');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth), 'rolagem horizontal a 1280 px').toBe(1280);
  expect(erros, 'sem erro de pagina').toEqual([]);
});

/* p4.77 (P5a, s8325): tickler do GTD. Item com data futura (prazo, adiamento, retorno do terceiro) sai do Agora e volta
   sozinho na data; o selo da aba Fila e o contador da Unica contam so o Agora. Reprova o painel que soma o adiado. */
const FU_AG = [
  {codigo:'t71',frente:'11-renda-alt',dono:'igor',etapa:'card',titulo:'Card vencido de hoje',prazo:'2020-01-02',em_jogo_rs:null,status:'pendente',terceiro:null,vencido:true,idade_dias:3,sinais:[],volta_em:'2020-01-02',agenda:'agora'},
  {codigo:'t72',frente:'11-renda-alt',dono:'igor',etapa:'card',titulo:'Card adiado para depois',prazo:'2099-01-05',em_jogo_rs:null,status:'pendente',terceiro:null,vencido:false,idade_dias:3,sinais:[],volta_em:'2099-01-05',agenda:'agendado'},
  {codigo:'doc73',frente:'11-renda-alt',dono:'igor',etapa:'pronta_nao_enviada',titulo:'Peca sem data',prazo:null,em_jogo_rs:null,status:'A_AGIR',terceiro:null,vencido:null,idade_dias:2,sinais:[],volta_em:null,agenda:'agora'},
  {codigo:'doc74',frente:'11-renda-alt',dono:'igor',etapa:'pronta_nao_enviada',titulo:'Peca adiada na Mesa',prazo:'2099-02-01',em_jogo_rs:null,status:'A_AGIR',terceiro:null,vencido:false,idade_dias:2,sinais:[],volta_em:'2099-02-01',agenda:'agendado'},
  {codigo:'t75',frente:'20-contrato-pj',dono:'claude',etapa:'card',titulo:'Card esperando terceiro',prazo:'2020-01-01',em_jogo_rs:null,status:'aguardando_terceiro',terceiro:'Fulano',vencido:true,idade_dias:4,sinais:[],volta_em:'2099-03-01',agenda:'agendado'}];

test('p4.77 a: item adiado nao conta no Agora; Agendados mostra quando volta; selo da Fila e o Agora dos seus', async ({page})=>{
  await page.setViewportSize({width:390, height:844});
  await page.addInitScript(l=>{ window.__tab={ v_pendencia_convergencia:l, frente:[],
    v_fila_contagem:[{rotulo:'so seus (dono igor)',n:4,para_decidir:0,agora:2,agendados:2},{rotulo:'todos os donos',n:5,para_decidir:0,agora:2,agendados:3}] }; }, FU_AG);
  const erros = await abrir(page);
  await expect(page.locator('#n-fila'), 'selo da aba Fila conta so o Agora dos seus').toHaveText('2');
  await page.evaluate(()=>ir('fila'));
  await page.locator('#filaModo button[data-a1="unica"]').click();
  await expect(page.locator('#filaModo button[data-a1="unica"]')).toHaveText('Única 2 · todos');
  await expect(page.locator('#fu-raiz button[data-acao="fuAgenda"][data-a1="agora"]')).toHaveAttribute('aria-selected','true');
  const agora = await page.locator('#fu-raiz .fu-it').evaluateAll(l=>l.map(x=>x.dataset.cod).sort());
  expect(agora, 'adiado (prazo, Mesa ou terceiro) fora do Agora').toEqual(['doc73','t71']);
  await expect(page.locator('#fuCont')).toHaveText('só seus 2 · todos 2');
  await expect(page.locator('#fu-raiz button[data-a1="agora"]')).toContainText('2');
  await expect(page.locator('#fu-raiz button[data-a1="agendado"]')).toContainText('3');
  await page.locator('#fu-raiz button[data-a1="vencido"]').click();
  expect(await page.locator('#fu-raiz .fu-it').evaluateAll(l=>l.map(x=>x.dataset.cod)), 'vencido com retorno futuro do terceiro nao e vencido do Agora').toEqual(['t71']);
  await page.locator('#fu-raiz button[data-a1="toda"]').click();
  await page.locator('#fu-raiz button[data-acao="fuAgenda"][data-a1="agendado"]').click();
  const ag = await page.locator('#fu-raiz .fu-it').evaluateAll(l=>l.map(x=>x.dataset.cod).sort());
  expect(ag).toEqual(['doc74','t72','t75']);
  await expect(page.locator('#fuCont')).toHaveText('só seus 2 · todos 3');
  await expect(page.locator('#fu-raiz .fu-it[data-cod="t72"]')).toContainText('volta 05/01');
  await expect(page.locator('#fu-raiz .fu-it[data-cod="t75"]')).toContainText('volta 01/03');
  const m = await page.evaluate(()=>({larga:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    baixos:[...document.querySelectorAll('#fu-raiz button')].filter(b=>b.offsetParent&&b.getBoundingClientRect().height<44).length}));
  expect(m.larga, 'sem rolagem horizontal a 390').toBe(0);
  expect(m.baixos, 'alvo de toque >= 44 px').toBe(0);
  expect(erros).toEqual([]);
});

/* p4.77 (P5c, t4021, s8334): a baixa declarada ganha o print depois. O print sobe ao mesa-provas e o banco recebe o caminho
   pela envio_anexar_prova; sem a view v_envio_sem_prova (banco antigo) a secao nao aparece. */
test('p4.77 b: Mesa lista as baixas sem prova de 30 d e Anexar print sobe o arquivo e grava a prova', async ({page})=>{
  await page.setViewportSize({width:390, height:844});
  await page.addInitScript(()=>{ window.__tab={ v_envio_sem_prova:[
    {id:5,titulo:'Envio de exemplo A',destinatario:'Cliente de exemplo',canal:'whatsapp',enviado_em:'2026-10-12T10:00:00Z'},
    {id:6,titulo:'Envio de exemplo B',destinatario:null,canal:'gmail',enviado_em:'2026-10-13T10:00:00Z'}] }; });
  const erros = await abrirMesa(page);
  const lista = page.locator('#msSemProvaLista');
  await expect(lista.locator('summary')).toHaveText('Baixas sem prova, 30 d (2)');
  await lista.locator('summary').click();
  await expect(lista.locator('[data-envio="5"]')).toContainText('para Cliente de exemplo');
  const alvo = lista.locator('[data-envio="5"] .ms-anexar');
  expect((await alvo.boundingBox()).height, 'alvo de toque >= 44 px').toBeGreaterThanOrEqual(44);
  await page.setInputFiles('#msSemProvaLista input[data-a1="5"]', {name:'print.jpg', mimeType:'image/jpeg', buffer:Buffer.from('jpg')});
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='envio_anexar_prova').map(c=>c.a))).toHaveLength(1);
  const r = await page.evaluate(()=>({a:window.__rpc.filter(c=>c.n==='envio_anexar_prova')[0].a, up:window.__storage.filter(c=>c.op==='upload')}));
  expect(r.a.p_envio).toBe(5);
  expect(r.a.p_prova_path).toMatch(/^\d{4}-\d{2}\/env5_\d+\.jpg$/);
  expect(r.up).toEqual([{b:'mesa-provas',op:'upload',p:r.a.p_prova_path,tipo:'image/jpeg'}]);
  await expect(page.locator('#tmsg')).toContainText('Print anexado');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
  expect(erros).toEqual([]);
});

test('p4.77 b: sem baixas sem prova (ou banco sem a view) a Mesa nao mostra a secao', async ({page})=>{
  const erros = await abrirMesa(page);
  await expect(page.locator('#msSemProvaLista')).toHaveCount(0);
  expect(erros).toEqual([]);
});

/* p4.79 (W2.2, t4695, s11289 22/10/2026): a Matriz 9Q com dado real. A folha le a v_matriz_9q (recalibrada na W2.1, t4694),
   mostra a semana medida mais recente e a anterior, poe cada frente na celula do banco com a zona na borda e no rotulo, e a
   seta compara com a semana anterior pelo saldo resultado menos esforco. O % de FUGA e blocos_fuga sobre blocos. Sem semana
   medida, a folha diz que nao ha; nunca desenha grade vazia como se fosse medida. O origin/main (p4.78) reprova: nao ha
   #btMatriz e o presidente nunca le a v_matriz_9q. */
const M9Q = [
  {semana:'2026-10-12',frente_slug:'11-renda-alt',frente:'Renda alternativa',celula:1,rgt:'RUN',blocos:10,blocos_fuga:10,medida:'margem'},
  {semana:'2026-10-12',frente_slug:'20-contrato-pj',frente:'Contrato PJ',celula:9,rgt:'GROW',blocos:6,blocos_fuga:0,medida:'margem'},
  {semana:'2026-10-05',frente_slug:'11-renda-alt',frente:'Renda alternativa',celula:5,rgt:'RUN',blocos:4,blocos_fuga:0,medida:'margem'},
  {semana:'2026-10-05',frente_slug:'20-contrato-pj',frente:'Contrato PJ',celula:4,rgt:'GROW',blocos:8,blocos_fuga:8,medida:'margem'}];
test('p4.79 W2.2: Matriz 9Q real na aba Frentes, semana recente e anterior, celula e seta do banco', async ({page})=>{
  await page.setViewportSize({width:390, height:800});
  await page.addInitScript(m=>{ window.__tab={v_matriz_9q:m}; }, M9Q);
  const erros = await abrir(page);
  await page.evaluate(()=>ir('frentes'));
  await page.click('#btMatriz');
  const g = page.locator('#m9q'), lista = page.locator('#m9lista');
  await expect(g.locator('.cel')).toHaveCount(9);
  await expect(page.locator('#folha [role="tab"]')).toHaveText(['semana de 12/10','semana de 05/10']);
  await expect(page.locator('#folha [role="tab"][aria-selected="true"]')).toHaveText('semana de 12/10');
  const c1 = g.locator('.cel[data-celula="1"]'), c9 = g.locator('.cel[data-celula="9"]');
  await expect(c1).toHaveClass(/fuga/); await expect(c1).toContainText('FUGA'); await expect(c1.locator('.n')).toHaveText('1');
  await expect(c9).toHaveClass(/alvo/); await expect(c9).toContainText('ALVO'); await expect(c9.locator('.n')).toHaveText('1');
  await expect(lista.locator('.m9g[data-celula="1"] .m9l')).toHaveText(/▼\s*Renda.*antes na 5/i);
  await expect(lista.locator('.m9g[data-celula="9"] .m9l')).toHaveText(/▲\s*Contrato PJ.*antes na 4/);
  await expect(page.locator('#folha')).toContainText('63% dos blocos em FUGA');
  const alt = await page.locator('#folha .m9l, #m9q .cel').evaluateAll(bs=>bs.map(b=>b.getBoundingClientRect().height));
  expect(Math.min(...alt), 'celula e frente da matriz sao tocaveis: 44 px').toBeGreaterThanOrEqual(44);
  /* toque na celula filtra a lista; de novo, volta a todas */
  await c9.click();
  await expect(page.locator('#m9q .cel[data-celula="9"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#m9lista .m9l')).toHaveCount(1);
  await page.locator('#m9q .cel[data-celula="9"]').click();
  await expect(page.locator('#m9lista .m9l')).toHaveCount(2);
  /* a semana anterior: cada frente na celula daquela semana, sem seta (nao ha semana antes dela aqui) */
  await page.locator('#folha [role="tab"]', {hasText:'05/10'}).click();
  await expect(page.locator('#m9lista .m9g[data-celula="5"] .m9l')).toHaveText(/^Renda alternativa$/i);
  await expect(page.locator('#m9lista .m9g[data-celula="4"] .m9l')).toHaveText(/^Contrato PJ$/);
  await expect(page.locator('#folha')).toContainText('67% dos blocos em FUGA');
  /* a frente abre a ficha dela, nunca e beco */
  await page.locator('#m9lista .m9l', {hasText:'Contrato PJ'}).click();
  await expect(page.locator('#folhaTit')).not.toHaveText('Matriz 9Q');
  expect(erros).toEqual([]);
});
/* p4.80 (s11292, prints do Igor 22/10 01:32): com 9 frentes numa celula a grade deformava (a linha 3 virava uma coluna de nomes)
   e no PC a folha abria num canto de 480 px. Agora a grade so conta e as 9 celulas tem o mesmo tamanho com qualquer carga; no
   PC a folha abre larga e centrada, grade e lista lado a lado. A p4.79 reprova: celulas de alturas diferentes e folha de 480 px. */
const M9Q_CHEIA = Array.from({length:9},(_,i)=>({semana:'2026-10-12',frente_slug:'1'+i+'-frente-de-nome-comprido',frente:'Frente de nome bem comprido numero '+i,celula:7,rgt:'RUN',blocos:3,blocos_fuga:0,medida:'margem'}))
  .concat([{semana:'2026-10-12',frente_slug:'11-renda-alt',frente:'Renda',celula:1,rgt:'RUN',blocos:10,blocos_fuga:10,medida:'margem'}]);
for (const [w,h] of [[390,800],[1280,800]]) test(`p4.80 W2.2: Matriz 9Q nao deforma com 9 frentes numa celula e no PC abre larga (${w} px)`, async ({page})=>{
  await page.setViewportSize({width:w, height:h});
  await page.addInitScript(m=>{ window.__tab={v_matriz_9q:m}; }, M9Q_CHEIA);
  const erros = await abrir(page);
  await page.evaluate(()=>ir('frentes'));
  await page.click('#btMatriz');
  await expect(page.locator('#m9q .cel[data-celula="7"] .n')).toHaveText('9');
  const cel = await page.locator('#m9q .cel').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)];}));
  expect(new Set(cel.map(c=>c[1])).size, 'as 9 celulas com a mesma altura').toBe(1);
  expect(Math.max(...cel.map(c=>c[0]))-Math.min(...cel.map(c=>c[0])), 'as 9 celulas com a mesma largura').toBeLessThanOrEqual(1);
  await expect(page.locator('#m9lista .m9g[data-celula="7"] .m9l')).toHaveCount(9);
  const f = await page.locator('#folha').evaluate(e=>{const r=e.getBoundingClientRect();return {l:r.left,r:innerWidth-r.right,w:r.width};});
  if (w>=900) { expect(f.w, 'no PC a folha da matriz e larga').toBeGreaterThanOrEqual(900); expect(Math.abs(f.l-f.r), 'e centrada').toBeLessThanOrEqual(2); }
  const lado = await page.evaluate(()=>document.getElementById('folha').scrollWidth<=document.getElementById('folha').clientWidth);
  expect(lado, 'sem rolagem horizontal na folha').toBe(true);
  expect(erros).toEqual([]);
});
test('p4.79 W2.2: sem semana medida a Matriz 9Q diz que nao ha, sem grade', async ({page})=>{
  await page.addInitScript(()=>{ window.__tab={v_matriz_9q:[]}; });
  const erros = await abrir(page);
  await page.evaluate(()=>ir('frentes'));
  await page.click('#btMatriz');
  await expect(page.locator('#folha')).toContainText('não tem semana medida');
  await expect(page.locator('#m9q')).toHaveCount(0);
  expect(erros).toEqual([]);
});

/* p4.81 (t5105): Orcamento x gasto das rotinas na Semana. A classe que mata: rotina que estoura o teto de execucoes/WAL so
   existe no banco, sem o Igor ver na tela, e gate desarmado lido como regra em vigor. Amostra FICTICIA em
   testes/orcamento_amostra.json (repo publico: nenhum job real). Estado por extenso, nao so em cor. */
test('p4.81 orcamento: total contra 300, contagem por estado, tabela por rotina, gate de 15% desarmado, sem rolagem', async ({page})=>{
  const amostra = JSON.parse(require('fs').readFileSync(path.resolve(__dirname, 'orcamento_amostra.json'), 'utf8'));
  await page.setViewportSize({width:390, height:820});
  await page.addInitScript(a=>{ window.__dados=a; }, amostra);
  const erros = await abrir(page);
  await page.evaluate(()=>ir('semana'));
  await expect(page.locator('#semOrc')).toBeVisible();
  await expect(page.locator('#ocTotal'), 'orcado 168, gasto 212, teto 300').toContainText('Orçado 168');
  await expect(page.locator('#ocTotal')).toContainText('gasto 212');
  await expect(page.locator('#ocTotal')).toContainText('300');
  await expect(page.locator('#ocEstados')).toContainText('1 estourado');
  await expect(page.locator('#ocEstados')).toContainText('1 fora do SLO');
  await expect(page.locator('#ocEstados')).toContainText('1 sem orçamento');
  await page.locator('#ocJobs summary').click();
  await expect(page.locator('#ocJobs li.oc-lin'), 'uma linha por job').toHaveCount(5);
  const b = page.locator('#ocJobs li[data-job="rotina-ficticia-b"]');
  await expect(b).toHaveAttribute('data-estado','estourado');
  await expect(b, 'estado por extenso').toContainText('estourado');
  await expect(b).toContainText('execuções/dia 140 de 96');
  await expect(b).toContainText('WAL 878,9 KB');
  await expect(b).toContainText('SLO 95%, cumprimento 97%');
  await expect(page.locator('#ocJobs li[data-job="rotina-ficticia-d"]'), 'null vira traco, nunca NaN').not.toContainText('NaN');
  await expect(page.locator('#ocJobs li').first(), 'o estourado vem primeiro').toHaveAttribute('data-job','rotina-ficticia-b');
  await page.locator('#ocGov summary').click();
  const gate = page.locator('#ocGov li[data-tipo="fatia_00memoria_7d_pct"]');
  await expect(gate).toHaveAttribute('data-armado','nao');
  await expect(gate, 'gate armado=false e dito por extenso').toContainText('gate desarmado');
  await expect(gate).toContainText('9 de 15');
  await expect(page.locator('#ocGov li[data-tipo="rotina"]')).toContainText('8 de 10');
  for (const w of [390, 360]) {
    await page.setViewportSize({width:w, height:820});
    const m = await page.evaluate(()=>{ document.body.style.letterSpacing='1.5px';
      const r={W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth}; document.body.style.letterSpacing=''; return r; });
    expect(m.SW, `rolagem horizontal a ${w} px`).toBe(m.W);
  }
  await page.setViewportSize({width:1280, height:820});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth), 'rolagem horizontal a 1280 px').toBe(1280);
  expect(erros, 'sem erro de JS').toEqual([]);
});

test('p4.81 orcamento: sem as chaves o bloco fica oculto', async ({page})=>{
  const erros = await abrir(page);
  await page.evaluate(()=>ir('semana'));
  await expect(page.locator('#semOrc')).toBeHidden();
  expect(erros).toEqual([]);
});

/* p4.82 (t3634, s15864, 25/10/2026): frescor por bloco (Statuspage). Todo [data-bloco] tem data-fonte com chave que o
   painel pede ao banco (ou "vivo", leitura direta); fonte com 30 h faz o bloco dizer "atrasado há 30 h" em texto, e o
   carimbo sobrevive ao render; rotina pausada diz "pausado", nunca "dormindo". No main de antes (p4.81) nao havia
   data-bloco nem carimbo: os tres testes reprovam. */
test('t3634: todo bloco tem data-fonte com chave conhecida', async ({page})=>{
  const erros = await abrir(page);
  const r = await page.evaluate(()=>{ const bl=[...document.querySelectorAll('[data-bloco]')], ok=new Set(CHAVES.concat(['vivo']));
    return {n:bl.length, semFonte:bl.filter(e=>!(e.dataset.fonte||'').trim()).map(e=>e.dataset.bloco),
      desconhecida:bl.flatMap(e=>(e.dataset.fonte||'').split(' ').filter(k=>k&&!ok.has(k)).map(k=>e.dataset.bloco+':'+k)),
      paneSem:[...document.querySelectorAll('.pane')].filter(p=>!p.querySelector('[data-bloco]')).map(p=>p.id),
      dup:bl.map(e=>e.dataset.bloco).filter((b,i,a)=>a.indexOf(b)!==i)}; });
  expect(r.n, 'blocos com data-bloco').toBeGreaterThan(20);
  expect(r.semFonte, 'bloco sem data-fonte').toEqual([]);
  expect(r.desconhecida, 'fonte que o painel nao pede').toEqual([]);
  expect(r.paneSem, 'aba sem bloco').toEqual([]);
  expect(r.dup, 'data-bloco repetido').toEqual([]);
  expect(erros).toEqual([]);
});
test('t3634: fonte com carimbo de 30 h faz o bloco dizer atrasado', async ({page})=>{
  await abrir(page);
  await page.evaluate(()=>{ D.fresc=[{...((D.fresc||[])[0]||{}), fontes:{c13:['atrasado',30],c13i:['vivo',0.2],rw:['vivo',0.2]}}]; IDADE=0; render(); ir('caixa'); });
  await expect(page.locator('#cb-semanas')).toHaveText('atrasado há 30 h');
  await expect(page.locator('[data-bloco="semanas"]')).toHaveAttribute('data-frescor', 'atrasado');
  await expect(page.locator('#cb-caixa'), 'o topo do caixa le c13 tambem').toHaveText('atrasado há 30 h');
  await expect(page.locator('#cb-funil'), 'bloco de outra fonte fica calado').toHaveCount(0);
  await page.evaluate(()=>render());
  await expect(page.locator('#cb-semanas'), 'o carimbo sobrevive ao render').toHaveText('atrasado há 30 h');
  await page.evaluate(()=>{ D.fresc[0].fontes.c13=['vivo',0.1]; render(); });
  await expect(page.locator('#cb-semanas'), 'fonte de volta ao ponto apaga o carimbo').toHaveCount(0);
});
test('t3634: rotina pausada diz pausado no bloco e na saude, nunca dormindo', async ({page})=>{
  await abrir(page);
  await page.evaluate(()=>{ D.fresc=[{...((D.fresc||[])[0]||{}), fontes:{orc:['pausado',50,'rotina x pausada (ativo=false) desde 20/10 08:00']}}]; render(); abrirFontes(); });
  await expect(page.locator('#folha')).toContainText('pausado: rotina x pausada');
  await expect(page.locator('#folha')).not.toContainText('dormindo');
  await expect(page.locator('#saude')).toContainText('fonte fora do ponto');
  expect(await page.locator('#cb-orcamento').textContent()).toContain('pausado');
});

/* p4.82 (t3635, s15864, 25/10/2026): quatro estados por bloco (Grafana: sem dado != zero; Things: vazio util). O teste
   passa por todo [data-bloco]: lendo (esqueleto, sem texto), erro (motivo e "Tentar de novo", visivel mesmo com o bloco
   escondido), velho (dados de HH:MM, snapshot velho ou sem conexao) e vazio (nenhum bloco visivel em branco). No main
   de antes (p4.81) nao havia data-bloco nem estado: reprova. */
test('t3635: todo data-bloco nos quatro estados', async ({page})=>{
  const erros = await abrir(page);
  const r1 = await page.evaluate(()=>{
    const bl=[...document.querySelectorAll('[data-bloco]')].map(e=>e.dataset.bloco), s=b=>document.getElementById('cb-'+b), out={n:bl.length};
    const em=CARGA_EM; CARGA_EM=0; carimbar();
    out.lendo=bl.filter(b=>!(s(b)&&s(b).dataset.estado==='lendo'&&s(b).querySelector('.sk[aria-busy="true"]')&&!s(b).textContent.trim()));
    CARGA_EM=em; ERRO_CHAVE=Object.fromEntries(CHAVES.concat('vivo').map(k=>[k,'teste de falha'])); carimbar();
    out.erro=bl.filter(b=>{const x=s(b); return !(x&&x.dataset.estado==='erro'&&!x.hidden&&/teste de falha/.test(x.textContent)&&x.querySelector('button[data-acao="recarregar"]'));});
    ERRO_CHAVE={}; carimbar();
    out.limpo=bl.filter(b=>s(b));
    return out; });
  expect(r1.n).toBeGreaterThan(20);
  expect(r1.lendo, 'sem esqueleto ao ler').toEqual([]);
  expect(r1.erro, 'falha calada').toEqual([]);
  expect(r1.limpo, 'estado que nao apaga').toEqual([]);
  await page.context().setOffline(true);
  const r2 = await page.evaluate(()=>{ const bl=[...document.querySelectorAll('[data-bloco]')].map(e=>e.dataset.bloco); carimbar();
    return bl.filter(b=>{const x=document.getElementById('cb-'+b); return !(x&&x.dataset.estado==='velho'&&/^dados de \d\d:\d\d, sem conexão/.test(x.textContent));}); });
  expect(r2, 'sem conexao nao diz a hora do dado').toEqual([]);
  await page.context().setOffline(false);
  const r3 = await page.evaluate(()=>{ IDADE=IDADE_MAX+600; carimbar();
    const v=[...document.querySelectorAll('[data-bloco]')].filter(e=>e.dataset.fonte.split(' ').some(k=>k!=='vivo'));
    const r=v.filter(e=>!/^dados de \d\d:\d\d: podem estar velhos/.test((document.getElementById('cb-'+e.dataset.bloco)||{}).textContent||'')).map(e=>e.dataset.bloco);
    IDADE=0; carimbar(); return r; });
  expect(r3, 'snapshot velho sem a hora do dado').toEqual([]);
  const r4 = await page.evaluate(()=>{ CHAVES.forEach(k=>{D[k]=[];}); render();
    return [...document.querySelectorAll('[data-bloco]')].filter(e=>!e.closest('[hidden],.hidden')&&!e.textContent.trim()&&!e.querySelector('.sk')).map(e=>e.dataset.bloco); });
  expect(r4, 'bloco visivel em branco com a fonte vazia').toEqual([]);
  expect(erros).toEqual([]);
});
test('t3635: zero "carregando" solto no fonte do presidente', ()=>{
  const fs=require('fs'); const src=fs.readFileSync(path.resolve(__dirname,'..','presidente.html'),'utf8');
  expect(src.match(/[Cc]arregando/g)||[], 'texto de espera vira esqueleto (.sk)').toEqual([]);
});

/* t3637 (onda F, regua 36 do canone): o ato gravado ecoa "gravado HH:MM" e o historico do card traz o autor */
test('eco de escrita: "gravado HH:MM" na hora de Cuiaba, e historico do card com autor e hora', async ({page})=>{
  const erros = await abrir(page);
  const e = await page.evaluate(()=>({eco:eco('Gravado'), cuiaba:ecoHM(),
    ref:new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Cuiaba',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())}));
  expect(e.eco).toMatch(/^Gravado · gravado \d{2}:\d{2}$/);
  expect(e.cuiaba).toBe(e.ref);
  await page.evaluate(()=>{ window.__chist=[{campo:'status',valor:'concluida',autor:'sessao:16193@00-memoria',em:'2026-10-25T15:05:00Z'}]; abrirFila(0); });
  await expect(page.locator('#hist')).toContainText('sessão 16193');
  await expect(page.locator('#hist')).toContainText('status: concluida');
  expect(erros).toEqual([]);
});
