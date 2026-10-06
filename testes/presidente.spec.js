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
  /* window.__pendura: nomes de RPC ou view que nunca respondem. window.__dados: chaves que trocam as do duble. */
  const pendura=n=>(window.__pendura||[]).includes(n);
  const q=(r,v)=>{const p=pendura(v)?new Promise(()=>{}):Promise.resolve({data:r,error:null});p.lte=()=>p;p.eq=()=>p;p.order=()=>p;p.limit=()=>p;return p;};
  window.supabase={createClient:()=>({
    from:v=>({select:()=>q(v==='v_inventario_frente'?inv:v==='v_arvore_caixa'?arv:(window.__tab&&window.__tab[v])||[],v)}),
    rpc:(n,a)=>{window.__rpc.push({n,a});if(pendura(n))return new Promise(()=>{});
      return Promise.resolve({data:n==='painel_carga'?{dados:{...dados,...(window.__dados||{})},idade_s:10,gerado_em:new Date().toISOString()}:n==='agir'?'OK: feito':n==='inbox'?'ANOTADO. Entra na proxima rodada.':n==='atendente_estado'?(window.__atd||null):n==='mesa_painel'?(window.__mesa||mesa):n==='mesa_baixa_painel'?(window.__baixa||'OK: baixa gravada (envio 7)'):n==='mesa_deliberar'?(window.__deliberar||'OK: aprovado'):n==='mesa_ciencia'?(window.__ciencia||'OK: ciencia do dia gravada'):null,error:null});},
    channel:()=>{const ch={on:(t,f,cb)=>{(window.__rt=window.__rt||[]).push({f,cb});return ch;},subscribe:cb=>{cb&&cb('SUBSCRIBED');return ch;}};return ch;},
    /* p4.4: storage dublado; window.__storage guarda cada chamada, window.__storageErro faz o link falhar */
    storage:{from:b=>({
      createSignedUrl:(p,s)=>{window.__storage.push({b,op:'createSignedUrl',p,s});
        return Promise.resolve(window.__storageErro?{data:null,error:{message:'objeto nao encontrado'}}:{data:{signedUrl:'about:blank'},error:null});},
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
  expect(r.n,'cinco destinos planos').toBe(5);
});

for (const largura of [360, 390, 1280]) {
  test(`a ${largura}px: nenhum controle abaixo de 44 px e nenhuma rolagem horizontal`, async ({page})=>{
    await page.setViewportSize({width:largura, height:820});
    const erros = await abrir(page);
    for (const aba of ['hoje','fila','caixa','frentes','mesa']) {
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
    await page.evaluate(()=>{msAbrir(0);msEscolherCanal('email_corporativo');});
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
      expect(dc.dec, `quatro decisoes e o botao do campo (${dec})`).toBe(5);
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
  expect(botoes).toContain('concluí');
  expect(botoes).toContain('mudar data');
  expect(botoes).toContain('quero uma recomendação');
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

test('desfazer dentro dos 6 s nao grava nada', async ({page})=>{
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
  await page.evaluate(async()=>{ window.fetch=async()=>({ok:true,text:async()=>'<script>const VERP="'+VERP+'";</script>'}); await checarVersao(); });
  await expect(page.locator('#novaVersao'), 'mesma versao').toBeHidden();
  await page.evaluate(async()=>{ window.fetch=async()=>({ok:true,text:async()=>'<script>const VERP="p9";</script>'}); await checarVersao(); });
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
  expect(await page.locator('#atd').evaluate(e=>e.getBoundingClientRect().height), 'linha do atendente cabe numa linha a 390 px').toBeLessThan(20);
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

test('fio curto: 3 trocas em 7 dias no card desligam o "Quero uma recomendação"', async ({page})=>{
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
test('o codigo comum das duas telas (regra de Hoje, teto de tempo, texto recolhido e porta do segundo fator) e o mesmo byte a byte', async ()=>{
  const a = blocosComuns('index.html'), b = blocosComuns('presidente.html');
  expect(Object.keys(a).sort(), 'blocos no index.html').toEqual(['fator','hoje','recolhe','teto']);
  expect(Object.keys(b).sort(), 'blocos no presidente.html').toEqual(['fator','hoje','recolhe','teto']);
  for (const k of Object.keys(a)) expect(b[k], `bloco comum:${k} divergiu`).toBe(a[k]);
});

/* O caso medido em 02/10/2026 (v68): a demanda de peso maior vence em 3 dias, tres tarefas vencem hoje e a
   fatura EKOS, vencida ha 7 dias, ficou no segundo plano e so chega pela chave exp. */
const CASO_HOJE = ()=>{
  const dia=n=>{const d=new Date(); d.setDate(d.getDate()+n); return ivData(d);};
  const it=(origem,ref,pos,peso,dr,camada)=>({origem,ref:String(ref),posicao:pos,peso,data_ref:dr,camada_tela:camada||'hoje',teto_tela:5,
    nivel:3,frente:'20-contrato-pj',acoes:[{label:'feita',verbo:'feita'}],titulo:'item '+ref,titulo_completo:'item '+ref});
  return {fila:[it('demanda','alex-audios',1,75,dia(3)),it('fluxo','32',2,72,null),it('tarefa','1545',3,70,dia(0)),
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
  await expect(page.locator('#hist')).toContainText('carregando');
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
  await expect(page.locator('#desc')).toContainText('carregando');
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
  expect(r.toast).toContain('t2');
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
  await expect(page.locator('#tmsg')).toContainText('t5');
  expect(erros).toEqual([]);
});

test('teclado na folha: A ato principal, S nova data, R responder, e nada disso dentro de campo de texto', async ({page})=>{
  const erros = await abrir(page);
  await page.keyboard.press('s');
  await expect(page.locator('#veu'), 'sem folha, S nao faz nada').toBeHidden();
  await page.evaluate(()=>abrirFila(0));
  await page.keyboard.press('Control+s');
  await expect(page.locator('#campo')).toBeEmpty();
  await page.keyboard.press('s');
  await expect(page.locator('#campo .datas button')).toHaveCount(4);
  await page.keyboard.press('r');
  await expect(page.locator('#campo label')).toHaveText('Quero uma recomendação');
  await expect(page.locator('#cv')).toBeFocused();
  await page.keyboard.type('sra');
  await expect(page.locator('#cv'), 'letra digitada no campo e texto, nao atalho').toHaveValue('sra');
  await expect(page.locator('#campo label')).toHaveText('Quero uma recomendação');
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
test('tokens: o mesmo nome tem o mesmo valor no index, no presidente e na seguranca', async ()=>{
  const fs=require('fs');
  const raiz=f=>{const s=fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');const b=s.slice(s.indexOf(':root{')+6);const corpo=b.slice(0,b.search(/\n\}/));
    const o={};for(const m of corpo.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g))o[m[1]]=m[2].trim();return o;};
  const [a,b,c]=['index.html','presidente.html','seguranca.html'].map(raiz);
  expect(Object.keys(a).length, 'leu o :root do index').toBeGreaterThan(15);
  expect(Object.keys(b).length, 'leu o :root do presidente').toBeGreaterThan(15);
  const dif=[];for(const [x,y,n] of [[a,b,'index x presidente'],[b,c,'presidente x seguranca'],[a,c,'index x seguranca']])
    for(const k of Object.keys(x)) if(k in y && x[k]!==y[k]) dif.push(n+': '+k+' '+x[k]+' != '+y[k]);
  expect(dif).toEqual([]);
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

test('Mesa: a aba mostra as 3 pecas, o dia, a regua da hora e os 2 relatorios, sem codigo cru do banco', async ({page})=>{
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
  expect(txt).toContain('Neste mês: 42,5 h');
  expect(txt).toContain('piso R$ 63,03');
  expect(txt).toContain('teto R$ 480,00');
  for (const s of ['Aprovação para Fiscal de exemplo','Envio para Cliente de exemplo','Assinatura','sem valor','parada há 9 d','parada desde hoje','Saiu hoje','com comprovante','Fechamento do dia','versão 02','sem ciência'])
    expect(txt, 'mostra '+s).toContain(s);
  for (const cru of CRUS_MESA) expect(txt, 'codigo cru na aba: '+cru).not.toContain(cru);
  /* a folha da peca tambem fala lingua de gente */
  await page.click('#ms-raiz .ms-item >> nth=0');
  await expect(page.locator('#folhaTit')).toHaveText('Medicao 7 de exemplo');
  await expect(page.locator('#msDest'), 'para quem vem preenchido').toHaveValue('Fiscal de exemplo');
  const folha = (await page.locator('#folha').innerText()).replace(/\u00a0/g,' ');
  expect(folha).toContain('Falta a sua aprovacao para protocolar.');
  expect(folha).toContain('Previsto por WhatsApp');
  for (const cru of CRUS_MESA) expect(folha, 'codigo cru na folha: '+cru).not.toContain(cru);
  /* fonte mais larga (Linux da CI): o desenho encolhe o texto, nao a pagina */
  const w = await page.evaluate(()=>{ document.body.style.letterSpacing='1.5px'; const a={W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};
    fecharFolha(); return [a,{W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth}]; });
  for (const m of w) expect(m.SW, 'rolagem horizontal com letra larga').toBe(m.W);
  expect(erros).toEqual([]);
});

test('Mesa: "Dar baixa" sem canal nao chama o banco e diz o que falta', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.click('#ms-raiz .ms-item >> nth=0');
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
  await page.click('#msBt');
  await expect.poll(baixas).toEqual([{p_doc:102,p_canal:'gmail',p_dest:'Cliente de exemplo',p_prova_path:null}]);
  await expect(page.locator('#veu'), 'baixa gravada fecha a folha').toBeHidden();
  await expect(page.locator('#tmsg')).toContainText('Baixa gravada: saiu por E-mail para Cliente de exemplo');
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_painel').length), 'a aba recarrega').toBeGreaterThan(cargas0);
  /* com print: sobe para mesa-provas em AAAA-MM/<peca>_<hora>.<ext> e o banco recebe o mesmo caminho */
  await page.click('#ms-raiz .ms-item >> nth=0');
  await page.click('#folha [data-canal="whatsapp"]');
  await page.setInputFiles('#msArq', {name:'print.PNG', mimeType:'image/png', buffer:Buffer.from('png')});
  await page.click('#msBt');
  await expect.poll(async()=>(await baixas()).length).toBe(2);
  const b = (await baixas())[1], up = await page.evaluate(()=>window.__storage.filter(c=>c.op==='upload'));
  expect(b).toMatchObject({p_doc:101,p_canal:'whatsapp',p_dest:'Fiscal de exemplo'});
  expect(b.p_prova_path).toMatch(/^\d{4}-\d{2}\/101_\d+\.png$/);
  expect(up).toEqual([{b:'mesa-provas',op:'upload',p:b.p_prova_path,tipo:'image/png'}]);
  /* recusa do banco vira aviso com o texto, e a folha fica para corrigir */
  await page.evaluate(()=>{ window.__baixa='RECUSADO: doc 103 nao esta esperando voce'; });
  await page.click('#ms-raiz .ms-item >> nth=2');
  await expect(page.locator('#msDest')).toHaveValue('');
  await page.click('#folha [data-canal="em_maos"]');
  await page.click('#msBt');
  await expect(page.locator('#msAviso'), 'sem destinatario nao grava').toContainText('para quem');
  await page.fill('#msDest','Cartorio de exemplo');
  await page.click('#msBt');
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
  await expect(page.locator('#folha')).toContainText('A cópia desta peça ainda não subiu; sai na próxima hora com o PC ligado.');
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

test('Mesa: "Aprovar" chama mesa_deliberar com a peca certa, fecha a folha e recarrega; recusa fica na folha', async ({page})=>{
  const erros = await abrirMesa(page);
  const cargas0 = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_painel').length);
  await page.click('#ms-raiz .ms-item >> nth=0');
  await expect(page.locator('#folha .ms-decide')).toContainText('Aprovar tira da sua mesa o que é leitura ou decisão; o que é envio continua aqui até a baixa.');
  await page.click('#msBtAprovar');
  await expect.poll(()=>deliberacoes(page)).toEqual([{p_doc:101,p_decisao:'aprovado',p_nota:null}]);
  await expect(page.locator('#veu'), 'OK fecha a folha').toBeHidden();
  await expect(page.locator('#toast')).not.toHaveClass(/bad/);
  await expect(page.locator('#tmsg')).toHaveText('Aprovação gravada.');
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_painel').length), 'a aba recarrega').toBeGreaterThan(cargas0);
  /* RECUSADO: toast de erro com o texto do banco, folha aberta e botoes de volta */
  await page.evaluate(()=>{ window.__deliberar='RECUSADO: doc 102 ja saiu da mesa'; });
  await page.click('#ms-raiz .ms-item >> nth=1');
  await page.click('#msBtAprovar');
  await expect(page.locator('#toast')).toHaveClass(/bad/);
  await expect(page.locator('#tmsg')).toContainText('Não gravou: doc 102 ja saiu da mesa');
  await expect(page.locator('#msAvisoDec')).toContainText('Não gravou: doc 102 ja saiu da mesa');
  await expect(page.locator('#veu')).toBeVisible();
  await expect(page.locator('#msBtAprovar')).toBeEnabled();
  await expect(page.locator('#msBtAprovar')).toHaveText('Aprovar');
  expect((await deliberacoes(page)).map(a=>a.p_doc)).toEqual([101,102]);
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
  await expect.poll(()=>deliberacoes(page)).toEqual([{p_doc:102,p_decisao:'ajustar',p_nota:'Trocar a data da capa para 06/10'}]);
  await expect(page.locator('#veu')).toBeHidden();
  await expect(page.locator('#tmsg')).toHaveText('Pedido de ajuste gravado.');
  expect(erros).toEqual([]);
});

test('Mesa: "Largar" sem motivo nao chama o banco; com motivo vai com a nota', async ({page})=>{
  const erros = await abrirMesa(page);
  await page.click('#ms-raiz .ms-item >> nth=2');
  await page.click('#msAbreLargar');
  await expect(page.locator('#msTxtLargar')).toBeVisible();
  await expect(page.locator('#msTxtAjustar'), 'um campo por vez').toBeHidden();
  await page.click('#msBtLargar');
  await expect(page.locator('#msAvisoDec')).toContainText('Diga o motivo de tirar a peça da mesa');
  await page.waitForTimeout(150);
  expect(await deliberacoes(page), 'sem motivo nao grava').toEqual([]);
  await page.fill('#msTxtLargar','Cliente desistiu do contrato');
  await page.click('#msBtLargar');
  await expect.poll(()=>deliberacoes(page)).toEqual([{p_doc:103,p_decisao:'largar',p_nota:'Cliente desistiu do contrato'}]);
  await expect(page.locator('#tmsg')).toHaveText('Peça tirada da sua mesa.');
  expect(erros).toEqual([]);
});

test('Mesa: nenhum codigo da decisao aparece cru na folha nem no aviso', async ({page})=>{
  const erros = await abrirMesa(page);
  /* "O que ajustar" e "Por que largar" sao os rotulos pedidos, em portugues de gente; fora deles, nada */
  const CRUS_DEC = ['aprovado','ajustar','largar','mesa_deliberar','p_decisao','p_nota','RECUSADO','OK:'];
  const textos = [];
  const colhe = async()=>textos.push((await page.locator('#folha').innerText())+'\n'+(await page.locator('#tmsg').innerText()));
  await page.click('#ms-raiz .ms-item >> nth=0');
  await colhe();
  await page.click('#msAbreAjustar'); await page.click('#msBtAjustar'); await colhe();
  await page.click('#msAbreLargar'); await page.click('#msBtLargar'); await colhe();
  await page.evaluate(()=>{ window.__deliberar='RECUSADO: fora do prazo'; });
  await page.click('#msBtAprovar'); await expect(page.locator('#toast')).toHaveClass(/bad/); await colhe();
  await page.evaluate(()=>{ window.__deliberar='OK: aprovado'; });
  await page.click('#msBtAprovar'); await expect(page.locator('#veu')).toBeHidden(); await colhe();
  for (const t of textos) {
    const limpo = t.replace(/ /g,' ').split('O que ajustar').join('').split('Por que largar').join('');
    for (const cru of [...CRUS_DEC, ...CRUS_MESA]) expect(limpo, 'codigo cru: '+cru).not.toContain(cru);
  }
  const rot = await page.evaluate(()=>{ msAbrir(0); return [...document.querySelectorAll('#folha .ms-decide button, #folha .ms-decide label, #msPeca')].map(e=>e.textContent.trim()); });
  expect(rot).toEqual(['Abrir a peça','Aprovar','Pedir ajuste','Adiar','Largar','O que ajustar','Enviar pedido','Volta para a mesa em','Adiar','Por que largar','Confirmar']);
  expect(erros).toEqual([]);
});

test('Mesa: leitura que falha se declara na aba, sem tela em branco', async ({page})=>{
  await page.addInitScript(()=>{ window.__pendura=['mesa_painel']; });
  const erros = await abrir(page);
  await page.clock.install();
  const lim = await page.evaluate(()=>LIMITE_RECARGA);
  /* a carga da partida ja pendurou com o relogio de verdade: solta ela e abre a aba sob o relogio falso */
  await page.evaluate(()=>{ MS.carga=null; ir('mesa'); });
  await expect(page.locator('#ms-raiz')).toContainText('carregando');
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

test('s859: a hora da Mesa diz a janela de 30 dias e nao alarma dentro da regua', async ({page})=>{
  await abrirMesa(page);
  const txt = (await page.evaluate(()=>{
    MS.dados.valor_hora={janela:'30 dias',recebido:15196.31,horas:77.6,por_hora:195.72,piso:63.03,teto:480};
    msRender(); return document.getElementById('p-mesa').innerText;
  })).replace(/\u00a0/g,' ');
  expect(txt).toContain('Sua hora nos últimos 30 dias: R$ 195,72, dentro da régua');
  expect(txt).not.toContain('abaixo do piso');
});

/* ---------- p4.12 (06/10/2026, s03): Mesa como ritual de fim de dia e modo demonstracao ----------
   O Igor abria o "fechamento do dia" direto no PDF, sem onde dar ciencia nem decidir, e via v01, v02 e v03 do
   mesmo dia misturadas com a vigente. Os testes cobram a classe: relatorio repetido nunca aparece duas vezes,
   o toque nunca abre PDF sem passar pela folha, o ritual so grava o que foi decidido e termina na ciencia,
   e a demonstracao nao cria cliente do banco nem carrega nome real no fonte (o repositorio e publico). */
test('Mesa p4.13: o link do aviso (?ritual=1) abre a Mesa ja no "Encerrar o dia" e tira o parametro da barra', async ({page})=>{
  const erros=[]; page.on('pageerror',e=>erros.push(String(e)));
  await page.addInitScript(DUBLE);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA+'?ritual=1');
  await expect(page.locator('#folha .ms-ritual')).toHaveText(/1 de 3/i);
  await expect(page.locator('#tituloAba')).toHaveText('Mesa');
  expect(page.url(), 'o parametro sai da barra').not.toContain('ritual');
  expect(await page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_deliberar').length), 'abrir o ritual nao grava').toBe(0);
  /* sem o parametro, nada de ritual */
  await page.goto(PAGINA);
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit'));
  await page.waitForTimeout(300);
  await expect(page.locator('#veu')).toBeHidden();
  expect(erros).toEqual([]);
});

const ciencias = page=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='mesa_ciencia').map(c=>c.a));

test('Mesa p4.12: relatorio repetido aparece uma vez, na versao vigente; a anterior so dentro da folha; a ciencia do dia vai ao banco', async ({page})=>{
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
  await page.click('#msBtCiencia');
  await expect.poll(()=>ciencias(page)).toEqual([{p_dia:hoje,p_nota:null}]);
  await expect(page.locator('#veu')).toBeHidden();
  await expect(page.locator('#tmsg')).toContainText('Ciência gravada');
  expect(erros).toEqual([]);
});

test('Mesa p4.12: "Encerrar o dia" passa peca por peca (nova primeiro), Pular nao grava, e termina na ciencia do dia', async ({page})=>{
  const erros = await abrirMesa(page);
  await expect(page.locator('#msBtEncerrar')).toHaveText('Encerrar o dia (3)');
  await page.click('#msBtEncerrar');
  await expect(page.locator('#folha .ms-ritual')).toHaveText(/1 de 3/i);
  await expect(page.locator('#folhaTit'), 'a nova vem primeiro').toHaveText('Laudo de exemplo');
  await page.click('#msBtAprovar');
  await expect(page.locator('#folha .ms-ritual')).toHaveText(/2 de 3/i);
  await expect(page.locator('#folhaTit'), 'depois a de maior valor').toHaveText('Medicao 7 de exemplo');
  expect(await deliberacoes(page)).toEqual([{p_doc:102,p_decisao:'aprovado',p_nota:null}]);
  await page.click('#folha .ms-ritual-pe >> text=Pular');
  await expect(page.locator('#folha .ms-ritual')).toHaveText(/3 de 3/i);
  await page.click('#folha .ms-ritual-pe >> text=Pular');
  expect((await deliberacoes(page)).length, 'pular nao grava').toBe(1);
  await expect(page.locator('#folhaTit')).toHaveText('Encerrar o dia');
  await expect(page.locator('#folha')).toContainText('Você decidiu 1 peça e pulou 2.');
  await expect(page.locator('#folha')).toContainText('2 peças ficam na mesa para amanhã.');
  await page.click('#msBtCiencia');
  await expect.poll(()=>ciencias(page)).toEqual([{p_dia:null,p_nota:null}]);
  await expect(page.locator('#veu')).toBeHidden();
  await expect(page.locator('#tmsg')).toContainText('Dia encerrado');
  /* recusa do banco fica no resumo, com o texto dele, e o botao volta */
  await page.evaluate(()=>{ window.__ciencia='RECUSADO: nao da para dar ciencia de dia que nao chegou'; MS.ritual={ids:[],snap:{},i:0,feitas:0,puladas:0}; msResumo(); });
  await page.click('#msBtCiencia');
  await expect(page.locator('#msAvisoCi')).toContainText('Não gravou: nao da para dar ciencia');
  await expect(page.locator('#msBtCiencia')).toBeEnabled();
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
  await expect.poll(()=>deliberacoes(page)).toEqual([{p_doc:101,p_decisao:'adiar',p_nota:amanha}]);
  await expect(page.locator('#tmsg')).toContainText('Adiada até 07/10.');
  await page.evaluate(()=>{ const m=JSON.parse(JSON.stringify(MS.dados)); m.estoque[0].adiado_ate=somaDias(2); window.__mesa=m; msCarregar(); });
  await expect(page.locator('#n-mesa'), 'a adiada sai do selo').toHaveText('2');
  await expect(page.locator('#msBtEncerrar')).toHaveText('Encerrar o dia (2)');
  await expect(page.locator('#ms-raiz details.ms-adiadas summary')).toHaveText('Adiadas (1)');
  await page.click('#ms-raiz details.ms-adiadas summary');
  await expect(page.locator('#ms-raiz details.ms-adiadas .ms-item')).toContainText('volta em');
  expect(erros).toEqual([]);
});

/* a demonstracao entra pelo mesmo arquivo; o duble do supabase continua no lugar, para provar que ninguem o chama */
async function abrirDemo(page, largura){
  const erros=[], rede=[];
  page.on('pageerror',e=>erros.push(String(e)));
  page.on('request',r=>{ const u=r.url(); if(!/^(file|data|blob|about):/.test(u)&&!/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u))rede.push(u); });
  if(largura)await page.setViewportSize({width:largura, height:820});
  await page.addInitScript(DUBLE);
  await page.addInitScript(()=>{ try{sessionStorage.setItem('cerebro.demo','1');}catch(e){}
    const c=window.supabase.createClient; window.supabase.createClient=(...a)=>{ window.__criou=(window.__criou||0)+1; return c(...a); }; });
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA);
  await page.waitForFunction(()=>!!document.querySelector('#foco .tit') && !!document.querySelector('#kanban .item'));
  return {erros, rede};
}

test('Demonstracao: nenhum cliente do banco nasce, nada sai para a rede, a marca e neutra e tudo se clica', async ({page})=>{
  const {erros, rede} = await abrirDemo(page, 360);
  await expect(page.locator('#demoAviso')).toBeVisible();
  await abaFalsa(page);
  for (const aba of ['hoje','fila','caixa','frentes','mesa']) {
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
  /* ritual com dado ficticio: decide, adia, para; o estado muda so na memoria da pagina */
  const antes = await page.locator('#n-mesa').innerText();
  await page.click('#msBtEncerrar');
  await page.click('#msBtAprovar');
  await page.click('#msAbreAdiar'); await page.click('#msBtAdiar');
  await expect(page.locator('#folha .ms-ritual')).toHaveText(/3 de/i);
  await page.click('#folha .ms-ritual-pe >> text=Parar');
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
  /* A lista de nomes proibidos (pessoas, empresas, bancos, cidade e id do projeto) vai em SHA-256: escrita em claro,
     ela mesma vazaria os nomes neste repositorio publico. Cada palavra do bloco, e cada par e trio de palavras
     seguidas, sem acento e em minuscula, e comparada com a lista. Nome novo: gerar o hash do mesmo jeito. */
  const crypto = require('crypto');
  const PROIBIDOS = new Set(['6ab84705e5d695ef','f1fca769f672a482','eb8b7bef229ddb38','4cb8b3c18423fdf7','57ddbe120c2a5254','4c006c647316bd2e','b748ad66d73dd832',
    '1fa4c9eed0c8dab6','ff30d1531a8d9f49','fe7870a244a2000b','3a476a05128038e1','a39fdca4bf85865d','b599675130c2a485','e606e9794651b68d','b4fba2288e6a880a',
    'd86dc6e60b0632e3','91d1699885940621','064d1e677b995c1f','b684e5a7d5767cce','6035dd9902419a84','b8d8a9b672985b1d','b90f4994c4675589','44c2fc7b06e5b214',
    '948ed6a2a21964d6','80efd4dd27606356','4d9639d39ff3c9aa','c2c64c35e75eda0f','5fbc1daee9d1fa06','4135aa9dc1b842a6','ff06535ac1029cca','8dd28c9b66f34782',
    'ec0aa35a6ea6b190','7ded2c90172ea13a','7fac0d0407d16331','a0d66abfb6c54bfb']);
  const h = t=>crypto.createHash('sha256').update(t).digest('hex').slice(0,16);
  /* dono:"igor" e valor_igor sao contrato da tela (colunaDe, aCobrar), nao dado: saem antes da varredura */
  const pal = bloco.replace(/dono:"igor"|valor_igor/g,' ').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const achados = [];
  for (let k=0; k<pal.length; k++) for (let n=1; n<=3 && k+n<=pal.length; n++) { const t=pal.slice(k,k+n).join(' '); if(PROIBIDOS.has(h(t))) achados.push(t); }
  expect(achados, 'nome real no bloco de demonstracao').toEqual([]);
  /* o detector detecta: um nome proibido conhecido, posto num texto, tem de ser achado */
  expect(PROIBIDOS.has(h('kssvzrnjiqfgtvoifboj')), 'a lista de hashes confere com o id do projeto').toBe(true);
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
    const p=(id,rs,o)=>Object.assign({id,frente:'20-contrato-pj',titulo:'Peca '+id,ato:'enviar',dest:'Alguem',canal:'gmail',rs,dias:3,motivo:'x',copia:null,novo:false,peca:null},o||{});
    m.estoque=[p(201,900),p(202,800),p(203,700),p(204,600),p(205,99999,{adiado_ate:'2999-01-01'}),p(206,null)];
    window.__mesa=m; msCarregar(); });
  await expect.poll(()=>pecasNaHoje(page), 'top 3 por valor; adiada e sem valor fora').toEqual(['Peca 201','Peca 202','Peca 203']);
  const mins = await page.evaluate(()=>document.getElementById('situacao').textContent);
  expect(mins).toContain('3 peças da Mesa');
  await page.click('#ordem .peca-hoje >> nth=0');
  await expect(page.locator('#folhaTit'), 'a peca de Hoje abre a folha da Mesa').toHaveText('Peca 201');
  await expect(page.locator('#msBtAprovar')).toBeVisible();
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
    m.estoque=m.estoque.map(p=>p.id===101?Object.assign(p,{tarefa:2,fecha_tarefa:true}):p); window.__mesa=m; msCarregar(); });
  await expect.poll(()=>pecasNaHoje(page), 'a peca ligada ao card de Hoje nao repete').toEqual(['Laudo de exemplo']);
  await expect(page.locator('#foco')).toContainText('com peça da Mesa');
  await page.evaluate(()=>abrirFila(0));
  await expect(page.locator('#folha')).toContainText('Peça da Mesa ligada a este card');
  await expect(page.locator('#folha')).toContainText('conclui este card');
  await page.click('#folha .ms-ligada');
  await expect(page.locator('#folhaTit')).toHaveText('Medicao 7 de exemplo');
  const montar0 = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_snapshot_montar').length);
  await page.evaluate(()=>{ window.__baixa='OK: baixa gravada (envio 7); card 2 concluido junto'; });
  await page.click('#folha [data-canal="whatsapp"]');
  await page.click('#msBt');
  await expect(page.locator('#tmsg')).toContainText('O card ligado foi concluído junto.');
  await expect.poll(()=>page.evaluate(()=>window.__rpc.filter(c=>c.n==='painel_snapshot_montar').length), 'a fila recarrega do banco').toBeGreaterThan(montar0);
  /* o mesmo trabalho nunca duas vezes: nenhuma peca de Hoje aponta para card que esta em Hoje */
  const dup = await page.evaluate(()=>{ const cards=new Set(hojeLista().filter(f=>f.origem==='tarefa').map(f=>String(f.ref)));
    return pecasHoje().filter(p=>p.tarefa!=null&&cards.has(String(p.tarefa))).map(p=>p.id); });
  expect(dup).toEqual([]);
  expect(erros).toEqual([]);
});

/* p4.16 (06/10/2026, pedido do Igor): a prova do card tambem vai como print ou PDF, anexado ou colado (Ctrl+V).
   O arquivo so sobe quando o ato vai ao banco (depois dos 6 s de desfazer), para o bucket privado mesa-provas,
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
  expect(up, 'dentro dos 6 s nada sobe').toEqual([]);
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
  const ids = ()=>page.evaluate(()=>[...document.querySelectorAll('#ms-raiz .pilha .ms-item')].map(b=>+(b.getAttribute('onclick').match(/\d+/)||[0])[0]));
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
