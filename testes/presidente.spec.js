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
        Realtime sem recarregar, e o fio do card para em 3 trocas em 7 dias.
   O cliente e dublado como no fumaca.spec.js: o defeito que se persegue vive na TELA. */
const {test, expect} = require('@playwright/test');
const path = require('path');
const PAGINA = 'file://' + path.resolve(__dirname, '..', 'presidente.html');

/* Duble com sessao valida e dado minimo: dois cards na fila de hoje, quatro no inventario
   (um por coluna), duas frentes na arvore, 13 semanas e um recebivel vencido. Nada aqui e real.
   window.__rpc guarda toda chamada ao banco para o teste conferir o que foi (ou nao) gravado. */
const DUBLE = `(()=>{
  const hoje=new Date().toISOString().slice(0,10);
  const ac=[{label:'feita',verbo:'feita'},{label:'nova data',verbo:'repactuar',campo:'date'},{label:'deliberar',verbo:'deliberar',campo:'text'}];
  const fila=[{origem:'tarefa',ref:'2',camada_tela:'hoje',posicao:1,teto_tela:5,frente:'11-renda-alt',
    titulo:'Card de exemplo',titulo_completo:'Card de exemplo',porque_agora:'vence em 1d',verbo_sugerido:'feita',
    recomendacao:'Recomendacao de exemplo, longa o bastante para ser cortada no foco e inteira no detalhe do card, com texto suficiente para passar de cento e oitenta caracteres sem esforco algum, so repetindo.',
    artefato_path:'/pasta/peca_v01.pdf',acoes:ac},
    {origem:'tarefa',ref:'5',camada_tela:'hoje',posicao:2,teto_tela:5,frente:'20-conenge',titulo:'Segundo card',porque_agora:'vence em 2d',valor_txt:'R$ 3 mil',acoes:ac}];
  const sem=Array.from({length:13},(_,i)=>({semana:i+1,inicio:hoje,saldo_base:(i-4)*1000,saldo_pior:(i-6)*1000,sai_firme:500}));
  const dados={fila,exp:[],cont:[{depois:2}],rw:[{dias_sobrevida_pior:16,entrada_provavel_30d:1000,saida_firme_30d:500}],
    se:[{chave:'fila.aging_p95_dias',serie:[30]}],cap:[{minutos_dia:120}],min:[{id:2,minutos_estimados:25}],
    c13:sem,c13i:[{id:31,natureza:'receber',vencido:true,valor_igor:1400,descricao:'Laudo L1',data_venc:hoje,frente_slug:'11-renda-alt'}],
    /* p4.3: saude em dia por padrao; cada teste de saude troca o que precisa por window.__dados */
    fresc:[{estado:'FRESCO',no_ponto:2,rotinas_total:2}],
    mo:[{nome:'backup-cerebro',estado:'no ponto',janela_horas:26,ultimo_ponto:new Date(Date.now()-3*36e5).toISOString()},{nome:'painel-snapshot',estado:'no ponto'}],
    eb:[{nome:'backup-cerebro',falhas_7d:0,orcamento_falhas_7d:1,veredito_budget:'DENTRO DO ORCAMENTO'}]};
  const inv=[{id:2,frente:'11-renda-alt',dono:'igor',status:'pendente',prazo:hoje,parado_dias:1,titulo:'Card de exemplo',criterio_pronto:'Fiscal confirma por e-mail',acoes:[{verbo:'feita',rotulo:'feita',arg:null}]},
    {id:3,frente:'20-conenge',dono:'igor',status:'aguardando_terceiro',prazo:hoje,parado_dias:0,titulo:'Item esperando',acoes:[{verbo:'repactuar',rotulo:'repactuar',arg:'data'}]},
    {id:4,frente:'04-obra-Cliente',dono:'igor',status:'pendente',prazo:null,parado_dias:40,titulo:'Item para decidir',acoes:[{verbo:'repactuar',rotulo:'repactuar',arg:'data'},{verbo:'arquivar',rotulo:'arquivar',arg:'texto'}]},
    {id:6,frente:'20-conenge',dono:'igor',status:'pendente',prazo:'2999-01-01',parado_dias:0,titulo:'Item depois',acoes:[]},
    {id:7,frente:'20-conenge',dono:'claude',status:'pendente',prazo:hoje,parado_dias:0,titulo:'Item do executor',acoes:[]}];
  const arv=[{nivel:0,no:'CAIXA'},{nivel:1,no:'11-renda-alt',rotulo:'Renda Alternativa',margem_30d:2000,margem_total:2000},
    {nivel:1,no:'20-conenge',rotulo:'Conenge',margem_30d:1000,margem_total:3000}];
  window.__rpc=[];
  /* window.__pendura: nomes de RPC ou view que nunca respondem. window.__dados: chaves que trocam as do duble. */
  const pendura=n=>(window.__pendura||[]).includes(n);
  const q=(r,v)=>{const p=pendura(v)?new Promise(()=>{}):Promise.resolve({data:r,error:null});p.lte=()=>p;p.eq=()=>p;p.order=()=>p;p.limit=()=>p;return p;};
  window.supabase={createClient:()=>({
    from:v=>({select:()=>q(v==='v_inventario_frente'?inv:v==='v_arvore_caixa'?arv:(window.__tab&&window.__tab[v])||[],v)}),
    rpc:(n,a)=>{window.__rpc.push({n,a});if(pendura(n))return new Promise(()=>{});
      return Promise.resolve({data:n==='painel_carga'?{dados:{...dados,...(window.__dados||{})},idade_s:10,gerado_em:new Date().toISOString()}:n==='agir'?'OK: feito':n==='inbox'?'ANOTADO. Entra na proxima rodada.':n==='atendente_estado'?(window.__atd||null):null,error:null});},
    channel:()=>{const ch={on:(t,f,cb)=>{(window.__rt=window.__rt||[]).push({f,cb});return ch;},subscribe:cb=>{cb&&cb('SUBSCRIBED');return ch;}};return ch;},
    auth:{getSession:()=>Promise.resolve({data:{session:{user:{id:'x'}}}}),
          onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
          signInWithOtp:()=>Promise.resolve({error:null})}})};
})();`;

/* v71 · R7: o supabase-js tem integrity (SRI); corpo dublado no lugar do arquivo seria recusado pelo
   navegador. O duble entra antes da pagina (addInitScript) e a CDN e abortada, como no fumaca.spec.js. */
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
  expect(r.n,'quatro destinos planos').toBe(4);
});

for (const largura of [360, 390, 1280]) {
  test(`a ${largura}px: nenhum controle abaixo de 44 px e nenhuma rolagem horizontal`, async ({page})=>{
    await page.setViewportSize({width:largura, height:820});
    const erros = await abrir(page);
    for (const aba of ['hoje','fila','caixa','frentes']) {
      await page.evaluate(a=>ir(a), aba);
      const m = await page.evaluate(()=>{
        const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';};
        const pequenos=[...document.querySelectorAll('button,input,textarea')].filter(vis)
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
  await page.fill('#vozTxt','reagendar a vistoria da Conenge para quinta');
  await page.click('#folha .pri');
  await page.click('#tbtn');
  await expect(page.locator('#vozTxt'), 'desfazer devolve o texto para corrigir').toHaveValue('reagendar a vistoria da Conenge para quinta');
  inbox = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='inbox'));
  expect(inbox, 'desfazer nao grava').toEqual([]);
  await page.click('#folha .pri');
  await page.evaluate(()=>enviar());
  inbox = await page.evaluate(()=>window.__rpc.filter(c=>c.n==='inbox').map(c=>c.a));
  expect(inbox).toEqual([{p_texto:'[voz] reagendar a vistoria da Conenge para quinta'}]);
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
test('o codigo comum das duas telas (regra de Hoje, teto de tempo e texto recolhido) e o mesmo byte a byte', async ()=>{
  const a = blocosComuns('index.html'), b = blocosComuns('presidente.html');
  expect(Object.keys(a).sort(), 'blocos no index.html').toEqual(['hoje','recolhe','teto']);
  expect(Object.keys(b).sort(), 'blocos no presidente.html').toEqual(['hoje','recolhe','teto']);
  for (const k of Object.keys(a)) expect(b[k], `bloco comum:${k} divergiu`).toBe(a[k]);
});

/* O caso medido em 02/10/2026 (v68): a demanda de peso maior vence em 3 dias, tres tarefas vencem hoje e a
   fatura EKOS, vencida ha 7 dias, ficou no segundo plano e so chega pela chave exp. */
const CASO_HOJE = ()=>{
  const dia=n=>{const d=new Date(); d.setDate(d.getDate()+n); return ivData(d);};
  const it=(origem,ref,pos,peso,dr,camada)=>({origem,ref:String(ref),posicao:pos,peso,data_ref:dr,camada_tela:camada||'hoje',teto_tela:5,
    nivel:3,frente:'20-conenge',acoes:[{label:'feita',verbo:'feita'}],titulo:'item '+ref,titulo_completo:'item '+ref});
  return {fila:[it('demanda','Cliente-audios',1,75,dia(3)),it('fluxo','32',2,72,null),it('tarefa','1545',3,70,dia(0)),
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
   titulo ("Cliente Fase A, parcela 1/5 (entrada). R$ 3.890,40, vence 05/10/2026, boleto emitido. - Contrato v14
   assinado ..."). O banco ja corrigiu a causa, mas a tela se defende sozinha: na lista o titulo para em 2 linhas,
   e o contexto inteiro mora na folha, recolhido em 3 linhas com "ver mais". */
const FRASE = 'Cliente Fase A, parcela 1/5 (entrada). R$ 3.890,40, vence 05/10/2026, boleto emitido. - Contrato v14 assinado pelas duas partes no DocuSign, com a ressalva do item 7 sobre o reajuste. ';
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
    D.fila[0].dias_parado=9;
    D.fila[1].atualizado_em=new Date(Date.now()-5*36e5).toISOString();
    D.fila.push({origem:'demanda',ref:'dx',camada_tela:'hoje',posicao:3,teto_tela:5,frente:'20-conenge',titulo:'Sem medida',acoes:[]});
    D.fila.push({origem:'tarefa',ref:'2b',camada_tela:'hoje',posicao:4,teto_tela:5,frente:'20-conenge',titulo:'Hoje mesmo',dias_parado:0,acoes:[]});
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
    const fx=(ref,dr)=>({origem:'fluxo',ref,camada_tela:'hoje',teto_tela:5,frente:'20-conenge',titulo:'Receber fluxo '+ref,data_ref:dr,dias_parado:2,acoes:[{label:'caiu',verbo:'confirmado'}]});
    window.__dados={fila:[fx('251',d(-2)),fx('252',d(0)),fx('253',d(-2))],
      c13i:[{id:251,natureza:'receber',vencido:true,valor_igor:1400,descricao:'NF 001 Conenge',data_venc:d(-2),frente_slug:'20-conenge'},
            {id:252,natureza:'receber',vencido:false,valor_igor:900,descricao:'NF 002',data_venc:d(0),frente_slug:'20-conenge'},
            {id:253,natureza:'pagar',vencido:true,valor_igor:500,descricao:'Boleto',data_venc:d(-2),frente_slug:'20-conenge'}]};
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
  expect(r.inbox[0]).toContain('NF 001 Conenge');
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
