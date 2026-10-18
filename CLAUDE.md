# cerebro-painel

Os artefatos são o `presidente.html`, a casa (o `manifest.json` abre nele), e o `index.html`, o
bastidor da máquina (aberto pelo rodapé do presidente). O resto do repo existe para testá-los e
documentá-los. A régua de mercado do presidente está em `docs/canone.md`.

## Antes de escrever qualquer linha

Duas sessões trabalharam em paralelo aqui e 194 linhas foram jogadas fora. Então,
no começo de toda sessão, nesta ordem:

```bash
git fetch --all --prune
git log origin/main -5 --oneline
curl -s https://api.github.com/repos/igorruiz1/cerebro-painel/pulls?state=open
```

O `gh` **não existe** na máquina do Igor — use a API, como acima. Branch
`claude/*` sem PR aberto é resto de squash merge, não trabalho em curso. Se houver PR tocando um arquivo que você vai mexer,
**entre nele** — commit na branch dele. Abrir PR concorrente sobre o mesmo
arquivo é perda garantida.

## Economia de contexto (fato 2023, 13/10/2026)

A auditoria de 13/10 mediu que 73% do custo foi releitura de contexto. Por isso:

- **1 sessão = 1 tarefa = 1 repo.** Sessão de nuvem com mais de um repo não carrega o gatilho de
  nenhum (doc oficial, cloud-environments). Outro repo entra só quando a tarefa pede (`add_repo`).
  O `cerebro-backup` roda sozinho no Actions e só entra em sessão para mexer no workflow.
- **Bastão perto de 150k.** `.claude/contexto.mjs` mostra o contexto na linha de status e avisa
  em 120k e a cada mensagem de 150k em diante. Ele é cópia: a fonte está no `igor-cerebro-plugin`
  (`plugins/igor-cerebro/scripts/contexto.mjs`), e a cópia nunca se edita aqui.
- **Subagente sempre em Sonnet**, Explore e Plan incluídos. Na máquina do Igor vem do `env` do
  `.claude/settings.json` (`CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`, exige Claude Code v2.1.257+). Na nuvem,
  env, statusLine e hooks do settings são ignorados (fato 2071): o Sonnet vem das Variáveis de ambiente do
  ambiente (medido na s4734), e toda chamada de subagente (Agent/Task) passa `model: "sonnet"` como reforço;
  o parâmetro na chamada vence tudo (doc oficial sub-agents). Contexto: na nuvem a regra dos 150k é manual.
  Opus fica para decisão, na conversa principal.
- PDF ou imagem grande nunca se lê inteiro; resultado grande vai para arquivo.

## Abertura e fechamento no banco (s7472, 18/10/2026)

O banco do cérebro é a fonte, e a regra de fechamento mora só nele (`runtime.fechamento`). Quem pula a
abertura nunca lê essa regra: a s7472 (tarefa só de código, sem SIMBIOSE) não abriu o banco, passou de
150k e fechou com bastão escrito à mão. Por isso, em **toda** sessão, inclusive de código:

- **Primeiro ato:** `select entrar('<frente>')` (frente da pauta ou do assunto). As INSTRUCOES que ele
  devolve valem: `registrar_ack` antes da 1ª escrita, sessão e token em toda escrita.
- **Último ato:** `fechar_rodada(...)` e `fechar_sessao(..., p_sessao_id, p_token)`. Ao Igor vai, em
  bloco de código, o bloco que o banco devolve. **Bastão à mão é defeito**, mesmo com conteúdo certo.
- `p_proxima` substitui a pauta da frente: leia `handoff->>'proxima'` antes e preserve o que é de
  outras sessões.
- Sem banco, a sessão não afirma estado (modo cego). Na nuvem o `guarda-bastao.js` do PC não roda
  (fato 2071): aqui a regra é manual.

## Nuvem e local não são o mesmo ambiente

O mesmo servidor MCP tem nomes diferentes nas duas superfícies, e a regra de
permissão é casada por nome. Confundir as duas escreve um arquivo válido que não
faz nada — sem erro, sem aviso.

| | Sessão de nuvem | Máquina do Igor |
| --- | --- | --- |
| Arquivo que vale | `.claude/settings.json` do repo | `~/.claude/settings.json` |
| Prefixo do Supabase | `mcp__Supabase__` | `mcp__<uuid>__` e `mcp__plugin_<plugin>_<servidor>__` |

A allowlist versionada é a **política** — quais ferramentas. O prefixo é
**endereço** e se descobre na máquina, nunca se escreve aqui.

**Nenhum identificador de conta em arquivo versionado.** Este repo é público:
UUID de conector, id de organização e afins ficam fora. Se uma regra precisa de
um, o script descobre em tempo de execução.

## Permissões

`docs/permissoes.md` é a fonte. Leia antes de propor qualquer coisa sobre
autorização, allowlist ou modo de sessão.

A página tem uma seção "O que NÃO funciona, para ninguém tentar de novo". O que
está lá foi medido e derrubado: não reabra, não reproponha, não "tente de novo
só para confirmar". Se medir algo que contradiz a página, o commit é **na
página**, trocando a linha antiga pelo fato novo com a data.

## Convenção de PR

- PR sempre **draft**.
- Merge por **squash**.
- CI `fumaça` verde antes do merge — sem exceção. Ela roda em todo push e toda
  proposta de mudança e existe porque quatro versões do painel caíram pela mesma
  classe de defeito. Medido em 08/10/2026 com 181 testes (p4.30): `npm run teste`
  leva ~78 s local (2 workers). Em 04/10, com 79 testes, eram ~26 s local e ~1 min
  de job na CI.
- Rodar local antes de empurrar: `npm run teste`.
- Versão nova do `presidente.html`: `const VERP` e `version.json` mudam juntos. A página
  confere a versão pelo `version.json`; esquecido, ela oferece ao Igor a versão velha (teste p4.20 cobra).
- Versão nova do `presidente.html`: `npm run canone` remede as réguas de tela de `docs/canone.md`;
  grave o JSON na `evolucao` (prefixo `painel.presidente_`). O teste "106" reprova a tela que incha além do piso.
- Mexeu no `<script>` do `presidente.html` ou da `seguranca.html`: `node scripts/csp-hash.mjs` antes do commit. A CSP
  de cada uma autoriza só o hash do próprio script, sem `unsafe-inline` (plano 87 em 07/10/2026, plano 102 em
  08/10/2026); hash velho = página em branco (testes "87 fecho" e "102" cobram). Ação de tela vai em `data-acao`, nunca
  em `on*=`.

## Escrita

PT-BR, direto, sem enfeite. Documento explica **por que**, não só o quê — um
número medido vale mais que um parágrafo de intenção.
