// contexto.mjs · fonte: igor-cerebro-plugin/plugins/igor-cerebro/scripts/contexto.mjs · sha256-corpo: 1233030852619ec8b1d8e4f87b3f85ba8cd5bcf17fdc2cd54f31f399b7863385
// Guarda de contexto da simbiose (fato 2023, 13/10/2026).
//
// Por que existe: a auditoria de 13/10 mediu que 73% do custo foi RELEITURA de
// contexto (media de 250k por chamada; 70 de 92 sessoes passaram de 300k). A
// regra "perto de 150k, redigir o bastao" dependia de o modelo lembrar sozinho.
// Aqui ela vira maquina.
//
//   node contexto.mjs status            linha de status (statusLine): le o JSON
//                                       do Claude Code no stdin, mostra o contexto
//                                       e grava o numero para o modo aviso.
//   node contexto.mjs aviso [--plugin]  gatilho UserPromptSubmit: em 120k avisa
//                                       uma vez; de 150k em diante avisa a cada
//                                       mensagem. Nunca bloqueia (decisao do Igor
//                                       em 13/10: a mensagem dele nao se perde).
//
// O aviso le o numero da linha de status quando ela existe; senao, do proprio
// transcript (campo usage da ultima resposta). Assim funciona tambem onde a linha
// de status nao roda (nuvem, plugin sem settings de usuario).
//
// --plugin: e o gatilho que o plugin instala. Fica calado se o repo aberto ja
// tem a copia em .claude/contexto.mjs, para o Igor nao receber o aviso dobrado.
//
// Limites trocaveis por ambiente: CEREBRO_CTX_AVISO (120000) e
// CEREBRO_CTX_BASTAO (150000).
//
// COPIAS: cerebro-painel, cerebro-backup e igor-cerebro-plugin tem esta mesma
// copia em .claude/contexto.mjs, porque sessao de nuvem nao instala plugin. Mexeu
// aqui: rode `python3 skills/igor-plugin-empacotar/scripts/validar.py . --carimbar`
// e copie o arquivo para os 3 repos. A primeira linha leva o hash do corpo; o
// validador e o teste do painel reprovam copia editada a mao.

import { readFileSync, writeFileSync, existsSync, openSync, readSync, fstatSync, closeSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const AVISO = Number(process.env.CEREBRO_CTX_AVISO) || 120000
const BASTAO = Number(process.env.CEREBRO_CTX_BASTAO) || 150000
const VALIDADE_MS = 10 * 60 * 1000

function lerStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}')
  } catch {
    return {}
  }
}

const estadoDe = (sessao) => join(tmpdir(), `cerebro-ctx-${String(sessao || 'sem-sessao').replace(/[^A-Za-z0-9_-]/g, '')}.json`)

function lerEstado(sessao) {
  try {
    return JSON.parse(readFileSync(estadoDe(sessao), 'utf8'))
  } catch {
    return {}
  }
}

function gravarEstado(sessao, estado) {
  try {
    writeFileSync(estadoDe(sessao), JSON.stringify(estado))
  } catch {
    // Sem disco para o estado: o aviso cai no transcript. Nao derruba nada.
  }
}

const somaUso = (u) =>
  u ? (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) : 0

// Le so o fim do transcript: um JSONL de sessao longa passa de dezenas de MB e
// este gatilho roda a cada mensagem.
function tokensDoTranscript(caminho) {
  if (!caminho || !existsSync(caminho)) return 0
  let fd
  try {
    fd = openSync(caminho, 'r')
    const tamanho = fstatSync(fd).size
    const janela = Math.min(tamanho, 512 * 1024)
    const buf = Buffer.alloc(janela)
    readSync(fd, buf, 0, janela, tamanho - janela)
    const linhas = buf.toString('utf8').split('\n').reverse()
    for (const linha of linhas) {
      if (!linha.includes('"usage"')) continue
      try {
        const ev = JSON.parse(linha)
        if (ev.isSidechain) continue
        const n = somaUso(ev.message?.usage)
        if (n > 0) return n
      } catch {
        // linha cortada no comeco da janela
      }
    }
  } catch {
    return 0
  } finally {
    if (fd !== undefined) closeSync(fd)
  }
  return 0
}

const k = (n) => `${Math.round(n / 1000)}k`

function status() {
  const e = lerStdin()
  const cw = e.context_window || {}
  let n = somaUso(cw.current_usage)
  if (!n && cw.used_percentage != null && cw.context_window_size) {
    n = Math.round((cw.used_percentage / 100) * cw.context_window_size)
  }
  if (!n) n = tokensDoTranscript(e.transcript_path)
  const anterior = lerEstado(e.session_id)
  gravarEstado(e.session_id, { ...anterior, tokens: n, em: Date.now() })
  const marca = n >= BASTAO ? ' · BASTAO' : n >= AVISO ? ' · prepare o bastao' : ''
  const modelo = e.model?.display_name ? `${e.model.display_name} · ` : ''
  process.stdout.write(`${modelo}ctx ${k(n)}/${k(BASTAO)}${marca}`)
}

function aviso(doPlugin) {
  const e = lerStdin()
  if (doPlugin) {
    const projeto = process.env.CLAUDE_PROJECT_DIR || e.cwd
    if (projeto && existsSync(join(projeto, '.claude', 'contexto.mjs'))) return
  }
  const estado = lerEstado(e.session_id)
  const fresco = estado.tokens && Date.now() - (estado.em || 0) < VALIDADE_MS
  const n = Math.max(fresco ? estado.tokens : 0, tokensDoTranscript(e.transcript_path))
  let texto = ''
  if (n >= BASTAO) {
    texto =
      `CONTEXTO ${k(n)}, acima de ${k(BASTAO)} (fato 2023, regra de economia do Igor). ` +
      'Termine so o passo em curso, redija o bastao (resultado + pauta seguinte com datas) ' +
      'e peca ao Igor uma sessao nova. Nao comece tarefa nova nesta sessao.'
  } else if (n >= AVISO && !estado.avisou) {
    texto =
      `CONTEXTO ${k(n)}: faltam cerca de ${k(BASTAO - n)} para o bastao (fato 2023). ` +
      'Feche o que esta aberto e prepare o bastao; nao abra frente nova.'
    gravarEstado(e.session_id, { ...estado, avisou: true })
  }
  if (!texto) return
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: texto } })
  )
}

const [modo, ...resto] = process.argv.slice(2)
try {
  if (modo === 'status') status()
  else if (modo === 'aviso') aviso(resto.includes('--plugin'))
  else {
    console.error('uso: node contexto.mjs status | aviso [--plugin]')
    process.exit(2)
  }
} catch {
  // Guarda de economia nunca pode travar a sessao: falhou, fica calada.
}
