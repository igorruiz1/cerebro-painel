#!/usr/bin/env node
// Leva a allowlist do Supabase deste repo para as configuracoes de USUARIO do
// Claude Code (~/.claude/settings.json), que valem em qualquer diretorio DA SUA
// MAQUINA.
//
// Existe porque .claude/settings.json so e lido quando a sessao abre DENTRO
// deste repositorio. Fora dele — outro projeto, outra pasta — a regra some e o
// execute_sql volta a pedir autorizacao a cada chamada.
//
// NAO SERVE PARA SESSAO DE NUVEM. Sessao de nuvem nao le ~/.claude/settings.json
// (a documentacao diz "not read") e le as permissoes so no boot, antes de este
// script ter chance de rodar. La a regra entra por scripts/setup-nuvem.sh, no
// campo Setup script do ambiente. Ver docs/permissoes.md.
//
//   node scripts/permissoes-usuario.mjs --conferir   # mostra o que faria
//   node scripts/permissoes-usuario.mjs              # aplica
//   node scripts/permissoes-usuario.mjs --todas      # leva tambem as regras Bash
//
// Idempotente: rodar duas vezes nao duplica nada. Faz backup antes de escrever
// e aborta sem tocar no arquivo se o JSON de destino estiver corrompido.

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = new Set(process.argv.slice(2))
const conferir = args.has('--conferir')
const todas = args.has('--todas')

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const origem = join(raiz, '.claude', 'settings.json')
const destino = join(homedir(), '.claude', 'settings.json')

function lerJson(caminho, rotulo) {
  let bruto
  try {
    bruto = readFileSync(caminho, 'utf8')
  } catch (erro) {
    if (erro.code === 'ENOENT') return null
    throw new Error(`nao consegui ler ${rotulo} (${caminho}): ${erro.message}`)
  }
  if (bruto.trim() === '') return {}
  try {
    return JSON.parse(bruto)
  } catch (erro) {
    throw new Error(
      `${rotulo} (${caminho}) nao e JSON valido: ${erro.message}\n` +
        'Nada foi alterado. Corrija o arquivo e rode de novo.'
    )
  }
}

// Carimbo em America/Cuiaba: o backup precisa bater com o relogio do Igor.
function carimbo() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Cuiaba',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(new Date())
      .filter((x) => x.type !== 'literal')
      .map((x) => [x.type, x.value])
  )
  return `${p.year}-${p.month}-${p.day}-${p.hour}${p.minute}`
}

// Erro previsto (arquivo corrompido, sem permissao de escrita) sai como uma
// mensagem que se le, nao como stack trace.
process.on('uncaughtException', (erro) => {
  console.error(`\n${erro.message}`)
  process.exit(1)
})

const doRepo = lerJson(origem, 'a allowlist do repo')
if (!doRepo) {
  console.error(`Nao achei ${origem}. Rode a partir de um clone do cerebro-painel.`)
  process.exit(1)
}

// O repo diz QUAIS ferramentas liberar; a maquina diz ONDE elas moram.
//
// A allowlist versionada nomeia o servidor `Supabase`, que e como a sessao de
// NUVEM o registra. Na maquina do Igor ele nao se chama assim: o conector da
// conta entra com o UUID da instancia e o plugin entra como
// `plugin_<plugin>_<servidor>`. Copiar a regra da nuvem para ca escreve um JSON
// valido que nao casa com nada e nao da erro nenhum — foi o que aconteceu em
// 18/09/2026. Por isso o prefixo e DESCOBERTO aqui, nunca escrito no repo:
// descoberto sobrevive ao UUID mudar quando o conector e reinstalado, e nenhum
// identificador de conta entra num repositorio publico.
const FERRAMENTAS_ASSINATURA = ['execute_sql', 'list_tables', 'apply_migration']

// De onde vem a descoberta: os transcripts das sessoes locais. Os servidores MCP
// do app de desktop nao aparecem em ~/.claude.json (`mcpServers` vem vazio) nem
// em manifesto de plugin — medido em 18/09/2026. O unico registro em disco do
// nome como a SESSAO o enxerga sao os proprios transcripts.
function descobrirServidores() {
  const raizProjetos = join(homedir(), '.claude', 'projects')
  if (!existsSync(raizProjetos)) return []

  const transcripts = []
  for (const pasta of readdirSync(raizProjetos)) {
    const cheio = join(raizProjetos, pasta)
    if (!statSync(cheio).isDirectory()) continue
    for (const arq of readdirSync(cheio)) {
      if (!arq.endsWith('.jsonl')) continue
      const caminho = join(cheio, arq)
      transcripts.push({ caminho, quando: statSync(caminho).mtimeMs })
    }
  }
  transcripts.sort((a, b) => b.quando - a.quando)

  // Oito basta: o que o servidor expoe nao muda a cada sessao, e ler o historico
  // inteiro so custa tempo.
  const porServidor = new Map()
  const padrao = /"mcp__([A-Za-z0-9_.-]+?)__([A-Za-z0-9_]+)"/g
  for (const { caminho } of transcripts.slice(0, 8)) {
    const texto = readFileSync(caminho, 'utf8')
    let achado
    while ((achado = padrao.exec(texto)) !== null) {
      if (!porServidor.has(achado[1])) porServidor.set(achado[1], new Set())
      porServidor.get(achado[1]).add(achado[2])
    }
  }

  // Duas das tres marcas bastam para identificar. Uma so daria falso positivo com
  // qualquer servidor de banco; as tres juntas exigiriam que o Supabase tivesse
  // sido exercitado por inteiro. Medido em 18/09/2026: dois servidores casam,
  // nenhum falso positivo entre os 23 registrados.
  const casam = []
  for (const [servidor, ferramentas] of porServidor) {
    const marcas = FERRAMENTAS_ASSINATURA.filter((f) => ferramentas.has(f))
    if (marcas.length >= 2) casam.push(servidor)
  }
  return casam.sort()
}

// A politica — QUAIS ferramentas — continua vindo do repo, revisada em PR.
const ferramentasDaPolitica = (doRepo.permissions?.allow ?? [])
  .filter((regra) => regra.startsWith('mcp__Supabase__'))
  .map((regra) => regra.slice('mcp__Supabase__'.length))

const outrasRegras = (doRepo.permissions?.allow ?? []).filter(
  (regra) => !regra.startsWith('mcp__Supabase__')
)

const forcados = [...args]
  .filter((a) => a.startsWith('--servidor='))
  .map((a) => a.slice('--servidor='.length).replace(/^mcp__|__$/g, ''))

const servidores = forcados.length > 0 ? forcados : descobrirServidores()

if (servidores.length === 0) {
  console.error(
    `Nao achei nenhum servidor Supabase nos transcripts desta maquina.
Isso acontece em maquina nova, ou se o Supabase ainda nao foi usado aqui.
Use o Supabase uma vez e rode de novo, ou passe o prefixo na mao:
  node scripts/permissoes-usuario.mjs --servidor=mcp__NOME__`
  )
  process.exit(1)
}

const candidatas = [
  ...servidores.flatMap((s) => ferramentasDaPolitica.map((f) => `mcp__${s}__${f}`)),
  ...(todas ? outrasRegras : []),
]
if (candidatas.length === 0) {
  console.error('A allowlist do repo nao tem nenhuma regra para levar. Nada a fazer.')
  process.exit(1)
}

// Rodar isto numa sessao de nuvem nao resolve nada e da a falsa sensacao de ter
// resolvido. Avisar e mais util do que escrever um arquivo que ninguem vai ler.
if (process.env.CLAUDE_CODE_REMOTE === 'true' || process.env.CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE) {
  console.error(
    'Isto aqui e uma sessao de NUVEM, que nao le ~/.claude/settings.json.\n' +
      'Escrever o arquivo agora nao tira nenhum pedido de autorizacao.\n' +
      'O caminho da nuvem e scripts/setup-nuvem.sh no campo Setup script do\n' +
      'ambiente em claude.ai/code. Ver docs/permissoes.md.\n\n' +
      'Para escrever assim mesmo (teste do proprio script): --forcar'
  )
  if (!args.has('--forcar')) process.exit(1)
}

const atual = lerJson(destino, 'suas configuracoes de usuario') ?? {}
const jaTem = new Set(atual.permissions?.allow ?? [])
const faltando = candidatas.filter((regra) => !jaTem.has(regra))

console.log(`Origem : ${origem}`)
console.log(`Destino: ${destino}`)
console.log(`Servidores Supabase nesta maquina: ${servidores.length}`)
for (const s of servidores) console.log(`  mcp__${s}__`)
console.log(
  `Regras consideradas: ${candidatas.length}` +
    ` (${ferramentasDaPolitica.length} ferramentas x ${servidores.length} servidores` +
    `${todas ? ` + ${outrasRegras.length} regras Bash` : ''})`
)

if (faltando.length === 0) {
  console.log('\nJa esta tudo la. Nada a escrever.')
  process.exit(0)
}

console.log(`\nA acrescentar (${faltando.length}):`)
for (const regra of faltando) console.log(`  + ${regra}`)

if (conferir) {
  console.log('\n--conferir: nenhum arquivo foi tocado.')
  process.exit(0)
}

const novo = {
  ...atual,
  permissions: {
    ...(atual.permissions ?? {}),
    allow: [...(atual.permissions?.allow ?? []), ...faltando],
  },
}

mkdirSync(dirname(destino), { recursive: true })
if (existsSync(destino)) {
  const backup = `${destino}.backup-${carimbo()}`
  copyFileSync(destino, backup)
  console.log(`\nBackup: ${backup}`)
}
writeFileSync(destino, `${JSON.stringify(novo, null, 2)}\n`, 'utf8')
console.log('Escrito. Abra uma sessao nova do Claude Code para valer.')
