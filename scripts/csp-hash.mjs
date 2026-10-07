// Recalcula o hash da CSP do presidente.html (plano 87, fecho · s1183, 07/10/2026).
// O script inline do presidente roda sem 'unsafe-inline': a CSP autoriza so o hash dele.
// Mexeu no <script> do presidente? Rode `node scripts/csp-hash.mjs` antes do commit; o teste "87 fecho" cobra.
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const arq = new URL('../presidente.html', import.meta.url);
const raw = readFileSync(arq, 'utf8');
const crlf = raw.includes('\r\n');
// O parser do HTML troca CRLF e CR por LF antes de o navegador calcular o hash: o working tree (CRLF)
// e o arquivo servido (LF) dao o mesmo hash so se ele for calculado sobre o texto em LF.
let s = raw.replace(/\r\n?/g, '\n');
const inline = [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (inline.length !== 1) throw new Error(`esperava 1 script inline no presidente.html, achei ${inline.length}`);
const h = "'sha256-" + createHash('sha256').update(inline[0][1], 'utf8').digest('base64') + "'";

const antes = s;
s = s.replace(/(<meta http-equiv="Content-Security-Policy" content="[^"]*?script-src 'self' )('sha256-[A-Za-z0-9+/=]+'|'unsafe-inline')( )/,
              (_, a, _velho, b) => a + h + b);
if (!s.includes(h)) throw new Error('script-src da CSP do presidente.html nao casou');
if (s !== antes) writeFileSync(arq, crlf ? s.replace(/\n/g, '\r\n') : s);
console.log(s === antes ? `ja estava: ${h}` : `gravado: ${h}`);
