// Onda 1 / t5095 (s12164, 23/10/2026): o alarme de fora do banco existe e e do tipo certo.
// Reprova o main de 22/10 (sem o workflow). O ensaio de falha de verdade e o workflow_dispatch com URL errada.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const f = path.join(__dirname, '..', '.github', 'workflows', 'vigia-banco-externo.yml');

test('vigia-banco-externo: a cada 6 h, endpoint de leitura, chave so em segredo', () => {
  expect(fs.existsSync(f), 'falta .github/workflows/vigia-banco-externo.yml').toBe(true);
  const y = fs.readFileSync(f, 'utf8');
  // ordem do Igor 06/11/2026 (s25642): a cada 6 h, um minuto fixo so; reprova o main de 30 min ("7,37 * * * *")
  const crons = [...y.matchAll(/cron:\s*"([^"]+)"/g)].map(m => m[1]);
  expect(crons.length, 'um cron so').toBe(1);
  expect(crons[0], 'intervalo de 6 h').toMatch(/^\d{1,2} \*\/6 \* \* \*$/);
  expect(y).toContain('/rest/v1/rpc/cron_saude_externa');
  expect(y).toContain('secrets.CEREBRO_SUPABASE_KEY');
  expect(y).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}|sb_publishable_[A-Za-z0-9_-]{10,}|sb_secret_/);   // chave nunca em arquivo
  expect(y).toMatch(/exit 1/);                                                    // falha = alarme
  expect(y).toContain('workflow_dispatch');                                       // ensaio de falha com URL errada
});

// t6544 (s14363, 25/10/2026): a porta anon so responde com token; o vault guarda so o sha256. Reprova o main de 24/10 (corpo '{}').
test('vigia-banco-externo: manda o token do segredo CEREBRO_VIGIA_TOKEN', () => {
  const y = fs.readFileSync(f, 'utf8');
  expect(y).toContain('secrets.CEREBRO_VIGIA_TOKEN');
  expect(y).toMatch(/"p_token"/);
  expect(y).not.toMatch(/-d '\{\}'/);                                              // chamada sem token nao passa mais
  expect(y).not.toMatch(/\b[0-9a-f]{64}\b/);                                       // token nunca em arquivo
});
