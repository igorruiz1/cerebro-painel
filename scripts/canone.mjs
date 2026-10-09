// Remede as réguas de tela do docs/canone.md (plano 106, s1274 · 08/10/2026). Rode `npm run canone` a cada versão
// nova do presidente.html: o JSON sai no terminal e a sessão grava na evolucao (escopo 00-memoria, prefixo
// painel.presidente_). As réguas de julgamento (série, banda, BSC...) continuam pontuadas à mão no docs/canone.md.
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {chromium} = require('@playwright/test');
const {medirCanone} = require('../testes/_canone.js');

const browser = await chromium.launch();
try {
  const m = await medirCanone(browser);
  if (m.erros.length) { console.error(m.erros.join('\n')); process.exitCode = 1; }
  console.log(JSON.stringify(m, null, 1));
} finally {
  await browser.close();
}
