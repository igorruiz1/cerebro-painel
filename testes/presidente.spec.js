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
     5. frente e linha do caixa abrem algo, nunca sao beco.
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
    {id:4,frente:'04-obra-Cliente',dono:'igor',status:'pendente',prazo:null,parado_dias:40,titulo:'Item para decidir',acoes:[{verbo:'repactuar',rotulo:'repactuar',arg:'data'},{verbo:'arquivar',rotulo:'arquivar',arg:'texto'}]},
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
