/* SEGURANCA DA CONTA · s1 (05/10/2026)
   A pagina seguranca.html ativa o segundo fator (TOTP) com o supabase-js v2 Auth MFA. A suite cobra,
   sem credencial e sem Supabase:
     a. sem fator, "Ativar" chama enroll e mostra o QR e o codigo para digitar a mao;
     b. "Confirmar" com menos de 6 digitos nao chama verify (nem challenge);
     c. com 6 digitos chama challenge e verify com o factorId do enroll; codigo errado nao apaga o fator;
     d. com fator verificado, nao mostra "Ativar" e diz "ativo";
     e. nenhum controle tocavel abaixo de 44 px e nenhuma rolagem horizontal a 360, 390 e 1280 px;
     f. fator nao verificado (ativacao abandonada) oferece "Recomeçar", que tira so ele;
     g. mesma tag do supabase-js e mesma CSP do presidente.html, e o segredo nunca vai ao console;
     h. o presidente.html leva a pagina nova pelo rodape.
     102. CSP sem 'unsafe-inline' (hash do script), nenhum on*= e toda acao pelo registro, Enter e filtro inclusive.
   O cliente e dublado como no presidente.spec.js: a CDN e abortada e o duble entra antes da pagina. */
const {test, expect} = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const PAGINA = 'file://' + path.resolve(__dirname, '..', 'seguranca.html');
const ler = f => fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');

/* Duble: sessao valida. window.__fatores define os fatores que listFactors devolve (padrao: nenhum).
   window.__mfa guarda toda chamada do MFA. window.__codigoBom e o unico codigo que verify aceita. */
const SEGREDO = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
const DUBLE = `(()=>{
  window.__mfa=[];
  const qr='data:image/svg+xml;utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#000"/></svg>');
  const nivel=()=>{const v=(window.__fatores||[]).some(f=>f.status==='verified');
    return {currentLevel:window.__aal||'aal1',nextLevel:v?'aal2':'aal1',currentAuthenticationMethods:[]};};
  const ok=d=>Promise.resolve({data:d,error:null});
  const mfa={
    listFactors:()=>{window.__mfa.push({op:'listFactors'});const all=(window.__fatores||[]).slice();
      return ok({all,totp:all.filter(f=>f.status==='verified'),phone:[]});},
    getAuthenticatorAssuranceLevel:()=>{window.__mfa.push({op:'aal'});return ok(nivel());},
    enroll:a=>{window.__mfa.push({op:'enroll',a});
      const f={id:'fator-novo-1',friendly_name:a.friendlyName,factor_type:'totp',status:'unverified',created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
      window.__fatores=(window.__fatores||[]).concat([f]);
      return ok({id:f.id,type:'totp',friendly_name:a.friendlyName,totp:{qr_code:qr,secret:'${SEGREDO}',uri:'otpauth://totp/x'}});},
    challenge:a=>{window.__mfa.push({op:'challenge',a});return ok({id:'desafio-1',type:'totp',expires_at:0});},
    verify:a=>{window.__mfa.push({op:'verify',a});
      if(a.code!==(window.__codigoBom||'123456'))return Promise.resolve({data:null,error:{message:'Invalid TOTP code entered',code:'mfa_verification_failed'}});
      (window.__fatores||[]).forEach(f=>{if(f.id===a.factorId)f.status='verified';}); window.__aal='aal2';
      return ok({access_token:'x',user:{id:'x'}});},
    unenroll:a=>{window.__mfa.push({op:'unenroll',a});window.__fatores=(window.__fatores||[]).filter(f=>f.id!==a.factorId);return ok({id:a.factorId});}
  };
  window.supabase={createClient:()=>({auth:{
    getSession:()=>Promise.resolve({data:{session:{user:{id:'x',email:'teste@exemplo.com'}}}}),
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
    signInWithOtp:()=>Promise.resolve({error:null}),
    mfa}})};
})();`;

async function abrir(page, fatores){
  const erros=[], consola=[];
  page.on('pageerror',e=>erros.push(String(e)));
  page.on('console',m=>consola.push(m.text()));
  await page.addInitScript(DUBLE);
  if (fatores) await page.addInitScript(f=>{window.__fatores=f;}, fatores);
  await page.route('**cdn.jsdelivr.net**', r=>r.abort());
  await page.goto(PAGINA);
  await page.waitForFunction(()=>document.getElementById('estado').textContent!=='carregando…');
  return {erros, consola};
}
const ops = page => page.evaluate(()=>window.__mfa.map(c=>c.op));
const VERIFICADO = [{id:'fator-velho',friendly_name:'celular',factor_type:'totp',status:'verified',created_at:'2026-10-01T12:00:00Z',updated_at:'2026-10-03T12:00:00Z'}];

test('a. sem fator, Ativar chama enroll e mostra o QR e o codigo manual', async ({page})=>{
  const {erros} = await abrir(page);
  await expect(page.locator('#btAtivar')).toBeVisible();
  await expect(page.locator('#qrBox')).toBeHidden();
  await page.click('#btAtivar');
  await expect(page.locator('#qrBox')).toBeVisible();
  const enroll = await page.evaluate(()=>window.__mfa.filter(c=>c.op==='enroll').map(c=>c.a));
  expect(enroll).toEqual([{factorType:'totp',friendlyName:'celular'}]);
  expect(await page.locator('#qr').getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
  await expect(page.locator('#qr')).toBeVisible();
  await expect(page.locator('#segredo')).toHaveText(SEGREDO);
  await expect(page.locator('#qrBox')).toContainText('Google Authenticator');
  await expect(page.locator('#qrBox')).toContainText('Microsoft Authenticator');
  await expect(page.locator('#btCopiar')).toBeVisible();
  const campo = await page.locator('#cod6').evaluate(e=>({im:e.inputMode, ac:e.autocomplete}));
  expect(campo).toEqual({im:'numeric', ac:'one-time-code'});
  await expect(page.locator('#btAtivar')).toBeHidden();
  expect(erros).toEqual([]);
});

test('b. Confirmar com menos de 6 digitos nao chama verify', async ({page})=>{
  await abrir(page);
  await page.click('#btAtivar');
  await page.fill('#cod6','12345');
  await page.click('#btConfirmar');
  await page.waitForTimeout(150);
  const o = await ops(page);
  expect(o).not.toContain('verify');
  expect(o).not.toContain('challenge');
  await expect(page.locator('#qmsg')).toContainText('6 números');
  /* letra nao conta como digito */
  await page.fill('#cod6','12a45b');
  await page.click('#btConfirmar');
  await page.waitForTimeout(150);
  expect(await ops(page)).not.toContain('verify');
});

test('c. com 6 digitos chama challenge e verify com o factorId do enroll; codigo errado nao apaga o fator', async ({page})=>{
  const {erros, consola} = await abrir(page);
  await page.click('#btAtivar');
  await page.fill('#cod6','999999');
  await page.click('#btConfirmar');
  await expect(page.locator('#qmsg')).toContainText('não confere');
  expect(await ops(page)).not.toContain('unenroll');
  await expect(page.locator('#qrBox'), 'o QR continua na tela para tentar de novo').toBeVisible();
  await page.fill('#cod6','123456');
  await page.click('#btConfirmar');
  await expect(page.locator('#prontoBox')).toContainText('Pronto. Segundo fator ativo. Daqui em diante o painel pede o código do app ao entrar.');
  const c = await page.evaluate(()=>window.__mfa.filter(x=>x.op==='challenge'||x.op==='verify').map(x=>({op:x.op,...x.a})));
  expect(c).toEqual([
    {op:'challenge',factorId:'fator-novo-1'},{op:'verify',factorId:'fator-novo-1',challengeId:'desafio-1',code:'999999'},
    {op:'challenge',factorId:'fator-novo-1'},{op:'verify',factorId:'fator-novo-1',challengeId:'desafio-1',code:'123456'}]);
  /* o segredo sai da tela quando o codigo confere, e nunca passou pelo console */
  await expect(page.locator('#qrBox')).toBeHidden();
  expect(await page.locator('#segredo').textContent()).toBe('');
  await expect(page.locator('#estado')).toContainText('ativo');
  await expect(page.locator('#nivel')).toContainText('código do app');
  expect(consola.join('\n')).not.toContain(SEGREDO);
  expect(erros).toEqual([]);
});

test('d. com fator verificado, nao mostra Ativar e mostra ativo', async ({page})=>{
  const {erros} = await abrir(page, VERIFICADO);
  await expect(page.locator('#estado')).toContainText('ativo');
  await expect(page.locator('#estado')).toContainText('desde 03/10');
  await expect(page.locator('#btAtivar')).toBeHidden();
  await expect(page.locator('#btRecomecar')).toBeHidden();
  expect(await ops(page)).not.toContain('enroll');
  /* sessao de nivel 1 com fator verificado oferece confirmar com o codigo do app */
  await expect(page.locator('#nivel')).toContainText('sem o código do app');
  await expect(page.locator('#subirBox')).toBeVisible();
  expect(erros).toEqual([]);
});

test('f. ativacao abandonada oferece Recomeçar, que tira so o fator nao verificado', async ({page})=>{
  await abrir(page, [{id:'fator-largado',friendly_name:'celular',factor_type:'totp',status:'unverified',created_at:'2026-10-04T12:00:00Z'}]);
  await expect(page.locator('#btRecomecar')).toBeVisible();
  await expect(page.locator('#btAtivar')).toBeHidden();
  await page.click('#btRecomecar');
  await expect(page.locator('#qrBox')).toBeVisible();
  const un = await page.evaluate(()=>window.__mfa.filter(c=>c.op==='unenroll').map(c=>c.a));
  expect(un).toEqual([{factorId:'fator-largado'}]);
  expect(await ops(page)).toContain('enroll');
});

for (const largura of [360, 390, 1280]) {
  test(`e. a ${largura}px: nenhum controle abaixo de 44 px e nenhuma rolagem horizontal`, async ({page})=>{
    await page.setViewportSize({width:largura, height:820});
    const {erros} = await abrir(page);
    const medir = () => page.evaluate(()=>{
      const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';};
      const pequenos=[...document.querySelectorAll('button,input,a')].filter(vis)
        .filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44;})
        .map(e=>(e.getAttribute('aria-label')||e.textContent||e.id).trim().slice(0,30));
      return {pequenos, W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};
    });
    for (const etapa of ['inicio','qr','pronto']) {
      if (etapa==='qr') await page.click('#btAtivar');
      if (etapa==='pronto') { await page.fill('#cod6','123456'); await page.click('#btConfirmar'); await expect(page.locator('#prontoBox')).toBeVisible(); }
      const m = await medir();
      expect(m.pequenos, `controles pequenos na etapa ${etapa}`).toEqual([]);
      expect(m.SW, `rolagem horizontal na etapa ${etapa}`).toBe(m.W);
    }
    expect(erros).toEqual([]);
  });
}

test('e. a 360px com fator verificado e com o login: 44 px e sem rolagem horizontal', async ({page})=>{
  await page.setViewportSize({width:360, height:820});
  await abrir(page, VERIFICADO);
  const medir = () => page.evaluate(()=>{
    const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
    return {p:[...document.querySelectorAll('button,input,a')].filter(vis).filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44;}).map(e=>e.textContent.trim()),
      W:document.documentElement.clientWidth, SW:document.documentElement.scrollWidth};});
  let m = await medir();
  expect(m.p).toEqual([]); expect(m.SW).toBe(m.W);
  await page.evaluate(()=>{document.getElementById('app').classList.add('hidden');document.getElementById('login').classList.remove('hidden');});
  m = await medir();
  expect(m.p, 'controles pequenos no login').toEqual([]); expect(m.SW).toBe(m.W);
});

test('g. mesma tag do supabase-js e mesma CSP do presidente.html; login nunca cria usuario', async ()=>{
  const seg=ler('seguranca.html'), pres=ler('presidente.html');
  const externos=s=>s.match(/<script[^>]*\bsrc="https?:[^"]*"[^>]*>/g)||[];
  const csp=s=>(s.match(/<meta http-equiv="Content-Security-Policy"[^>]*>/)||[])[0];
  expect(externos(seg), 'um script externo, igual ao do presidente').toEqual(externos(pres));
  expect(externos(seg).length).toBe(1);
  /* 87 fecho (s1183, 07/10/2026): o script-src do presidente leva o hash do script dele e nao tem mais
     'unsafe-inline'; o resto da politica continua igual nas duas paginas. */
  const semScript = c=>(c||'').replace(/script-src [^;]*;\s*/,'');
  expect(semScript(csp(seg)), 'CSP igual fora do script-src').toBe(semScript(csp(pres)));
  expect(csp(seg)).toMatch(/script-src 'self' [^;]*https:\/\/cdn\.jsdelivr\.net/);
  expect(csp(seg)).toBeTruthy();
  for (const c of seg.match(/signInWithOtp\([^)]*\)/g)||[]) expect(c).toContain('shouldCreateUser:false');
  /* o segredo nao vai a console, armazenamento ou banco. 102: o bloco comum:acao (igual ao do presidente) tem um
     console.error que imprime so o nome da acao, atributo estatico do HTML; o segredo entra por textContent e nunca
     vira data-*. A varredura vale fora do bloco, e o bloco so pode ter essa chamada. */
  const blocoAcao = (seg.match(/\/\* comum:acao [\s\S]*?\/\* fim comum:acao \*\//)||[''])[0];
  expect(blocoAcao.match(/console\.\w+\([^)]*\)/g)||[], 'console no bloco comum:acao').toEqual(['console.error("acao desconhecida: "+nome)']);
  expect(seg.replace(blocoAcao,'')).not.toMatch(/console\.(log|info|warn|error|debug)/);
  expect(seg).not.toMatch(/localStorage\.|sessionStorage\.|indexedDB\.|\.rpc\(|\.from\(/);
});

test('h. o presidente.html leva a pagina nova pelo rodape do trilho e da coluna', async ()=>{
  const pres=ler('presidente.html');
  /* p4.12: os links ganharam a classe so-real (somem na demonstracao) e o link da demonstracao entra antes de sair */
  expect(pres).toMatch(/<a (class="so-real" )?href="index\.html">bastidor da máquina<\/a>(<br>)?<a (class="so-real" )?href="seguranca\.html">segurança<\/a>(<br>)?(<a [^>]*>demonstração<\/a>)?<a (class="so-real" )?href="#" data-acao="sair">sair<\/a>/);
  expect(pres).toMatch(/<div class="rodape( so-real)?">[^\n]*<a href="seguranca\.html">/);
  expect(ler('seguranca.html')).toMatch(/<a [^>]*href="presidente\.html"/);
});

/* i. s1156 (07/10/2026): repositorio publico sem dado real. Nenhum arquivo versionado cita os clientes e as 7 contas
   bancarias que vazaram ate a p4.11 (o historico foi limpo com git filter-repo na mesma data). A lista vai em SHA-256,
   como a do teste da demonstracao, para nao vazar ela mesma. Conta entra como "digitos-digito"; nome, como palavra
   sem acento e em minuscula. Nome ou conta nova: gerar o hash do mesmo jeito e acrescentar. */
test('i. nenhum arquivo versionado cita cliente real ou conta bancaria real', async ()=>{
  const crypto = require('crypto');
  const {execSync} = require('child_process');
  const h = t=>crypto.createHash('sha256').update(t).digest('hex').slice(0,16);
  const PROIBIDOS = new Set(['fe7870a244a2000b','b748ad66d73dd832','4135aa9dc1b842a6','3a476a05128038e1','9064e6cd770c5a94',
    'ba015adb39a28a98','95c1beeed6102e63','bfc61013891c375f','5ecc8f8936a67fc2','119e3fa68fb36ae0','7fe752db339cecd0']);
  const raiz = path.resolve(__dirname, '..');
  const arquivos = execSync('git ls-files', {cwd: raiz, encoding: 'utf8'}).split('\n')
    .filter(f=>/\.(html|js|mjs|css|md|json|yml|yaml|txt)$/.test(f));
  expect(arquivos.length, 'git ls-files listou os arquivos').toBeGreaterThan(5);
  const varrer = (texto, lista)=>{
    const t = texto.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(), r = [];
    for (const w of new Set(t.split(/[^a-z0-9]+/))) if (w && lista.has(h(w))) r.push(h(w));
    for (const c of new Set(t.match(/\b\d{4,7}-\d\b/g) || [])) if (lista.has(h(c))) r.push(h(c));
    return r;
  };
  const achados = arquivos.flatMap(f=>varrer(fs.readFileSync(path.join(raiz, f), 'utf8'), PROIBIDOS).map(x=>f + ': ' + x));
  expect(achados, 'dado real em arquivo versionado (mostrado so o hash)').toEqual([]);
  /* o detector detecta: nome e conta ficticios, postos numa lista de teste, sao achados com acento e caixa alta */
  const ficticia = new Set([h('zzclienteficticio'), h('1234567-8')]);
  expect(varrer('Obra do ZZClienteFictício, conta 1234567-8.', ficticia).length, 'o detector acha nome e conta').toBe(2);
});

/* 102 (s1274, 08/10/2026): a pagina do segundo fator e a mais sensivel do painel e era a unica com 'unsafe-inline'
   no script-src depois do fecho do plano 87 no presidente. Agora a CSP autoriza so o hash do script desta pagina;
   os 12 handlers inline viraram data-acao/-ao-digitar/-ao-tecla despachados pelo bloco comum:acao, o mesmo do
   presidente byte a byte. Mexeu no script, rode node scripts/csp-hash.mjs. A versao s2 reprova aqui. */
test('102: CSP da seguranca sem unsafe-inline, com o hash do script; nenhum on*= e toda acao anda pelo registro', async ({page})=>{
  const crypto = require('crypto');
  const s = ler('seguranca.html').replace(/\r\n?/g,'\n');
  const scriptSrc = ((s.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/)||[])[1]||'').match(/script-src ([^;]*)/);
  expect(scriptSrc, 'achou o script-src (teste sem alvo passa vazio)').toBeTruthy();
  expect(scriptSrc[1], 'sem unsafe-inline').not.toContain("'unsafe-inline'");
  const inl = [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  expect(inl.length, 'um script inline so').toBe(1);
  const h = crypto.createHash('sha256').update(inl[0][1],'utf8').digest('base64');
  expect(scriptSrc[1], 'hash do script atual: rode node scripts/csp-hash.mjs').toContain(`'sha256-${h}'`);
  expect(s.match(/\son[a-z]+\s*=\s*["']/gi), 'on*= no fonte').toBeNull();
  const bloco = f=>(ler(f).replace(/\r\n?/g,'\n').match(/\/\* comum:acao [^\n]*\*\/\n([\s\S]*?)\/\* fim comum:acao \*\//)||[])[1];
  expect(bloco('seguranca.html'), 'tem o bloco comum:acao').toBeTruthy();
  expect(bloco('seguranca.html'), 'bloco comum:acao igual ao do presidente').toBe(bloco('presidente.html'));

  /* o script roda sob a CSP e o registro cobre toda acao declarada */
  const {erros, consola} = await abrir(page);
  const r = await page.evaluate(()=>{ const sem=[]; let n=0;
    for (const el of document.querySelectorAll('*')) { for (const a of el.attributes) if (/^on/i.test(a.name)) sem.push(el.tagName+' '+a.name);
      for (const k of ['acao','aoDigitar','aoTecla']) { const v=el.dataset[k]; if (v!==undefined) { n++; if (!Object.prototype.hasOwnProperty.call(ACOES,v)) sem.push(v); } } }
    return {sem, n, vers: typeof VERS}; });
  expect(r.vers, 'o script rodou sob a CSP').toBe('string');
  expect(r.sem, 'on* no DOM ou acao sem registro').toEqual([]);
  expect(r.n, 'as 12 acoes da pagina').toBe(12);

  /* o clique, o filtro de digitos e o Enter andam pelo despachante */
  await page.click('#btAtivar');
  await expect(page.locator('#qrBox')).toBeVisible();
  await page.locator('#cod6').pressSequentially('12a3-456');
  await expect(page.locator('#cod6'), 'so digitos, ate 6').toHaveValue('123456');
  await page.locator('#cod6').press('Enter');
  await expect(page.locator('#prontoBox'), 'Enter confirma').toBeVisible();
  expect(await ops(page)).toContain('verify');
  expect(erros).toEqual([]);
  expect(consola.filter(t=>/acao desconhecida|Content Security Policy/i.test(t))).toEqual([]);
});
