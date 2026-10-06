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
  expect(csp(seg), 'CSP igual').toBe(csp(pres));
  expect(csp(seg)).toBeTruthy();
  for (const c of seg.match(/signInWithOtp\([^)]*\)/g)||[]) expect(c).toContain('shouldCreateUser:false');
  /* o segredo nao vai a console, armazenamento ou banco */
  expect(seg).not.toMatch(/console\.(log|info|warn|error|debug)/);
  expect(seg).not.toMatch(/localStorage\.|sessionStorage\.|indexedDB\.|\.rpc\(|\.from\(/);
});

test('h. o presidente.html leva a pagina nova pelo rodape do trilho e da coluna', async ()=>{
  const pres=ler('presidente.html');
  expect(pres).toMatch(/<a href="index\.html">bastidor da máquina<\/a>(<br>)?<a href="seguranca\.html">segurança<\/a>(<br>)?<a href="#" onclick="sair\(\);return false">sair<\/a>/);
  expect(pres).toMatch(/<div class="rodape">[^\n]*<a href="seguranca\.html">/);
  expect(ler('seguranca.html')).toMatch(/<a [^>]*href="presidente\.html"/);
});
