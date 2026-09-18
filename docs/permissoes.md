# Permissões do Claude Code: onde a regra mora

O problema concreto: `mcp__Supabase__execute_sql` pedindo autorização a cada
chamada. Levou quatro PRs e várias sessões porque a causa foi diagnosticada
errada três vezes. Esta página guarda o que foi **medido**, e diz de cada rota o
que é certeza e o que é aposta.

## A hierarquia, do que mais resolve para o que menos

| # | Rota | Cobre | Custo | Certeza |
| --- | --- | --- | --- | --- |
| 1 | **Modo de permissão da sessão** | todo prompt, MCP inclusive | 1 clique | **medida em sessão** |
| 2 | Allowlist em `.claude/settings.json` | só as 14 regras Supabase | já feito | funciona **quando lida a tempo** |
| 3 | `scripts/setup-nuvem.sh` no Setup script | idem, antes do boot | 1 config | **aposta**, ver ressalva |
| 4 | Server-managed settings | tudo, na organização | só Team/Enterprise | documentada, indisponível aqui |

A rota 1 é a que resolve. As outras reduzem prompt em modo Manual; nenhuma delas
elimina.

## Rota 1: o modo de permissão

É o único controle que muda o comportamento **com a sessão rodando**, pelo
dropdown de modo. Os modos e o que roda sem perguntar:

| Modo | Roda sem perguntar |
| --- | --- |
| `default` (Manual) | só leitura |
| `acceptEdits` | leitura, edição de arquivo, comandos comuns de fs |
| `auto` | tudo, com verificação de segurança em segundo plano |
| `dontAsk` | leitura e ferramentas pré-aprovadas; o resto é **negado**, não perguntado |
| `bypassPermissions` | tudo |

Em `auto` as ferramentas MCP vão para um classificador em vez de virem para
você — *"Everything else goes to the classifier"*. É o modo desenhado para
exatamente esta dor, e a documentação o indica para *"long tasks, reducing
prompt fatigue"*.

### Medido em 18/09/2026: o modo `auto` resolve, e resolve MCP

Sessão de nuvem aberta em `auto`, um repositório. Nenhum pedido de autorização em
nenhuma chamada — `list_organizations`, `execute_sql` (`select 1`),
`list_edge_functions`, e comandos `Bash` fora da allowlist (`ls`, `cat`,
`git branch`, `git reflog`).

Duas conferências para a medição não ser confundida com a rota 2:

- `list_edge_functions` **não está** na allowlist de `.claude/settings.json` e
  rodou sem prompt. Logo não foi a allowlist que cobriu.
- o reflog do container mostra o snapshot subindo em `a0f9f29` às 13:53:32 —
  commit **anterior** à allowlist — e o clone só chegando em `ff94946` às
  15:38:51. Mesmo padrão de timing do incidente descrito na rota 2: no boot, a
  allowlist não estava em disco.

A rota 1 fica confirmada no mundo real, e não só na documentação. A rota 2 segue
valendo para quem trabalha em modo Manual.

**Por que não deixar isso cravado no repo:** a documentação é explícita de que
`permissions.defaultMode` com valor `"auto"` **não tem efeito** em
`.claude/settings.json` — *"the value doesn't take effect"* — e o mesmo vale para
`"bypassPermissions"`. Sobraria `"dontAsk"`, que funciona, mas **nega** em vez de
perguntar tudo o que não estiver na allowlist: `Bash`, `Write`, `Edit` e
`WebFetch` parariam de funcionar sem aviso claro. Foi avaliado e recusado. O modo
fica no dropdown, que é decisão de quem está na sessão.

## Rota 2: a allowlist versionada, e por que ela falhou uma vez

O arquivo `.claude/settings.json` **é** lido em sessão de nuvem, e a regra dentro
dele está certa. O que falhou em 18/09/2026 foi o relógio. Reflog do container:

```
13:53:32  snapshot do ambiente com o repo em a0f9f29 (antes da allowlist existir)
          Claude Code sobe e lê as permissões desse estado
14:35:19  checkout 9728989; a allowlist chega, tarde demais
```

O ambiente restaura um snapshot do sistema de arquivos e o `git fetch` que
atualiza o clone roda **depois** do boot. A allowlist entrou em `39a6f55`,
posterior a `a0f9f29`: estava no GitHub e não estava no disco na hora que
importava. Tende a não repetir depois que o cache do ambiente reconstrói, mas
não há garantia — por isso ela é rota 2, não rota 1.

**A segunda condição, esta permanente:** a rota 2 vale para sessão de **um**
repositório. Com mais de um, a sessão começa *acima* dos clones e de cada
`.claude/settings.json` carrega só os plugins e marketplaces declarados —
*"not permission rules, hooks, `env`, or other keys"*. Nenhum acerto de timing
resolve isso; ali só a rota 1 funciona.

## Rota 3: o setup script, com a ressalva na cara

`scripts/setup-nuvem.sh`, colado em claude.ai/code → ícone do ambiente → campo
**Setup script**. É o único gancho que roda **antes do Claude Code lançar**, e o
que ele escreve em disco entra no snapshot do ambiente.

**A ressalva.** Ele escreve `/etc/claude-code/managed-settings.json`, que é
*endpoint-managed*, e a documentação diz:

> Endpoint-managed settings don't reach cloud sessions in Anthropic-hosted
> environments

Essa frase descreve o arquivo na **sua máquina**, não no container — o container
não é um endpoint gerenciado por MDM. Mas a documentação não afirma em lugar
nenhum que o arquivo do container é lido, e para ambiente self-hosted ela afirma
o contrário explicitamente. **Então é aposta, e está escrito aqui como aposta.**
Por isso o script escreve também nas configurações de usuário do container, que é
a segunda hipótese, e por isso deixa um marcador em vez de pedir fé:

```bash
cat /etc/claude-code/.origem-cerebro    # quando rodou, de onde veio, quantas regras
```

Sem esse arquivo, o script não rodou. Com ele, e ainda assim com prompt, os dois
alvos foram recusados e a rota morre — registre aqui e caia para a rota 1.

## Rota 4: server-managed settings

O caminho oficial para política em sessão de nuvem:

> **Endpoint-managed settings don't reach cloud sessions** in Anthropic-hosted
> environments, so organizations whose developers run cloud sessions should
> configure **server-managed settings** as well.

Configura-se em Admin Settings → Claude Code → Managed settings, em
claude.ai/admin-settings/claude-code, e aceita `permissions.allow`. Duas
barreiras, medidas em 18/09/2026:

- exige plano **Claude for Teams ou Enterprise** e papel **Owner / Primary Owner**;
- `~/.claude/remote-settings.json` não existia no container, ou seja, nenhuma
  política server-managed alcançou a sessão.

Se a conta migrar para Team, esta vira a rota 1 e todo o resto desta página vira
história.

## O que NÃO funciona, para ninguém tentar de novo

| Tentativa | Por quê |
| --- | --- |
| `~/.claude/settings.json` | sessão de nuvem: *"not read"*. O PR #7 nasceu morto para a nuvem |
| botão *sempre permitir* do prompt | grava em `.claude/settings.local.json`, que a nuvem não lê e o `.gitignore` descarta |
| gravar qualquer settings durante a sessão | a permissão é lida uma vez, no boot. Medido: não tirou um único prompt |
| hook `SessionStart` que instala a regra | roda *"After Claude Code launches"*, depois da leitura que tentaria alterar |

## O que fica de fora da allowlist, de propósito

`get_publishable_keys` (devolve chave), `create_project`, `pause_project`,
`restore_project`, `deploy_edge_function` e o ciclo de branches
(`create` / `merge` / `reset` / `delete`). Caro ou irreversível continua pedindo
confirmação — é a última barreira antes de um estrago silencioso. Em modo `auto`
essas ficam com o classificador; se isso incomodar, o lugar de barrar é
`permissions.deny`, não a ausência na allowlist.

## Sessões locais fora deste repo

As configurações de usuário valem em qualquer diretório da **sua máquina** — e só
dela. Rode uma vez, a partir de um clone deste repositório:

```bash
node scripts/permissoes-usuario.mjs --conferir   # mostra o que faria
node scripts/permissoes-usuario.mjs              # aplica
```

Funde as regras `mcp__Supabase__*` no seu `~/.claude/settings.json`, preservando
o que já estiver lá. Backup carimbado, idempotente, aborta sem tocar em nada se o
JSON de destino estiver corrompido. `--todas` leva também as regras `Bash(git ...)`.
Recusa rodar em sessão de nuvem, onde não teria efeito.

**Vale a partir da próxima sessão**, porque a permissão é lida no boot.

## Sintaxe, para quando você editar à mão

- `"mcp__Supabase__execute_sql"` — nome puro da ferramenta, sem parênteses:
  cobre qualquer chamada dela, com qualquer query.
- `"Bash(git status:*)"` — prefixo: casa `git status` e o que vier depois.
- Uma regra literal longa demais casa com uma invocação só e não serve para
  nada. Foi o caso da regra de commit que saiu na limpeza de setembro/2026.
