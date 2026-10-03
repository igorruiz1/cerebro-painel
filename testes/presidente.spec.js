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
        recebe o audio e devolve texto para revisar, sem nada dela no fonte.
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
  const dados={fila,cont:[{depois:2}],rw:[{dias_sobrevida_pior:16,entrada_provavel_30d:1000,saida_firme_30d:500}],
    se:[{chave:'fila.aging_p95_dias',serie:[30]}],cap:[{minutos_dia:120}],min:[{id:2,minutos_estimados:25}],fresc:[],
    c13:sem,c13i:[{natureza:'receber',vencido:true,valor_igor:1400,descricao:'Laudo L1',data_venc:hoje,frente_slug:'11-renda-alt'}]};
  const inv=[{id:2,frente:'11-renda-alt',dono:'igor',status:'pendente',prazo:hoje,parado_dias:1,titulo:'Card de exemplo',criterio_pronto:'Fiscal confirma por e-mail',acoes:[{verbo:'feita',rotulo:'feita',arg:null}]},
    {id:3,frente:'20-conenge',dono:'igor',status:'aguardando_terceiro',prazo:hoje,parado_dias:0,titulo:'Item esperando',acoes:[{verbo:'repactuar',rotulo:'repactuar',arg:'data'}]},
    {id:4,frente:'04-obra-wanderlei',dono:'igor',status:'pendente',prazo:null,parado_dias:40,titulo:'Item para decidir',acoes:[{verbo:'repactuar',rotulo:'repactuar',arg:'data'},{verbo:'arquivar',rotulo:'arquivar',arg:'texto'}]},
    {id:6,frente:'20-conenge',dono:'igor',status:'pendente',prazo:'2999-01-01',parado_dias:0,titulo:'Item depois',acoes:[]},
    {id:7,frente:'20-conenge',dono:'claude',status:'pendente',prazo:hoje,parado_dias:0,titulo:'Item do executor',acoes:[]}];
  const arv=[{nivel:0,no:'CAIXA'},{nivel:1,no:'11-renda-alt',rotulo:'Renda Alternativa',margem_30d:2000,margem_total:2000},
    {nivel:1,no:'20-conenge',rotulo:'Conenge',margem_30d:1000,margem_total:3000}];
  window.__rpc=[];
  const q=r=>{const p=Promise.resolve({data:r,error:null});p.lte=()=>p;p.eq=()=>p;p.order=()=>p;p.limit=()=>p;return p;};
  window.supabase={createClient:()=>({
    from:v=>({select:()=>q(v==='v_inventario_frente'?inv:v==='v_arvore_caixa'?arv:[])}),
    rpc:(n,a)=>{window.__rpc.push({n,a});return Promise.resolve({data:n==='painel_carga'?{dados,idade_s:10,gerado_em:new Date().toISOString()}:n==='agir'?'OK: feito':null,error:null});},
    auth:{getSession:()=>Promise.resolve({data:{session:{user:{id:'x'}}}}),
          onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
          signInWithOtp:()=>Promise.resolve({error:null})}})};
})();`;

async function abrir(page){
  const erros=[];
  page.on('pageerror',e=>erros.push(String(e)));
  await page.route('**cdn.jsdelivr.net**', r=>r.fulfill({status:200,contentType:'application/javascript',body:DUBLE}));
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
  await expect(page.locator('#vozMotor'), 'a tela de voz diz a versao em uso').toContainText('painel p3.2');
});
