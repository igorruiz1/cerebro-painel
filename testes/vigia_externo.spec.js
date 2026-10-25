// Onda 1 / t5095 (s12164, 23/10/2026): o alarme de fora do banco existe e e do tipo certo.
// Reprova o main de 22/10 (sem o workflow). O ensaio de falha de verdade e o workflow_dispatch com URL errada.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const f = path.join(__dirname, '..', '.github', 'workflows', 'vigia-banco-externo.yml');

test('vigia-banco-externo: a cada 30 min, endpoint de leitura, chave so em segredo', () => {
  expect(fs.existsSync(f), 'falta .github/workflows/vigia-banco-externo.yml').toBe(true);
  const y = fs.readFileSync(f, 'utf8');
  expect(y).toMatch(/cron:\s*"\d+(,\d+)?\s+\*\s+\*\s+\*\s+\*"/);                 // minuto fixo(s), toda hora
  const min = y.match(/cron:\s*"([\d,]+) \* \* \* \*"/)[1].split(',').map(Number);
  expect(min.length === 2 && Math.abs(min[1] - min[0]) === 30, 'intervalo de 30 min').toBe(true);
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
